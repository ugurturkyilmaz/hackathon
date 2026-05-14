import { randomUUID } from "node:crypto";
import { getDb } from "./client";
import type {
  Action,
  ActionStatus,
  ActionWithContext,
  Card,
  CardGroup,
  Category,
  RetroSession,
  RetroSessionWithTeam,
  Role,
  SessionStatus,
  Team,
  TeamWithMembers,
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

export function getUser(id: string): User | undefined {
  return getDb().prepare(`SELECT * FROM users WHERE id = ?`).get(id) as User | undefined;
}

export function upsertUser(name: string, role: Role): User {
  const db = getDb();
  const existing = findUserByName(name);
  if (existing) {
    if (existing.role !== role) {
      db.prepare(`UPDATE users SET role = ? WHERE id = ?`).run(role, existing.id);
    }
    return getUser(existing.id)!;
  }
  const id = randomUUID();
  db.prepare(`INSERT INTO users (id, name, role) VALUES (?, ?, ?)`).run(id, name, role);
  return getUser(id)!;
}

export function updateUserRole(id: string, role: Role): User | undefined {
  const db = getDb();
  db.prepare(`UPDATE users SET role = ? WHERE id = ?`).run(role, id);
  return getUser(id);
}

export function setUserTeam(id: string, teamId: string | null): User | undefined {
  const db = getDb();
  db.prepare(`UPDATE users SET team_id = ? WHERE id = ?`).run(teamId, id);
  return getUser(id);
}

// ---------- Teams ----------

export function listTeamsWithMembers(): TeamWithMembers[] {
  const db = getDb();
  const teams = db
    .prepare(`SELECT * FROM teams ORDER BY created_at`)
    .all() as Team[];

  return teams.map((t) => {
    const sm = t.scrum_master_id
      ? (db
          .prepare(`SELECT id, name FROM users WHERE id = ?`)
          .get(t.scrum_master_id) as { id: string; name: string } | undefined)
      : undefined;
    const members = db
      .prepare(`SELECT id, name, role FROM users WHERE team_id = ? ORDER BY name`)
      .all(t.id) as Pick<User, "id" | "name" | "role">[];
    return {
      ...t,
      scrum_master: sm ?? null,
      members,
    };
  });
}

export function getTeam(id: string): Team | undefined {
  return getDb().prepare(`SELECT * FROM teams WHERE id = ?`).get(id) as Team | undefined;
}

export function getTeamForUser(userId: string): Team | undefined {
  const db = getDb();
  const u = getUser(userId);
  if (!u) return undefined;
  if (u.team_id) {
    return db.prepare(`SELECT * FROM teams WHERE id = ?`).get(u.team_id) as Team | undefined;
  }
  // SMs may also be referenced as scrum_master_id without team_id sync
  return db
    .prepare(`SELECT * FROM teams WHERE scrum_master_id = ?`)
    .get(userId) as Team | undefined;
}

export function createTeam(input: { name: string; scrum_master_id: string | null }): Team {
  const id = randomUUID();
  const db = getDb();
  db.prepare(
    `INSERT INTO teams (id, name, scrum_master_id) VALUES (?, ?, ?)`,
  ).run(id, input.name, input.scrum_master_id);
  // also place SM into team_id for filtering
  if (input.scrum_master_id) {
    db.prepare(`UPDATE users SET team_id = ? WHERE id = ?`).run(id, input.scrum_master_id);
  }
  return getTeam(id)!;
}

export function updateTeam(
  id: string,
  patch: Partial<{ name: string; scrum_master_id: string | null }>,
): Team | undefined {
  const db = getDb();
  if (patch.name !== undefined) {
    db.prepare(`UPDATE teams SET name = ? WHERE id = ?`).run(patch.name, id);
  }
  if (patch.scrum_master_id !== undefined) {
    db.prepare(`UPDATE teams SET scrum_master_id = ? WHERE id = ?`).run(
      patch.scrum_master_id,
      id,
    );
    if (patch.scrum_master_id) {
      db.prepare(`UPDATE users SET team_id = ? WHERE id = ?`).run(id, patch.scrum_master_id);
    }
  }
  return getTeam(id);
}

export function deleteTeam(id: string): void {
  const db = getDb();
  db.prepare(`UPDATE users SET team_id = NULL WHERE team_id = ?`).run(id);
  db.prepare(`DELETE FROM teams WHERE id = ?`).run(id);
}

export function addMemberToTeam(teamId: string, userId: string): User | undefined {
  return setUserTeam(userId, teamId);
}

export function removeMemberFromTeam(userId: string): User | undefined {
  return setUserTeam(userId, null);
}

// ---------- Sessions ----------

export function listSessions(): RetroSessionWithTeam[] {
  return getDb()
    .prepare(
      `SELECT s.*, t.name AS team_name
       FROM retro_sessions s
       LEFT JOIN teams t ON s.team_id = t.id
       ORDER BY s.created_at DESC`,
    )
    .all() as RetroSessionWithTeam[];
}

export function listSessionsForTeam(teamId: string): RetroSessionWithTeam[] {
  return getDb()
    .prepare(
      `SELECT s.*, t.name AS team_name
       FROM retro_sessions s
       LEFT JOIN teams t ON s.team_id = t.id
       WHERE s.team_id = ?
       ORDER BY s.created_at DESC`,
    )
    .all(teamId) as RetroSessionWithTeam[];
}

export function getSession(id: string): RetroSession | undefined {
  return getDb()
    .prepare(`SELECT * FROM retro_sessions WHERE id = ?`)
    .get(id) as RetroSession | undefined;
}

export function createSession(input: {
  name: string;
  vote_limit: number;
  writing_minutes: number;
  team_id: string | null;
  created_by: string | null;
}): RetroSession {
  const id = randomUUID();
  const db = getDb();
  const writingEndsAt = computeEndsAt(input.writing_minutes);
  db.prepare(
    `INSERT INTO retro_sessions
       (id, name, vote_limit, writing_minutes, writing_ends_at, team_id, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    input.name,
    input.vote_limit,
    input.writing_minutes,
    writingEndsAt,
    input.team_id,
    input.created_by,
  );
  return getSession(id)!;
}

function computeEndsAt(minutes: number): string | null {
  if (!minutes || minutes <= 0) return null;
  return new Date(Date.now() + minutes * 60_000).toISOString();
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

export function getCard(id: string): Card | undefined {
  return getDb().prepare(`SELECT * FROM cards WHERE id = ?`).get(id) as Card | undefined;
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
  return getCard(id)!;
}

export function voteCard(id: string): Card | undefined {
  const db = getDb();
  db.prepare(`UPDATE cards SET votes = votes + 1 WHERE id = ?`).run(id);
  return getCard(id);
}

export function setCardGroup(cardId: string, groupId: string | null): Card | undefined {
  const db = getDb();
  db.prepare(`UPDATE cards SET group_id = ? WHERE id = ?`).run(groupId, cardId);
  return getCard(cardId);
}

// ---------- Card Groups ----------

export function listGroupsBySession(sessionId: string): CardGroup[] {
  return getDb()
    .prepare(`SELECT * FROM card_groups WHERE session_id = ? ORDER BY created_at`)
    .all(sessionId) as CardGroup[];
}

export function getGroup(id: string): CardGroup | undefined {
  return getDb().prepare(`SELECT * FROM card_groups WHERE id = ?`).get(id) as CardGroup | undefined;
}

export function createGroupWithCards(input: {
  session_id: string;
  name: string;
  card_ids: string[];
}): { group: CardGroup; cards: Card[] } {
  const id = randomUUID();
  const db = getDb();
  const tx = db.transaction(() => {
    db.prepare(`INSERT INTO card_groups (id, session_id, name) VALUES (?, ?, ?)`).run(
      id,
      input.session_id,
      input.name,
    );
    const updateStmt = db.prepare(
      `UPDATE cards SET group_id = ? WHERE id = ? AND session_id = ?`,
    );
    for (const cardId of input.card_ids) {
      updateStmt.run(id, cardId, input.session_id);
    }
  });
  tx();
  const group = getGroup(id)!;
  const cards = listCardsBySession(input.session_id).filter((c) => c.group_id === id);
  return { group, cards };
}

export function deleteGroup(id: string): void {
  const db = getDb();
  // ON DELETE SET NULL handles cards.group_id and actions.group_id
  db.prepare(`DELETE FROM card_groups WHERE id = ?`).run(id);
}

// ---------- Actions ----------

export function listActionsEnriched(): ActionWithContext[] {
  const db = getDb();
  const rows = db
    .prepare(
      `SELECT
         a.id, a.card_id, a.group_id, a.assigned_to, a.description, a.status, a.deadline, a.created_at,
         c.text AS card_text, c.category AS card_category, c.session_id AS card_session_id,
         g.name AS group_name, g.session_id AS group_session_id,
         u.name AS assignee_name
       FROM actions a
       LEFT JOIN cards c           ON a.card_id = c.id
       LEFT JOIN card_groups g     ON a.group_id = g.id
       LEFT JOIN users u           ON a.assigned_to = u.id
       ORDER BY a.created_at DESC`,
    )
    .all() as Array<{
      id: string;
      card_id: string | null;
      group_id: string | null;
      assigned_to: string | null;
      description: string;
      status: ActionStatus;
      deadline: string | null;
      created_at: string;
      card_text: string | null;
      card_category: Category | null;
      card_session_id: string | null;
      group_name: string | null;
      group_session_id: string | null;
      assignee_name: string | null;
    }>;

  // session_name lookup (one query)
  const sessionIds = Array.from(
    new Set(
      rows
        .map((r) => r.card_session_id || r.group_session_id)
        .filter((x): x is string => x !== null && x !== undefined),
    ),
  );
  const sessionNameMap = new Map<string, string>();
  if (sessionIds.length) {
    const placeholders = sessionIds.map(() => "?").join(",");
    const sRows = db
      .prepare(`SELECT id, name FROM retro_sessions WHERE id IN (${placeholders})`)
      .all(...sessionIds) as Array<{ id: string; name: string }>;
    for (const s of sRows) sessionNameMap.set(s.id, s.name);
  }

  // group card counts
  const groupIds = Array.from(
    new Set(rows.map((r) => r.group_id).filter((x): x is string => x !== null)),
  );
  const groupCountMap = new Map<string, number>();
  if (groupIds.length) {
    const placeholders = groupIds.map(() => "?").join(",");
    const cRows = db
      .prepare(
        `SELECT group_id, COUNT(*) AS n FROM cards WHERE group_id IN (${placeholders}) GROUP BY group_id`,
      )
      .all(...groupIds) as Array<{ group_id: string; n: number }>;
    for (const c of cRows) groupCountMap.set(c.group_id, c.n);
  }

  return rows.map((r) => {
    const sessId = r.card_session_id || r.group_session_id;
    return {
      id: r.id,
      card_id: r.card_id,
      group_id: r.group_id,
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
        : null,
      group: r.group_name
        ? {
            name: r.group_name,
            card_count: groupCountMap.get(r.group_id as string) ?? 0,
            session_id: r.group_session_id as string,
          }
        : null,
      session: sessId ? { name: sessionNameMap.get(sessId) ?? "" } : null,
      assignee: r.assignee_name ? { name: r.assignee_name } : null,
    };
  });
}

export function createAction(input: {
  card_id: string | null;
  group_id: string | null;
  assigned_to: string | null;
  description: string;
  deadline: string | null;
}): Action {
  if (!input.card_id && !input.group_id) {
    throw new Error("card_id veya group_id verilmeli");
  }
  const id = randomUUID();
  const db = getDb();
  db.prepare(
    `INSERT INTO actions (id, card_id, group_id, assigned_to, description, deadline)
     VALUES (?, ?, ?, ?, ?, ?)`,
  ).run(
    id,
    input.card_id,
    input.group_id,
    input.assigned_to,
    input.description,
    input.deadline,
  );
  return db.prepare(`SELECT * FROM actions WHERE id = ?`).get(id) as Action;
}

export function updateActionStatus(id: string, status: ActionStatus): Action | undefined {
  const db = getDb();
  db.prepare(`UPDATE actions SET status = ? WHERE id = ?`).run(status, id);
  return db.prepare(`SELECT * FROM actions WHERE id = ?`).get(id) as Action | undefined;
}

// Returns all actions belonging to the most recent prior session of the
// given session's team. Used to show "previous retro's actions" before
// new cards are written.
export function listPreviousSessionActions(currentSessionId: string): {
  previousSession: { id: string; name: string; created_at: string } | null;
  actions: ActionWithContext[];
} {
  const db = getDb();
  const prev = db
    .prepare(
      `SELECT s.id, s.name, s.created_at
       FROM retro_sessions s
       WHERE s.team_id = (SELECT team_id FROM retro_sessions WHERE id = ?)
         AND s.id != ?
         AND s.created_at < (SELECT created_at FROM retro_sessions WHERE id = ?)
       ORDER BY s.created_at DESC
       LIMIT 1`,
    )
    .get(currentSessionId, currentSessionId, currentSessionId) as
    | { id: string; name: string; created_at: string }
    | undefined;

  if (!prev) return { previousSession: null, actions: [] };

  const rows = db
    .prepare(
      `SELECT
         a.id, a.card_id, a.group_id, a.assigned_to, a.description, a.status, a.deadline, a.created_at,
         c.text AS card_text, c.category AS card_category, c.session_id AS card_session_id,
         g.name AS group_name, g.session_id AS group_session_id,
         u.name AS assignee_name
       FROM actions a
       LEFT JOIN cards c       ON a.card_id = c.id
       LEFT JOIN card_groups g ON a.group_id = g.id
       LEFT JOIN users u       ON a.assigned_to = u.id
       WHERE COALESCE(c.session_id, g.session_id) = ?
       ORDER BY a.created_at DESC`,
    )
    .all(prev.id) as Array<{
      id: string;
      card_id: string | null;
      group_id: string | null;
      assigned_to: string | null;
      description: string;
      status: ActionStatus;
      deadline: string | null;
      created_at: string;
      card_text: string | null;
      card_category: Category | null;
      card_session_id: string | null;
      group_name: string | null;
      group_session_id: string | null;
      assignee_name: string | null;
    }>;

  // group counts
  const groupIds = Array.from(
    new Set(rows.map((r) => r.group_id).filter((x): x is string => x !== null)),
  );
  const groupCountMap = new Map<string, number>();
  if (groupIds.length) {
    const placeholders = groupIds.map(() => "?").join(",");
    const cRows = db
      .prepare(
        `SELECT group_id, COUNT(*) AS n FROM cards WHERE group_id IN (${placeholders}) GROUP BY group_id`,
      )
      .all(...groupIds) as Array<{ group_id: string; n: number }>;
    for (const c of cRows) groupCountMap.set(c.group_id, c.n);
  }

  return {
    previousSession: prev,
    actions: rows.map((r) => ({
      id: r.id,
      card_id: r.card_id,
      group_id: r.group_id,
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
        : null,
      group: r.group_name
        ? {
            name: r.group_name,
            card_count: groupCountMap.get(r.group_id as string) ?? 0,
            session_id: r.group_session_id as string,
          }
        : null,
      session: { name: prev.name },
      assignee: r.assignee_name ? { name: r.assignee_name } : null,
    })),
  };
}
