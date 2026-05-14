import { randomUUID } from "node:crypto";
import { getDb } from "./client";

export interface SeedSummary {
  users: number;
  teams: number;
  sessions: number;
  actions: number;
}

export function resetAndSeed(): SeedSummary {
  const db = getDb();

  // Wipe in FK-safe order
  db.exec(`
    DELETE FROM actions;
    DELETE FROM card_groups;
    DELETE FROM cards;
    DELETE FROM retro_sessions;
    UPDATE users SET team_id = NULL;
    DELETE FROM teams;
    DELETE FROM users;
  `);

  // Users
  const insertUser = db.prepare(`INSERT INTO users (id, name, role) VALUES (?, ?, ?)`);
  const userIds: Record<string, string> = {};
  const add = (name: string, role: string) => {
    const id = randomUUID();
    insertUser.run(id, name, role);
    userIds[name] = id;
  };

  add("admin", "admin");
  ["Kaan", "Batuhan", "Çağrı"].forEach((n) => add(n, "manager"));
  add("Erhan", "scrum_master");
  ["Kübra", "Zeynep", "Anıl", "Uğur"].forEach((n) => add(n, "member"));

  // Team
  const teamId = randomUUID();
  db.prepare(`INSERT INTO teams (id, name, scrum_master_id) VALUES (?, ?, ?)`).run(
    teamId,
    "Falcon Team",
    userIds["Erhan"],
  );
  const setTeam = db.prepare(`UPDATE users SET team_id = ? WHERE name = ?`);
  ["Erhan", "Kübra", "Zeynep", "Anıl", "Uğur"].forEach((n) => setTeam.run(teamId, n));

  // Previous retro (finished)
  const sessionId = randomUUID();
  const past = new Date();
  past.setDate(past.getDate() - 14);
  db.prepare(
    `INSERT INTO retro_sessions
       (id, name, status, vote_limit, writing_minutes, writing_ends_at, team_id, created_by, created_at)
     VALUES (?, ?, 'finished', 3, 5, NULL, ?, ?, ?)`,
  ).run(sessionId, "Sprint 11 Retro", teamId, userIds["Erhan"], past.toISOString());

  // Cards
  const insertCard = db.prepare(
    `INSERT INTO cards (id, session_id, text, category, votes, user_id) VALUES (?, ?, ?, ?, ?, ?)`,
  );
  const gladId = randomUUID();
  const madZeynepId = randomUUID();
  const madUgurId = randomUUID();
  insertCard.run(gladId, sessionId, "ekip içi iletişim güzel", "glad", 4, userIds["Anıl"]);
  insertCard.run(
    madZeynepId,
    sessionId,
    "Zeynep'in task'ları geç bitiyor",
    "mad",
    3,
    userIds["Kübra"],
  );
  insertCard.run(
    madUgurId,
    sessionId,
    "Uğur dailylere katılmıyor",
    "mad",
    3,
    userIds["Erhan"],
  );

  // Overdue actions
  const overdue = new Date();
  overdue.setDate(overdue.getDate() - 5);
  const overdueStr = overdue.toISOString().slice(0, 10);
  const insertAction = db.prepare(
    `INSERT INTO actions (id, card_id, assigned_to, description, status, deadline)
     VALUES (?, ?, ?, ?, 'open', ?)`,
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

  return {
    users: (db.prepare(`SELECT COUNT(*) AS n FROM users`).get() as { n: number }).n,
    teams: (db.prepare(`SELECT COUNT(*) AS n FROM teams`).get() as { n: number }).n,
    sessions: (db.prepare(`SELECT COUNT(*) AS n FROM retro_sessions`).get() as { n: number }).n,
    actions: (db.prepare(`SELECT COUNT(*) AS n FROM actions`).get() as { n: number }).n,
  };
}
