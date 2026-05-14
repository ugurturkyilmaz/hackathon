// Standalone seeder. Initializes/migrates the SQLite DB and inserts the
// canonical demo state: 9 users + Falcon Team + 1 finished retro with
// 2 overdue actions.
//
//   npm run seed

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

// --- seed users ---
const insertUser = db.prepare(`INSERT INTO users (id, name, role) VALUES (?, ?, ?)`);
const userIds = {};
const add = (name, role) => {
  const id = randomUUID();
  insertUser.run(id, name, role);
  userIds[name] = id;
};

add("admin", "admin");
["Kaan", "Batuhan", "Çağrı"].forEach((n) => add(n, "manager"));
add("Erhan", "scrum_master");
["Kübra", "Zeynep", "Anıl", "Uğur"].forEach((n) => add(n, "member"));

// --- seed team ---
const teamId = randomUUID();
db.prepare(`INSERT INTO teams (id, name, scrum_master_id) VALUES (?, ?, ?)`).run(
  teamId,
  "Falcon Team",
  userIds["Erhan"],
);
const setTeam = db.prepare(`UPDATE users SET team_id = ? WHERE name = ?`);
["Erhan", "Kübra", "Zeynep", "Anıl", "Uğur"].forEach((n) => setTeam.run(teamId, n));

// --- seed previous retro (finished) ---
const sessionId = randomUUID();
const previousRetroDate = new Date();
previousRetroDate.setDate(previousRetroDate.getDate() - 14); // 2 hafta önce
db.prepare(
  `INSERT INTO retro_sessions
     (id, name, status, vote_limit, writing_minutes, writing_ends_at, team_id, created_by, created_at)
   VALUES (?, ?, 'finished', 3, 5, NULL, ?, ?, ?)`,
).run(sessionId, "Sprint 11 Retro", teamId, userIds["Erhan"], previousRetroDate.toISOString());

// --- cards ---
const insertCard = db.prepare(
  `INSERT INTO cards (id, session_id, text, category, votes, user_id) VALUES (?, ?, ?, ?, ?, ?)`,
);
const gladId = randomUUID();
const madZeynepId = randomUUID();
const madUgurId = randomUUID();
insertCard.run(gladId, sessionId, "ekip içi iletişim güzel", "glad", 4, userIds["Anıl"]);
insertCard.run(madZeynepId, sessionId, "Zeynep'in task'ları geç bitiyor", "mad", 3, userIds["Kübra"]);
insertCard.run(madUgurId, sessionId, "Uğur dailylere katılmıyor", "mad", 3, userIds["Erhan"]);

// --- overdue actions ---
const overdueDate = new Date();
overdueDate.setDate(overdueDate.getDate() - 5); // 5 gün önce vade
const overdueStr = overdueDate.toISOString().slice(0, 10);

const insertAction = db.prepare(
  `INSERT INTO actions (id, card_id, assigned_to, description, status, deadline) VALUES (?, ?, ?, ?, 'open', ?)`,
);
insertAction.run(
  randomUUID(),
  madZeynepId,
  userIds["Zeynep"],
  "Zeynep 2 task'ını geciktirdi",
  overdueStr,
);
insertAction.run(
  randomUUID(),
  madUgurId,
  userIds["Uğur"],
  "Uğur dailylere katılmıyor",
  overdueStr,
);

const userTotal = db.prepare(`SELECT COUNT(*) AS n FROM users`).get().n;
const sessTotal = db.prepare(`SELECT COUNT(*) AS n FROM retro_sessions`).get().n;
const actTotal = db.prepare(`SELECT COUNT(*) AS n FROM actions`).get().n;
console.log(
  `✅ Seed complete — ${userTotal} users, 1 team (Falcon Team), ${sessTotal} retro, ${actTotal} action(s) at ${DB_PATH}`,
);
