/**
 * SQLite database — user accounts and persistent message history.
 *
 * Passwords are hashed with bcrypt (cost factor 12) and never stored in
 * plaintext. The admin account is seeded automatically from the
 * ADMIN_PASSWORD environment variable on first run.
 *
 * Messages are persisted so history survives server restarts.
 *
 * This module is server-only (Node.js). Never import it in client code.
 */

import Database from "better-sqlite3";
import bcrypt from "bcryptjs";
import path from "path";

// ─── Database init ────────────────────────────────────────────────────────────

const DB_PATH = process.env.DATABASE_PATH ?? path.join(process.cwd(), "chat.db");
const BCRYPT_ROUNDS = 12;

let _db: Database.Database | null = null;

function getDb(): Database.Database {
  if (!_db) {
    _db = new Database(DB_PATH);
    _db.pragma("journal_mode = WAL");
    _db.pragma("foreign_keys = ON");
    migrate(_db);
  }
  return _db;
}

function migrate(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      username      TEXT    UNIQUE NOT NULL COLLATE NOCASE,
      password_hash TEXT    NOT NULL,
      is_admin      INTEGER NOT NULL DEFAULT 0,
      created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS messages (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      msg_id     TEXT    NOT NULL,
      room       TEXT    NOT NULL,
      content    TEXT    NOT NULL,   -- full JSON of the ChatMessage
      time       TEXT    NOT NULL,
      created_at TEXT    NOT NULL DEFAULT (datetime('now')),
      UNIQUE(msg_id)
    );
    CREATE INDEX IF NOT EXISTS idx_msg_room ON messages(room, created_at);
  `);

  // Profile columns (added after initial schema)
  const addCol = (col: string, def: string) => {
    try { db.exec(`ALTER TABLE users ADD COLUMN ${col} ${def}`); } catch { /* already exists */ }
  };
  addCol("display_name", "TEXT DEFAULT NULL");
  addCol("bio", "TEXT DEFAULT ''");
  addCol("avatar_color", "TEXT DEFAULT NULL");

  seedAdmin(db);
}

// ─── Message persistence ──────────────────────────────────────────────────────

import type { ChatMessage } from "./types";

/** Persist a user message. System messages are intentionally not stored. */
export function saveMessage(roomName: string, msg: ChatMessage): void {
  if (msg.type === "system") return;
  try {
    getDb()
      .prepare(
        "INSERT OR IGNORE INTO messages (msg_id, room, content, time) VALUES (?, ?, ?, ?)"
      )
      .run(msg.msgId, roomName, JSON.stringify(msg), msg.time);
  } catch {
    // ignore duplicate or serialization errors
  }
}

/** Load the most recent `limit` messages for a room (oldest first). */
export function getMessageHistory(roomName: string, limit = 50): ChatMessage[] {
  return (
    getDb()
      .prepare(
        "SELECT content FROM messages WHERE room = ? ORDER BY created_at DESC LIMIT ?"
      )
      .all(roomName, limit) as { content: string }[]
  )
    .reverse()
    .map((row) => JSON.parse(row.content) as ChatMessage);
}

function seedAdmin(db: Database.Database) {
  const password = process.env.ADMIN_PASSWORD;
  if (!password) {
    console.warn("[auth] ADMIN_PASSWORD is not set — admin account not seeded");
    return;
  }
  const exists = db.prepare("SELECT id FROM users WHERE username = 'admin'").get();
  if (exists) return;
  const hash = bcrypt.hashSync(password, BCRYPT_ROUNDS);
  db.prepare(
    "INSERT INTO users (username, password_hash, is_admin) VALUES ('admin', ?, 1)"
  ).run(hash);
  console.log("[auth] Admin account created");
}

// ─── Types ───────────────────────────────────────────────────────────────────

export type User = {
  id: number;
  username: string;
  is_admin: number;
  created_at: string;
  display_name: string | null;
  bio: string;
  avatar_color: string | null;
};

type UserWithHash = User & { password_hash: string };

export type UserProfile = {
  username: string;
  display_name: string | null;
  bio: string;
  avatar_color: string | null;
};

// ─── Queries ─────────────────────────────────────────────────────────────────

export function findUser(username: string): UserWithHash | undefined {
  return getDb()
    .prepare("SELECT * FROM users WHERE username = ? COLLATE NOCASE")
    .get(username) as UserWithHash | undefined;
}

export function getAllUsers(): User[] {
  return getDb()
    .prepare(
      "SELECT id, username, is_admin, created_at FROM users ORDER BY is_admin DESC, created_at ASC"
    )
    .all() as User[];
}

export function createUser(
  username: string,
  password: string
): { ok: true } | { ok: false; error: string } {
  if (username.length < 2 || username.length > 32) {
    return { ok: false, error: "Username must be 2–32 characters" };
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
    return { ok: false, error: "Username may only contain letters, numbers, _ and -" };
  }
  if (password.length < 8) {
    return { ok: false, error: "Password must be at least 8 characters" };
  }
  const hash = bcrypt.hashSync(password, BCRYPT_ROUNDS);
  try {
    getDb()
      .prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)")
      .run(username, hash);
    return { ok: true };
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "";
    if (msg.includes("UNIQUE constraint")) {
      return { ok: false, error: "Username already taken" };
    }
    return { ok: false, error: "Failed to create user" };
  }
}

/** Admin-safe delete: cannot delete the admin account. */
export function deleteUser(username: string): void {
  getDb()
    .prepare("DELETE FROM users WHERE username = ? AND is_admin = 0")
    .run(username);
}

export function verifyPassword(candidate: string, hash: string): boolean {
  return bcrypt.compareSync(candidate, hash);
}

// ─── Profile ────────────────────────────────────────────────────────────────

export function getProfile(username: string): UserProfile | undefined {
  return getDb()
    .prepare("SELECT username, display_name, bio, avatar_color FROM users WHERE username = ? COLLATE NOCASE")
    .get(username) as UserProfile | undefined;
}

export function getAllProfiles(): UserProfile[] {
  return getDb()
    .prepare("SELECT username, display_name, bio, avatar_color FROM users")
    .all() as UserProfile[];
}

export function updateProfile(
  username: string,
  data: { display_name?: string | null; bio?: string; avatar_color?: string | null }
): { ok: true } | { ok: false; error: string } {
  if (data.display_name !== undefined && data.display_name !== null) {
    if (data.display_name.length > 40) return { ok: false, error: "Display name too long (max 40)" };
  }
  if (data.bio !== undefined && data.bio.length > 200) {
    return { ok: false, error: "Bio too long (max 200)" };
  }
  if (data.avatar_color !== undefined && data.avatar_color !== null) {
    if (!/^#[0-9a-fA-F]{6}$/.test(data.avatar_color)) {
      return { ok: false, error: "Invalid color (use #RRGGBB)" };
    }
  }

  const sets: string[] = [];
  const vals: (string | null)[] = [];
  if (data.display_name !== undefined) { sets.push("display_name = ?"); vals.push(data.display_name); }
  if (data.bio !== undefined) { sets.push("bio = ?"); vals.push(data.bio); }
  if (data.avatar_color !== undefined) { sets.push("avatar_color = ?"); vals.push(data.avatar_color); }

  if (sets.length === 0) return { ok: false, error: "Nothing to update" };

  vals.push(username);
  getDb().prepare(`UPDATE users SET ${sets.join(", ")} WHERE username = ? COLLATE NOCASE`).run(...vals);
  return { ok: true };
}
