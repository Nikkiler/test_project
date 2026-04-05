const PREFIX = "chat.dms.v1.";

/** Load the list of DM peer usernames for this user from localStorage. */
export function loadDmList(username: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(`${PREFIX}${username}`);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

/** Add a peer to the DM conversation list (idempotent). */
export function addDmConversation(username: string, peer: string): void {
  if (typeof window === "undefined") return;
  const list = loadDmList(username);
  if (!list.includes(peer)) {
    localStorage.setItem(`${PREFIX}${username}`, JSON.stringify([...list, peer]));
  }
}

/** Remove a peer from the DM list. */
export function removeDmConversation(username: string, peer: string): void {
  if (typeof window === "undefined") return;
  const list = loadDmList(username).filter((p) => p !== peer);
  localStorage.setItem(`${PREFIX}${username}`, JSON.stringify(list));
}

/** Wipe the entire DM list (called on logout). */
export function clearDmList(username: string): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(`${PREFIX}${username}`);
}

/** Canonical DM room name for two users. */
export function dmRoomName(a: string, b: string): string {
  return `dm:${[a, b].sort().join(":")}`;
}

/** Extract the peer username from a DM room name. */
export function dmPeer(roomName: string, self: string): string {
  const [, u1, u2] = roomName.split(":");
  return u1 === self ? u2 : u1;
}

/** Returns true if the room name is a DM room. */
export function isDmRoom(roomName: string): boolean {
  return roomName.startsWith("dm:");
}
