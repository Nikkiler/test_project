import { findUser, verifyPassword } from "@/lib/db";
import { signSession, buildSessionCookie } from "@/lib/session";

// ─── In-memory rate limiter: 5 attempts per 15 min per IP ────────────────────

const WINDOW_MS = 15 * 60 * 1000;
const MAX_ATTEMPTS = 5;

const attempts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = attempts.get(ip);
  if (!entry || entry.resetAt < now) {
    attempts.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return true;
  }
  if (entry.count >= MAX_ATTEMPTS) return false;
  entry.count++;
  return true;
}

function clearRateLimit(ip: string) {
  attempts.delete(ip);
}

// Clean up old entries periodically so the map doesn't grow forever
setInterval(() => {
  const now = Date.now();
  for (const [ip, entry] of attempts) {
    if (entry.resetAt < now) attempts.delete(ip);
  }
}, WINDOW_MS);

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: Request) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";

  if (!checkRateLimit(ip)) {
    return Response.json(
      { error: "Too many login attempts. Try again later." },
      { status: 429 }
    );
  }

  const body = (await req.json()) as { username?: string; password?: string };
  const username = body.username?.trim();
  const password = body.password;

  if (!username || !password) {
    return Response.json({ error: "Missing credentials" }, { status: 400 });
  }

  const user = findUser(username);
  if (!user || !verifyPassword(password, user.password_hash)) {
    // Same message for both cases — prevents username enumeration
    return Response.json({ error: "Invalid username or password" }, { status: 401 });
  }

  // Successful login — clear the rate limit counter for this IP
  clearRateLimit(ip);

  const token = await signSession({
    username: user.username,
    isAdmin: user.is_admin === 1,
  });

  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Set-Cookie": buildSessionCookie(token),
    },
  });
}
