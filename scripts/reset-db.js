#!/usr/bin/env node
/**
 * Wipes all messages and non-admin users from the database, then re-seeds test users.
 * Useful for a clean slate between test sessions.
 * Run with: npm run reset-db
 *
 * The admin account is always preserved.
 */

"use strict";

const Database = require("better-sqlite3");
const bcrypt = require("bcryptjs");
const path = require("path");
const readline = require("readline");

const DB_PATH = process.env.DATABASE_PATH ?? path.join(process.cwd(), "chat.db");

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question(`\nThis will DELETE all messages and non-admin users from:\n  ${DB_PATH}\nType YES to confirm: `, (answer) => {
  rl.close();
  if (answer.trim() !== "YES") {
    console.log("Aborted.");
    process.exit(0);
  }

  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");

  const deleted = db.prepare("DELETE FROM messages").run();
  const deletedUsers = db.prepare("DELETE FROM users WHERE is_admin = 0").run();
  console.log(`\n  Deleted ${deleted.changes} messages, ${deletedUsers.changes} non-admin users.`);

  // Re-seed test users
  const TEST_USERS = [
    { username: "alice", password: "testpass1" },
    { username: "bob",   password: "testpass2" },
    { username: "carol", password: "testpass3" },
  ];

  console.log("\n  Re-seeding test users:");
  for (const { username, password } of TEST_USERS) {
    const hash = bcrypt.hashSync(password, 10);
    db.prepare("INSERT OR IGNORE INTO users (username, password_hash) VALUES (?, ?)").run(username, hash);
    console.log(`    ${username}  →  ${password}`);
  }

  db.close();
  console.log("\n  Done. Database is clean.\n");
});
