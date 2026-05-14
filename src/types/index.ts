export type Role = "admin" | "scrum_master" | "member" | "manager";
export type Category = "mad" | "glad" | "sad";
export type SessionStatus = "writing" | "voting" | "finished";
export type ActionStatus = "open" | "done";

export interface User {
  id: string;
  name: string;
  role: Role;
  created_at: string;
}

export interface RetroSession {
  id: string;
  name: string;
  status: SessionStatus;
  vote_limit: number;
  created_by: string | null;
  created_at: string;
}

export interface Card {
  id: string;
  session_id: string;
  text: string;
  category: Category;
  votes: number;
  user_id: string | null;
  created_at: string;
}

export interface Action {
  id: string;
  card_id: string;
  assigned_to: string | null;
  description: string;
  status: ActionStatus;
  deadline: string | null;
  created_at: string;
}

export interface ActionWithContext extends Action {
  card?: Pick<Card, "text" | "category" | "session_id">;
  session?: Pick<RetroSession, "name">;
  assignee?: Pick<User, "name"> | null;
}
