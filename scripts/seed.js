#!/usr/bin/env node
/**
 * Seed test users into the local database.
 * Run with: npm run seed
 *
 * Creates these accounts (all with the passwords shown below):
 *   alice   / testpass1
 *   bob     / testpass2
 *   carol   / testpass3
 *
 * Safe to run multiple times — existing users are skipped.
 */

"use strict";

const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");
const path = require("path");

const DB_PATH = process.env.DATABASE_PATH ?? path.join(process.cwd(), "chat.db");
const ROUNDS = 10; // lower cost for seed speed

const TEST_USERS = [
  { username: "alice", password: "testpass1" },
  { username: "bob",   password: "testpass2" },
  { username: "carol", password: "testpass3" },
];

const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// Ensure the users table exists (in case the app hasn't run yet)
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    username      TEXT    UNIQUE NOT NULL COLLATE NOCASE,
    password_hash TEXT    NOT NULL,
    is_admin      INTEGER NOT NULL DEFAULT 0,
    created_at    TEXT    NOT NULL DEFAULT (datetime('now'))
  );
`);

console.log("\n── Seeding test users ────────────────────────────");
console.log(` DB: ${DB_PATH}\n`);

let created = 0;
let skipped = 0;

for (const { username, password } of TEST_USERS) {
  const exists = db.prepare("SELECT id FROM users WHERE username = ?").get(username);
  if (exists) {
    console.log(`  SKIP  ${username} (already exists)`);
    skipped++;
    continue;
  }
  const hash = bcrypt.hashSync(password, ROUNDS);
  db.prepare("INSERT INTO users (username, password_hash) VALUES (?, ?)").run(username, hash);
  console.log(`  ADD   ${username}  →  password: ${password}`);
  created++;
}

console.log(`\n  ${created} created, ${skipped} skipped.`);
console.log("\n── How to test locally ────────────────────────────");
console.log("  1. npm run dev          (starts on http://localhost:3000)");
console.log("  2. Open http://localhost:3000 in a normal browser window → log in as alice");
console.log("  3. Open a Private/Incognito window           → log in as bob");
console.log("  4. Open a second Private window (or a different browser) → log in as carol");
console.log("  Admin panel: http://localhost:3000/admin  (log in as admin first)\n");

db.close();
