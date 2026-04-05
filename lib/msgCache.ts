/**
 * Client-side (localStorage) cache of decrypted messages.
 *
 * Why: messages are E2E encrypted and the sender key chain ratchets forward with
 * every message. After a page reload the ratchet state is gone, so the server's
 * stored ciphertexts can no longer be re-decrypted. Caching the plaintext locally
 * (keyed by username + room + msgId) means history survives sessions on the same
 * device without ever sending plaintext to the server.
 *
 * Reactions are intentionally NOT cached here — they are ephemeral server state
 * and will be re-attached from the live SSE feed.
 *
 * This module is client-only. Never import it in server code.
 */

import type { DisplayMessage } from "./types";

const VERSION = "v1";
const MAX_PER_ROOM = 300;

// The reaction field is ephemeral, so we strip it before storing.
type StoredMsg = Omit<Extract<DisplayMessage, { type: "msg" }>, "reactions">;

function storageKey(username: string, room: string): string {
  return `chat.msgs.${VERSION}.${username}.${room}`;
}

/** Load the decrypted message cache for a room as a Map<msgId, message>. */
export function loadMsgCache(username: string, room: string): Map<string, StoredMsg> {
  try {
    const raw = localStorage.getItem(storageKey(username, room));
    const arr = raw ? (JSON.parse(raw) as StoredMsg[]) : [];
    return new Map(arr.map((m) => [m.msgId, m]));
  } catch {
    return new Map();
  }
}

/** Persist a single decrypted message into the room cache. No-op if already present. */
export function cacheMsgLocally(
  username: string,
  room: string,
  msg: Extract<DisplayMessage, { type: "msg" }>
): void {
  try {
    const key = storageKey(username, room);
    const raw = localStorage.getItem(key);
    const arr: StoredMsg[] = raw ? JSON.parse(raw) : [];
    if (arr.some((m) => m.msgId === msg.msgId)) return; // already cached
    const { reactions: _r, ...toStore } = msg;
    arr.push(toStore);
    if (arr.length > MAX_PER_ROOM) arr.splice(0, arr.length - MAX_PER_ROOM);
    localStorage.setItem(key, JSON.stringify(arr));
  } catch {
    // localStorage full or unavailable — silently skip
  }
}

/** Remove all cached messages for a user (call on logout). */
export function clearUserMsgCache(username: string): void {
  if (typeof localStorage === "undefined") return;
  const prefix = `chat.msgs.${VERSION}.${username}.`;
  const toDelete: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k?.startsWith(prefix)) toDelete.push(k);
  }
  toDelete.forEach((k) => localStorage.removeItem(k));
}
