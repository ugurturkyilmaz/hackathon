import { randomUUID } from "node:crypto";
import { getDb } from "./client";
import type {
  Action,
  ActionStatus,
  ActionWithContext,
  Card,
  Category,
  RetroSession,
  Role,
  SessionStatus,
  User,
} from "@/types";

// ---------- Users ----------

export function listUsers(): User[] {
  return getDb()
    .prepare(`SELECT * FROM users ORDER BY created_at`)
    .all() as User[];
}

export function findUserByName(name: string): User | undefined {
  return getDb()
    .prepare(`SELECT * FROM users WHERE name = ?`)
    .get(name) as User | undefined;
}

export function upsertUser(name: string, role: Role): User {
  const db = getDb();
  const existing = findUserByName(name);
  if (existing) {
    if (existing.role !== role) {
      db.prepare(`UPDATE users SET role = ? WHERE id = ?`).run(role, existing.id);
    }
    return { ...existing, role };
  }
  const id = randomUUID();
  db.prepare(
    `INSERT INTO users (id, name, role) VALUES (?, ?, ?)`,
  ).run(id, name, role);
  return db.prepare(`SELECT * FROM users WHERE id = ?`).get(id) as User;
}

export function updateUserRole(id: string, role: Role): User | undefined {
  const db = getDb();
  db.prepare(`UPDATE users SET role = ? WHERE id = ?`).run(role, id);
  return db.prepare(`SELECT * FROM users WHERE id = ?`).get(id) as User | undefined;
}

// ---------- Sessions ----------

export function listSessions(): RetroSession[] {
  return getDb()
    .prepare(`SELECT * FROM retro_sessions ORDER BY created_at DESC`)
    .all() as RetroSession[];
}

export function getSession(id: string): RetroSession | undefined {
  return getDb()
    .prepare(`SELECT * FROM retro_sessions WHERE id = ?`)
    .get(id) as RetroSession | undefined;
}

export function createSession(input: {
  name: string;
  vote_limit: number;
  created_by: string | null;
}): RetroSession {
  const id = randomUUID();
  const db = getDb();
  db.prepare(
    `INSERT INTO retro_sessions (id, name, vote_limit, created_by) VALUES (?, ?, ?, ?)`,
  ).run(id, input.name, input.vote_limit, input.created_by);
  return db.prepare(`SELECT * FROM retro_sessions WHERE id = ?`).get(id) as RetroSession;
}

export function updateSessionStatus(id: string, status: SessionStatus): RetroSession | undefined {
  const db = getDb();
  db.prepare(`UPDATE retro_sessions SET status = ? WHERE id = ?`).run(status, id);
  return getSession(id);
}

// ---------- Cards ----------

export function listCardsBySession(sessionId: string): Card[] {
  return getDb()
    .prepare(`SELECT * FROM cards WHERE session_id = ? ORDER BY created_at`)
    .all(sessionId) as Card[];
}

export function createCard(input: {
  session_id: string;
  text: string;
  category: Category;
  user_id: string | null;
}): Card {
  const id = randomUUID();
  const db = getDb();
  db.prepare(
    `INSERT INTO cards (id, session_id, text, category, user_id) VALUES (?, ?, ?, ?, ?)`,
  ).run(id, input.session_id, input.text, input.category, input.user_id);
  return db.prepare(`SELECT * FROM cards WHERE id = ?`).get(id) as Card;
}

export function voteCard(id: string): Card | undefined {
  const db = getDb();
  db.prepare(`UPDATE cards SET votes = votes + 1 WHERE id = ?`).run(id);
  return db.prepare(`SELECT * FROM cards WHERE id = ?`).get(id) as Card | undefined;
}

// ---------- Actions ----------

export function listActionsEnriched(): ActionWithContext[] {
  const rows = getDb()
    .prepare(
      `SELECT
         a.id, a.card_id, a.assigned_to, a.description, a.status, a.deadline, a.created_at,
         c.text AS card_text, c.category AS card_category, c.session_id AS card_session_id,
         s.name AS session_name,
         u.name AS assignee_name
       FROM actions a
       LEFT JOIN cards c           ON a.card_id = c.id
       LEFT JOIN retro_sessions s  ON c.session_id = s.id
       LEFT JOIN users u           ON a.assigned_to = u.id
       ORDER BY a.created_at DESC`,
    )
    .all() as Array<{
      id: string;
      card_id: string;
      assigned_to: string | null;
      description: string;
      status: ActionStatus;
      deadline: string | null;
      created_at: string;
      card_text: string | null;
      card_category: Category | null;
      card_session_id: string | null;
      session_name: string | null;
      assignee_name: string | null;
    }>;

  return rows.map((r) => ({
    id: r.id,
    card_id: r.card_id,
    assigned_to: r.assigned_to,
    description: r.description,
    status: r.status,
    deadline: r.deadline,
    created_at: r.created_at,
    card: r.card_text
      ? {
          text: r.card_text,
          category: r.card_category as Category,
          session_id: r.card_session_id as string,
        }
      : undefined,
    session: r.session_name ? { name: r.session_name } : undefined,
    assignee: r.assignee_name ? { name: r.assignee_name } : null,
  }));
}

export function createAction(input: {
  card_id: string;
  assigned_to: string | null;
  description: string;
  deadline: string | null;
}): Action {
  const id = randomUUID();
  const db = getDb();
  db.prepare(
    `INSERT INTO actions (id, card_id, assigned_to, description, deadline) VALUES (?, ?, ?, ?, ?)`,
  ).run(id, input.card_id, input.assigned_to, input.description, input.deadline);
  return db.prepare(`SELECT * FROM actions WHERE id = ?`).get(id) as Action;
}

export function updateActionStatus(id: string, status: ActionStatus): Action | undefined {
  const db = getDb();
  db.prepare(`UPDATE actions SET status = ? WHERE id = ?`).run(status, id);
  return db.prepare(`SELECT * FROM actions WHERE id = ?`).get(id) as Action | undefined;
}
