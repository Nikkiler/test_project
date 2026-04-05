"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import type { DisplayMessage, EncryptedEnvelope, Reactions, ReplyPreview, Room, ServerEvent } from "@/lib/types";
import { useE2E } from "./useE2E";
import { cacheSentMessage, getSentMessage } from "@/lib/sentCache";
import { loadMsgCache, cacheMsgLocally } from "@/lib/msgCache";
import { loadDmList, addDmConversation, dmRoomName, isDmRoom, dmPeer } from "@/lib/dmCache";

export function useChat(username: string, initialRoom = "general") {
  const [messages, setMessages] = useState<DisplayMessage[]>([]);
  const [users, setUsers] = useState<string[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [currentRoom, setCurrentRoom] = useState(initialRoom);
  const [typingUsers, setTypingUsers] = useState<Record<string, number>>({});
  const [connected, setConnected] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ReplyPreview | null>(null);
  const [dmConversations, setDmConversations] = useState<string[]>([]);
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});

  const esRef = useRef<EventSource | null>(null);
  const currentRoomRef = useRef(currentRoom);
  const prevUsersRef = useRef<string[]>([]);
  // Local decrypted message cache: msgId → DisplayMessage (without reactions)
  const msgCacheRef = useRef(new Map<string, Omit<Extract<DisplayMessage, { type: "msg" }>, "reactions">>());
  // Messages that failed to decrypt (key not yet received): msgId → original encrypted data
  const pendingDecryptRef = useRef(new Map<string, {
    name: string; time: string; envelope: EncryptedEnvelope; room: string; reactions: Reactions;
  }>());

  const { ready: e2eReady, encrypt, decrypt, receiveDistribution, distributeKeyTo } = useE2E(username);

  // ─── Decrypt helper ────────────────────────────────────────────────────────

  const resolveEncrypted = useCallback(async (
    name: string,
    time: string,
    msgId: string,
    envelope: EncryptedEnvelope,
    room: string,
    reactions: Reactions = {}
  ): Promise<DisplayMessage> => {
    // Check the local decrypted-message cache first (survives page reloads)
    const localCached = msgCacheRef.current.get(msgId);
    if (localCached) {
      pendingDecryptRef.current.delete(msgId); // no longer pending
      return { ...localCached, reactions };
    }

    // Own messages: recover text from sent-message cache
    if (name === username) {
      const sent = getSentMessage(msgId);
      if (sent) {
        const dm: Extract<DisplayMessage, { type: "msg" }> = {
          type: "msg", msgId, name, text: sent.text, time, replyTo: sent.replyTo, reactions,
        };
        cacheMsgLocally(username, room, dm);
        msgCacheRef.current.set(msgId, { type: "msg", msgId, name, text: sent.text, time, replyTo: sent.replyTo });
        return dm;
      }
      return null as unknown as DisplayMessage; // skip unrecoverable own messages
    }

    const content = await decrypt(name, room, envelope);
    if (content !== null) {
      pendingDecryptRef.current.delete(msgId); // successfully decrypted
      const dm: Extract<DisplayMessage, { type: "msg" }> = {
        type: "msg", msgId, name, text: content.text, time, replyTo: content.replyTo, reactions,
      };
      cacheMsgLocally(username, room, dm);
      msgCacheRef.current.set(msgId, { type: "msg", msgId, name, text: content.text, time, replyTo: content.replyTo });
      return dm;
    }

    // Key not yet received — store for retry when key_distribution arrives
    pendingDecryptRef.current.set(msgId, { name, time, envelope, room, reactions });
    return { type: "pending", msgId, name, time, reactions };
  }, [username, decrypt]);

  // ─── SSE connection ────────────────────────────────────────────────────────

  const connect = useCallback((room: string) => {
    esRef.current?.close();
    setConnected(false);
    setMessages([]);
    setReplyingTo(null);
    currentRoomRef.current = room;
    prevUsersRef.current = [];
    pendingDecryptRef.current.clear();
    // Clear unread badge for the room we're now viewing
    setUnreadCounts((prev) => { const next = { ...prev }; delete next[room]; return next; });

    // Load persisted decrypted messages for this room into the in-memory cache ref
    msgCacheRef.current = loadMsgCache(username, room);

    const es = new EventSource(`/api/stream?room=${encodeURIComponent(room)}`);
    esRef.current = es;

    es.onopen = () => {
      setConnected(true);
      // For DMs: push our sender key to the peer immediately via sendToUser,
      // even if they are currently in a different room. This ensures they can
      // decrypt our messages when they open the DM (from history or live).
      if (isDmRoom(room)) {
        const peer = dmPeer(room, username);
        distributeKeyTo(room, peer).catch(() => {});
      }
    };
    es.onerror = () => setConnected(false);

    es.onmessage = async (e: MessageEvent) => {
      const event: ServerEvent = JSON.parse(e.data as string);

      switch (event.type) {
        case "msg": {
          const dm: Extract<DisplayMessage, { type: "msg" }> = { ...event, reactions: event.reactions ?? {} };
          cacheMsgLocally(username, room, dm);
          msgCacheRef.current.set(dm.msgId, { type: "msg", msgId: dm.msgId, name: dm.name, text: dm.text, time: dm.time, replyTo: dm.replyTo });
          setMessages((prev) => [...prev, dm]);
          break;
        }

        case "system":
          setMessages((prev) => [...prev, event]);
          break;

        case "encrypted_msg": {
          // Own messages are already shown via optimistic update — skip the echo
          if (event.name === username) break;
          const dm = await resolveEncrypted(
            event.name, event.time, event.msgId, event.envelope, room, event.reactions
          );
          setMessages((prev) => [...prev, dm]);
          break;
        }

        case "history": {
          const resolved = await Promise.all(
            event.messages.map((m) => {
              if (m.type === "encrypted_msg") {
                return resolveEncrypted(m.name, m.time, m.msgId, m.envelope, room, m.reactions);
              }
              if (m.type === "msg") {
                return Promise.resolve<DisplayMessage>({
                  type: "msg",
                  msgId: m.msgId,
                  name: m.name,
                  text: m.text,
                  time: m.time,
                  reactions: m.reactions ?? {},
                });
              }
              return Promise.resolve<DisplayMessage>(m);
            })
          );
          setMessages(resolved.filter((m) => m && m.type !== "pending"));
          break;
        }

        case "user_list": {
          const newUsers = event.users.filter(
            (u) => u !== username && !prevUsersRef.current.includes(u)
          );
          prevUsersRef.current = event.users;
          setUsers(event.users);
          for (const u of newUsers) distributeKeyTo(room, u);
          break;
        }

        case "room_list":
          setRooms(event.rooms);
          break;

        case "room_changed":
          setCurrentRoom(event.room);
          break;

        case "key_distribution": {
          await receiveDistribution(event.from, event.room, event.payload);

          // Re-decrypt any messages that were waiting for this sender's key
          const toRetry = [...pendingDecryptRef.current.entries()].filter(
            ([, p]) => p.name === event.from && p.room === event.room
          );
          if (toRetry.length > 0) {
            const retried = await Promise.all(
              toRetry.map(async ([id, p]) => ({
                id,
                resolved: await resolveEncrypted(p.name, p.time, id, p.envelope, p.room, p.reactions),
              }))
            );
            setMessages((prev) =>
              prev.map((m) => {
                if (m.type !== "pending") return m;
                const hit = retried.find((r) => r.id === m.msgId);
                return hit ? hit.resolved : m;
              })
            );
          }
          break;
        }

        case "reaction": {
          const { msgId, emoji, users } = event;
          setMessages((prev) =>
            prev.map((m) => {
              if ((m.type !== "msg" && m.type !== "pending") || m.msgId !== msgId) return m;
              const reactions = { ...m.reactions };
              if (users.length === 0) delete reactions[emoji];
              else reactions[emoji] = users;
              return { ...m, reactions };
            })
          );
          // Keep stored pending reactions in sync so retry uses the latest state
          const pending = pendingDecryptRef.current.get(msgId);
          if (pending) {
            const reactions = { ...pending.reactions };
            if (users.length === 0) delete reactions[emoji];
            else reactions[emoji] = users;
            pendingDecryptRef.current.set(msgId, { ...pending, reactions });
          }
          break;
        }

        case "notify": {
          const { room: notifyRoom } = event;
          setUnreadCounts((prev) => ({
            ...prev,
            [notifyRoom]: (prev[notifyRoom] ?? 0) + 1,
          }));
          // If this is a DM from someone new, auto-add them to the conversation list
          if (isDmRoom(notifyRoom)) {
            const peer = dmPeer(notifyRoom, username);
            addDmConversation(username, peer);
            setDmConversations(loadDmList(username));
          }
          break;
        }

        case "typing": {
          const { name } = event;
          setTypingUsers((prev) => ({ ...prev, [name]: Date.now() }));
          setTimeout(() => {
            setTypingUsers((prev) => {
              if (Date.now() - (prev[name] ?? 0) >= 2500) {
                const { [name]: _, ...rest } = prev;
                return rest;
              }
              return prev;
            });
          }, 2500);
          break;
        }
      }
    };
  }, [username, resolveEncrypted, receiveDistribution, distributeKeyTo]);

  // Load DM list from localStorage only on the client after mount to avoid
  // SSR/client hydration mismatch (localStorage is unavailable on the server).
  useEffect(() => {
    setDmConversations(loadDmList(username));
  }, [username]);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!e2eReady) return;
    connect(initialRoom);
    return () => esRef.current?.close();
  }, [e2eReady]);

  // ─── Actions ──────────────────────────────────────────────────────────────

  const sendMessage = useCallback(async (text: string) => {
    if (!e2eReady || !text.trim()) return;

    const msgId = crypto.randomUUID();
    const replyTo = replyingTo ?? undefined;

    const now = new Date().toISOString();
    const ownMsg: Extract<DisplayMessage, { type: "msg" }> = {
      type: "msg", msgId, name: username, text: text.trim(), time: now, replyTo, reactions: {},
    };

    // Optimistic update — sender sees their message immediately
    setMessages((prev) => [...prev, ownMsg]);
    setReplyingTo(null);

    // Persist to both caches so text is recoverable after reload
    cacheSentMessage({ msgId, text: text.trim(), time: now, replyTo });
    cacheMsgLocally(username, currentRoomRef.current, ownMsg);
    msgCacheRef.current.set(msgId, { type: "msg", msgId, name: username, text: text.trim(), time: now, replyTo });

    const envelope = await encrypt(currentRoomRef.current, { text: text.trim(), replyTo });
    fetch("/api/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        room: currentRoomRef.current,
        type: "encrypted_msg",
        msgId,
        envelope,
      }),
    });
  }, [username, encrypt, e2eReady, replyingTo]);

  const sendReaction = useCallback((msgId: string, emoji: string) => {
    fetch("/api/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ room: currentRoomRef.current, type: "reaction", msgId, emoji }),
    });
  }, []);

  const switchRoom = useCallback((room: string) => {
    if (room !== currentRoomRef.current) connect(room);
  }, [connect]);

  const openDm = useCallback((peer: string) => {
    const room = dmRoomName(username, peer);
    addDmConversation(username, peer);
    setDmConversations(loadDmList(username));
    if (room !== currentRoomRef.current) connect(room);
  }, [username, connect]);

  const sendTyping = useCallback(() => {
    fetch("/api/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ room: currentRoomRef.current, type: "typing" }),
    });
  }, []);

  return {
    messages, users, rooms, currentRoom, typingUsers, connected,
    replyingTo, setReplyingTo,
    dmConversations, openDm,
    unreadCounts,
    sendMessage, sendReaction, switchRoom, sendTyping,
  };
}
