import type { ChatMessage, Reactions, Room } from "@/lib/types";
import { saveMessage, getMessageHistory } from "@/lib/db";

type Subscriber = {
  username: string;
  controller: ReadableStreamDefaultController;
};

type RoomState = {
  userCounts: Map<string, number>;
  history: ChatMessage[];           // warm cache — source of truth is the DB
  subscribers: Set<Subscriber>;
};

// ─── Rooms (in-memory, restored from DB on first access) ─────────────────────

const rooms = new Map<string, RoomState>();

// ─── User interests (rooms each user has visited this server session) ─────────
// Used to deliver cross-room notifications without a separate SSE connection.

const userInterests = new Map<string, Set<string>>();

function addUserInterest(username: string, room: string) {
  if (!userInterests.has(username)) userInterests.set(username, new Set());
  userInterests.get(username)!.add(room);
}

function initRoom(name: string) {
  if (!rooms.has(name)) {
    const history = getMessageHistory(name, 50); // hydrate from DB
    rooms.set(name, { userCounts: new Map(), history, subscribers: new Set() });
  }
}

["general", "random", "help"].forEach(initRoom);

// ─── Reactions (ephemeral — reset on server restart) ─────────────────────────

// msgId → emoji → Set<username>
const reactionsMap = new Map<string, Map<string, Set<string>>>();

export function toggleReaction(
  msgId: string,
  emoji: string,
  username: string
): { emoji: string; users: string[] } {
  if (!reactionsMap.has(msgId)) reactionsMap.set(msgId, new Map());
  const byEmoji = reactionsMap.get(msgId)!;
  if (!byEmoji.has(emoji)) byEmoji.set(emoji, new Set());
  const users = byEmoji.get(emoji)!;
  if (users.has(username)) users.delete(username);
  else users.add(username);
  if (users.size === 0) byEmoji.delete(emoji);
  return { emoji, users: [...users] };
}

export function getReactions(msgId: string): Reactions {
  const byEmoji = reactionsMap.get(msgId);
  if (!byEmoji) return {};
  const result: Reactions = {};
  for (const [emoji, users] of byEmoji) {
    if (users.size > 0) result[emoji] = [...users];
  }
  return result;
}

// ─── SSE helpers ─────────────────────────────────────────────────────────────

function push(controller: ReadableStreamDefaultController, event: object) {
  controller.enqueue(`data: ${JSON.stringify(event)}\n\n`);
}

export function getRoomList(): Room[] {
  return [...rooms.entries()]
    .filter(([name]) => !name.startsWith("dm:"))
    .map(([name, r]) => ({
      name,
      userCount: r.userCounts.size,
    }));
}

function broadcastToRoom(roomName: string, event: object, exclude?: string) {
  const room = rooms.get(roomName);
  if (!room) return;
  const dead: Subscriber[] = [];
  for (const sub of room.subscribers) {
    if (sub.username === exclude) continue;
    try { push(sub.controller, event); } catch { dead.push(sub); }
  }
  dead.forEach((s) => room.subscribers.delete(s));
}

export function broadcastRoomListToAll() {
  const event = { type: "room_list", rooms: getRoomList() };
  for (const room of rooms.values()) {
    const dead: Subscriber[] = [];
    for (const sub of room.subscribers) {
      try { push(sub.controller, event); } catch { dead.push(sub); }
    }
    dead.forEach((s) => room.subscribers.delete(s));
  }
}

export function broadcastUserList(roomName: string) {
  const room = rooms.get(roomName);
  if (!room) return;
  broadcastToRoom(roomName, { type: "user_list", users: [...room.userCounts.keys()] });
}

export function broadcastMessage(roomName: string, msg: ChatMessage, exclude?: string) {
  broadcastToRoom(roomName, msg, exclude);
}

export function broadcastReaction(roomName: string, event: object) {
  broadcastToRoom(roomName, event);
}

export function broadcastTyping(roomName: string, username: string) {
  broadcastToRoom(roomName, { type: "typing", name: username }, username);
}

/** Deliver an event directly to all active SSE connections for `username`. */
export function sendToUser(username: string, event: object) {
  const data = `data: ${JSON.stringify(event)}\n\n`;
  for (const room of rooms.values()) {
    for (const sub of room.subscribers) {
      if (sub.username === username) {
        try { sub.controller.enqueue(data); } catch {}
      }
    }
  }
}

export function addToHistory(roomName: string, msg: ChatMessage) {
  initRoom(roomName);
  const room = rooms.get(roomName)!;
  room.history.push(msg);
  if (room.history.length > 50) room.history.shift();
  saveMessage(roomName, msg); // persist to SQLite

  // ── Cross-room notifications ──────────────────────────────────────────────
  // Don't notify for system messages (join/leave noise).
  if (msg.type === "system") return;

  const senderName = "name" in msg ? msg.name : null;
  const notifyEvent = { type: "notify", room: roomName };

  if (roomName.startsWith("dm:")) {
    // DM: always notify the recipient, regardless of where they are.
    const [, u1, u2] = roomName.split(":");
    const recipient = senderName === u1 ? u2 : u1;
    sendToUser(recipient, notifyEvent);
  } else {
    // Channel: notify users who have visited this room this session but are
    // currently subscribed to a different room (so they can see the badge).
    for (const [uname, interests] of userInterests) {
      if (uname === senderName) continue; // don't notify the sender
      if (!interests.has(roomName)) continue; // user never visited this room
      const isCurrentlyHere = [...room.subscribers].some(
        (s) => s.username === uname
      );
      if (!isCurrentlyHere) sendToUser(uname, notifyEvent);
    }
  }
}

/** Return history with current reaction counts attached. */
export function getHistoryWithReactions(roomName: string): ChatMessage[] {
  const room = rooms.get(roomName);
  if (!room) return [];
  return room.history.map((msg) => {
    if ("msgId" in msg) {
      return { ...msg, reactions: getReactions(msg.msgId) };
    }
    return msg;
  });
}

export function subscribe(
  roomName: string,
  username: string,
  controller: ReadableStreamDefaultController
): RoomState {
  initRoom(roomName);
  const room = rooms.get(roomName)!;
  room.userCounts.set(username, (room.userCounts.get(username) ?? 0) + 1);
  room.subscribers.add({ username, controller });
  addUserInterest(username, roomName);
  return room;
}

export function unsubscribe(
  roomName: string,
  username: string,
  controller: ReadableStreamDefaultController
) {
  const room = rooms.get(roomName);
  if (!room) return;
  const count = room.userCounts.get(username) ?? 0;
  if (count <= 1) room.userCounts.delete(username);
  else room.userCounts.set(username, count - 1);
  for (const sub of room.subscribers) {
    if (sub.controller === controller) {
      room.subscribers.delete(sub);
      break;
    }
  }
}
