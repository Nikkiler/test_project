import {
  subscribe,
  unsubscribe,
  addToHistory,
  broadcastMessage,
  broadcastUserList,
  broadcastRoomListToAll,
  getRoomList,
  getHistoryWithReactions,
} from "@/lib/store";
import { getSession } from "@/lib/session";
import type { ChatMessage } from "@/lib/types";

export const dynamic = "force-dynamic";

const ROOM_RE = /^[a-z0-9_-]{1,50}$/;
const DM_ROOM_RE = /^dm:[a-zA-Z0-9_-]{2,32}:[a-zA-Z0-9_-]{2,32}$/;

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return new Response("Unauthorized", { status: 401 });

  const { searchParams } = new URL(req.url);
  const rawRoom = searchParams.get("room")?.trim() ?? "general";
  const username = session.username;

  let roomName: string;
  const isDm = rawRoom.startsWith("dm:");

  if (isDm) {
    if (!DM_ROOM_RE.test(rawRoom)) {
      return new Response("Invalid room", { status: 400 });
    }
    const [, u1, u2] = rawRoom.split(":");
    // Enforce canonical ordering (u1 < u2 lexicographically) so there is only
    // one room per pair regardless of who initiates.
    if (u1 >= u2) return new Response("Invalid room", { status: 400 });
    if (u1 !== username && u2 !== username) {
      return new Response("Forbidden", { status: 403 });
    }
    roomName = rawRoom;
  } else {
    roomName = ROOM_RE.test(rawRoom) ? rawRoom : "general";
  }

  const stream = new ReadableStream({
    start(controller) {
      const send = (event: object) =>
        controller.enqueue(`data: ${JSON.stringify(event)}\n\n`);

      const room = subscribe(roomName, username, controller);

      send({ type: "room_changed", room: roomName });
      send({ type: "history", messages: getHistoryWithReactions(roomName) });
      send({ type: "user_list", users: [...room.userCounts.keys()] });
      // DM rooms don't appear in the public room list
      if (!isDm) send({ type: "room_list", rooms: getRoomList() });

      if (!isDm) {
        const joinMsg: ChatMessage = {
          type: "system",
          text: `${username} joined #${roomName}`,
          time: new Date().toISOString(),
        };
        addToHistory(roomName, joinMsg);
        broadcastMessage(roomName, joinMsg, username);
        broadcastUserList(roomName);
        broadcastRoomListToAll();
      } else {
        // For DMs: update presence for the other participant only
        broadcastUserList(roomName);
      }

      req.signal.addEventListener("abort", () => {
        unsubscribe(roomName, username, controller);

        if (!isDm) {
          const leaveMsg: ChatMessage = {
            type: "system",
            text: `${username} left`,
            time: new Date().toISOString(),
          };
          addToHistory(roomName, leaveMsg);
          broadcastMessage(roomName, leaveMsg);
          broadcastUserList(roomName);
          broadcastRoomListToAll();
        } else {
          broadcastUserList(roomName);
        }

        try { controller.close(); } catch { /* already closed */ }
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-store, no-cache, must-revalidate",
      Connection: "keep-alive",
    },
  });
}
