import { NextResponse } from "next/server";
import { createSession, getTeamForUser, listSessions, listSessionsForTeam } from "@/lib/db/repo";
import { publish } from "@/lib/db/events";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const userId = url.searchParams.get("for_user");
  const all = url.searchParams.get("all") === "1";
  if (all || !userId) return NextResponse.json(listSessions());
  const team = getTeamForUser(userId);
  if (!team) return NextResponse.json([]);
  return NextResponse.json(listSessionsForTeam(team.id));
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    name?: string;
    vote_limit?: number;
    writing_minutes?: number;
    team_id?: string | null;
    created_by?: string | null;
  };
  if (!body.name?.trim()) {
    return NextResponse.json({ error: "name zorunlu" }, { status: 400 });
  }
  const session = createSession({
    name: body.name.trim(),
    vote_limit: body.vote_limit ?? 3,
    writing_minutes: body.writing_minutes ?? 5,
    team_id: body.team_id ?? null,
    created_by: body.created_by ?? null,
  });
  publish("sessions", { type: "insert", session });
  return NextResponse.json(session);
}
