import Database from "better-sqlite3";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

const DB_DIR = join(process.cwd(), "data");
const DB_PATH = join(DB_DIR, "retroflow.db");

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;
  mkdirSync(DB_DIR, { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  db.pragma("foreign_keys = ON");
  migrate(db);
  _db = db;
  return db;
}

function migrate(db: Database.Database) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL UNIQUE,
      role        TEXT NOT NULL CHECK (role IN ('admin','scrum_master','member','manager')),
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS retro_sessions (
      id          TEXT PRIMARY KEY,
      name        TEXT NOT NULL,
      status      TEXT NOT NULL DEFAULT 'writing' CHECK (status IN ('writing','voting','finished')),
      vote_limit  INTEGER NOT NULL DEFAULT 3,
      created_by  TEXT REFERENCES users(id) ON DELETE SET NULL,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS cards (
      id          TEXT PRIMARY KEY,
      session_id  TEXT NOT NULL REFERENCES retro_sessions(id) ON DELETE CASCADE,
      text        TEXT NOT NULL,
      category    TEXT NOT NULL CHECK (category IN ('mad','glad','sad')),
      votes       INTEGER NOT NULL DEFAULT 0,
      user_id     TEXT REFERENCES users(id) ON DELETE SET NULL,
      created_at  TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS actions (
      id           TEXT PRIMARY KEY,
      card_id      TEXT NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
      assigned_to  TEXT REFERENCES users(id) ON DELETE SET NULL,
      description  TEXT NOT NULL,
      status       TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','done')),
      deadline     TEXT,
      created_at   TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_cards_session_id    ON cards(session_id);
    CREATE INDEX IF NOT EXISTS idx_cards_category      ON cards(category);
    CREATE INDEX IF NOT EXISTS idx_actions_card_id     ON actions(card_id);
    CREATE INDEX IF NOT EXISTS idx_actions_assigned_to ON actions(assigned_to);
  `);
}
