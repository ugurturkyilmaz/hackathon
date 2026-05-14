// Standalone seeder. Initializes/migrates the SQLite DB and inserts the
// canonical demo users. Safe to run repeatedly; wipes existing data.
//
//   npm run seed
//
// Mirrors the schema in src/lib/db/client.ts so it works without the
// Next.js app being running.

import Database from "better-sqlite3";
import { randomUUID } from "node:crypto";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const DB_DIR = join(process.cwd(), "data");
const DB_PATH = join(DB_DIR, "retroflow.db");

mkdirSync(DB_DIR, { recursive: true });
const db = new Database(DB_PATH);
db.pragma("journal_mode = WAL");
db.pragma("foreign_keys = ON");

// --- migrate (idempotent) ---
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id          TEXT PRIMARY KEY,
    name        TEXT NOT NULL UNIQUE,
    role        TEXT NOT NULL CHECK (role IN ('admin','scrum_master','member','manager')),
    team_id     TEXT,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS teams (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL UNIQUE,
    scrum_master_id TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS retro_sessions (
    id              TEXT PRIMARY KEY,
    name            TEXT NOT NULL,
    status          TEXT NOT NULL DEFAULT 'writing' CHECK (status IN ('writing','voting','finished')),
    vote_limit      INTEGER NOT NULL DEFAULT 3,
    writing_minutes INTEGER NOT NULL DEFAULT 5,
    writing_ends_at TEXT,
    team_id         TEXT REFERENCES teams(id) ON DELETE SET NULL,
    created_by      TEXT REFERENCES users(id) ON DELETE SET NULL,
    created_at      TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS card_groups (
    id          TEXT PRIMARY KEY,
    session_id  TEXT NOT NULL REFERENCES retro_sessions(id) ON DELETE CASCADE,
    name        TEXT NOT NULL,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS cards (
    id          TEXT PRIMARY KEY,
    session_id  TEXT NOT NULL REFERENCES retro_sessions(id) ON DELETE CASCADE,
    text        TEXT NOT NULL,
    category    TEXT NOT NULL CHECK (category IN ('mad','glad','sad')),
    votes       INTEGER NOT NULL DEFAULT 0,
    user_id     TEXT REFERENCES users(id) ON DELETE SET NULL,
    group_id    TEXT REFERENCES card_groups(id) ON DELETE SET NULL,
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS actions (
    id           TEXT PRIMARY KEY,
    card_id      TEXT REFERENCES cards(id) ON DELETE SET NULL,
    group_id     TEXT REFERENCES card_groups(id) ON DELETE SET NULL,
    assigned_to  TEXT REFERENCES users(id) ON DELETE SET NULL,
    description  TEXT NOT NULL,
    status       TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','done')),
    deadline     TEXT,
    created_at   TEXT NOT NULL DEFAULT (datetime('now'))
  );
`);

// --- wipe ---
db.exec(`
  DELETE FROM actions;
  DELETE FROM card_groups;
  DELETE FROM cards;
  DELETE FROM retro_sessions;
  UPDATE users SET team_id = NULL;
  DELETE FROM teams;
  DELETE FROM users;
`);

// --- seed ---
const insert = db.prepare(`INSERT INTO users (id, name, role) VALUES (?, ?, ?)`);
const add = (name, role) => insert.run(randomUUID(), name, role);

add("admin", "admin");
["Kaan", "Batuhan", "Çağrı"].forEach((n) => add(n, "manager"));
add("Erhan", "scrum_master");
["Kübra", "Zeynep", "Anıl", "Uğur"].forEach((n) => add(n, "member"));

const total = db.prepare(`SELECT COUNT(*) AS n FROM users`).get().n;
console.log(`✅ Seed complete — ${total} users inserted at ${DB_PATH}`);
