import { randomUUID } from "node:crypto";
import { getDb } from "./client";

export interface SeedSummary {
  users: number;
  teams: number;
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

  const insertUser = db.prepare(`INSERT INTO users (id, name, role) VALUES (?, ?, ?)`);
  const seed = (name: string, role: string) => insertUser.run(randomUUID(), name, role);

  seed("admin", "admin");
  ["Kaan", "Batuhan", "Çağrı"].forEach((n) => seed(n, "manager"));
  seed("Erhan", "scrum_master");
  ["Kübra", "Zeynep", "Anıl", "Uğur"].forEach((n) => seed(n, "member"));

  const userCount = (db.prepare(`SELECT COUNT(*) AS n FROM users`).get() as { n: number }).n;
  const teamCount = (db.prepare(`SELECT COUNT(*) AS n FROM teams`).get() as { n: number }).n;
  return { users: userCount, teams: teamCount };
}
