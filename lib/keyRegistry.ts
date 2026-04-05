/** In-memory server-side registry of user identity public keys (ECDH P-256). */
const keys = new Map<string, string>();

export function registerIdentityKey(username: string, publicKey: string) {
  keys.set(username, publicKey);
}

export function getIdentityKey(username: string): string | undefined {
  return keys.get(username);
}
