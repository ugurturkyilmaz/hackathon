export type Role = "admin" | "scrum_master" | "member" | "manager";
export type Category = "mad" | "glad" | "sad";
export type SessionStatus = "writing" | "voting" | "finished";
export type ActionStatus = "open" | "done";

export interface User {
  id: string;
  name: string;
  role: Role;
  team_id: string | null;
  created_at: string;
}

export interface Team {
  id: string;
  name: string;
  scrum_master_id: string | null;
  created_at: string;
}

export interface TeamWithMembers extends Team {
  scrum_master?: Pick<User, "id" | "name"> | null;
  members: Pick<User, "id" | "name" | "role">[];
}

export interface RetroSession {
  id: string;
  name: string;
  status: SessionStatus;
  vote_limit: number;
  writing_minutes: number;
  writing_ends_at: string | null;
  team_id: string | null;
  created_by: string | null;
  created_at: string;
}

export interface RetroSessionWithTeam extends RetroSession {
  team_name: string | null;
}

export interface Card {
  id: string;
  session_id: string;
  text: string;
  category: Category;
  votes: number;
  user_id: string | null;
  group_id: string | null;
  created_at: string;
}

export interface CardGroup {
  id: string;
  session_id: string;
  name: string;
  created_at: string;
}

export interface Action {
  id: string;
  card_id: string | null;
  group_id: string | null;
  assigned_to: string | null;
  description: string;
  status: ActionStatus;
  deadline: string | null;
  created_at: string;
}

export interface ActionWithContext extends Action {
  card?: Pick<Card, "text" | "category" | "session_id"> | null;
  group?: (Pick<CardGroup, "name"> & { card_count: number; session_id: string }) | null;
  session?: Pick<RetroSession, "name"> | null;
  assignee?: Pick<User, "name"> | null;
}
