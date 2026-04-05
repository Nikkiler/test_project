import {
  addToHistory,
  broadcastMessage,
  broadcastTyping,
  broadcastReaction,
  sendToUser,
  toggleReaction,
} from "@/lib/store";
import { getSession } from "@/lib/session";
import type { ChatMessage, EncryptedEnvelope, SenderKeyDistribution } from "@/lib/types";

type Body =
  | { room: string; type: "typing" }
  | { room: string; type: "msg"; msgId: string; text: string }
  | { room: string; type: "encrypted_msg"; msgId: string; envelope: EncryptedEnvelope }
  | { room: string; type: "key_distribution"; to: string; payload: SenderKeyDistribution }
  | { room: string; type: "reaction"; msgId: string; emoji: string };

const ROOM_RE = /^[a-z0-9_-]{1,50}$/;
const DM_ROOM_RE = /^dm:[a-zA-Z0-9_-]{2,32}:[a-zA-Z0-9_-]{2,32}$/;

function isValidRoom(room: string, username: string): boolean {
  if (ROOM_RE.test(room)) return true;
  if (DM_ROOM_RE.test(room)) {
    const [, u1, u2] = room.split(":");
    // Reject non-canonical ordering (prevents duplicate room per pair)
    if (u1 >= u2) return false;
    return u1 === username || u2 === username;
  }
  return false;
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json()) as Body;
  const { room, type } = body;
  const username = session.username;

  if (!room || !isValidRoom(room, username)) {
    return Response.json({ error: "Invalid room" }, { status: 400 });
  }

  switch (type) {
    case "typing":
      broadcastTyping(room, username);
      return Response.json({ ok: true });

    case "msg": {
      const { msgId, text } = body as Extract<Body, { type: "msg" }>;
      if (!text?.trim()) return Response.json({ error: "Empty text" }, { status: 400 });
      if (text.length > 4000) return Response.json({ error: "Message too long" }, { status: 400 });
      if (!msgId || !/^[0-9a-f-]{36}$/.test(msgId)) {
        return Response.json({ error: "Invalid msgId" }, { status: 400 });
      }
      const msg: ChatMessage = {
        type: "msg",
        msgId,
        name: username,
        text: text.trim(),
        time: new Date().toISOString(),
      };
      addToHistory(room, msg);
      broadcastMessage(room, msg);
      return Response.json({ ok: true });
    }

    case "encrypted_msg": {
      const { msgId, envelope } = body as Extract<Body, { type: "encrypted_msg" }>;
      if (!msgId || !/^[0-9a-f-]{36}$/.test(msgId)) {
        return Response.json({ error: "Invalid msgId" }, { status: 400 });
      }
      if (!envelope) return Response.json({ error: "Missing envelope" }, { status: 400 });
      const msg: ChatMessage = {
        type: "encrypted_msg",
        msgId,
        name: username,
        envelope,
        time: new Date().toISOString(),
      };
      addToHistory(room, msg);
      broadcastMessage(room, msg);
      return Response.json({ ok: true });
    }

    case "key_distribution": {
      const { to, payload } = body as Extract<Body, { type: "key_distribution" }>;
      if (!to || !payload) return Response.json({ error: "Missing to/payload" }, { status: 400 });
      sendToUser(to, { type: "key_distribution", from: username, room, payload });
      return Response.json({ ok: true });
    }

    case "reaction": {
      const { msgId, emoji } = body as Extract<Body, { type: "reaction" }>;
      if (!msgId || !/^[0-9a-f-]{36}$/.test(msgId)) {
        return Response.json({ error: "Invalid msgId" }, { status: 400 });
      }
      // Only allow the emoji subset shown in the picker
      const ALLOWED_EMOJI = new Set(["👍","❤️","😂","😮","😢","🔥","🎉","👎"]);
      if (!emoji || !ALLOWED_EMOJI.has(emoji)) {
        return Response.json({ error: "Invalid emoji" }, { status: 400 });
      }
      const { users } = toggleReaction(msgId, emoji, username);
      broadcastReaction(room, { type: "reaction", msgId, emoji, users });
      return Response.json({ ok: true });
    }

    default:
      return Response.json({ error: "Unknown type" }, { status: 400 });
  }
}
