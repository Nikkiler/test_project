/**
 * JWT-based session management.
 *
 * Sessions are stored as HTTP-only, SameSite=Lax cookies.
 * The JWT is signed with HS256 using SESSION_SECRET.
 *
 * Use getSession()           in Server Components and Route Handlers.
 * Use verifySessionFromCookie() in middleware (no async next/headers there).
 */

import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const COOKIE = "session";
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 days

function getSecret(): Uint8Array {
  const s = process.env.SESSION_SECRET;
  if (!s || s.length < 32) {
    throw new Error("SESSION_SECRET must be set and at least 32 characters");
  }
  return new TextEncoder().encode(s);
}

export type SessionPayload = {
  username: string;
  isAdmin: boolean;
};

// ─── Token creation / verification ───────────────────────────────────────────

export async function signSession(payload: SessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getSecret());
}

export async function verifyToken(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return {
      username: payload.username as string,
      isAdmin: payload.isAdmin as boolean,
    };
  } catch {
    return null;
  }
}

// ─── Server Component / Route Handler helpers ────────────────────────────────

/** Read and verify the session cookie. Returns null if absent or invalid. */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(COOKIE)?.value;
  if (!token) return null;
  return verifyToken(token);
}

/** Set the session cookie on a Response object. */
export function buildSessionCookie(token: string): string {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE}=${token}; HttpOnly; SameSite=Lax; Max-Age=${MAX_AGE_SECONDS}; Path=/${secure}`;
}

/** Clear the session cookie. */
export function buildClearCookie(): string {
  return `${COOKIE}=; HttpOnly; SameSite=Lax; Max-Age=0; Path=/`;
}
