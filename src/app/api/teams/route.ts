import { NextResponse } from "next/server";
import { createTeam, listTeamsWithMembers } from "@/lib/db/repo";
import { publish } from "@/lib/db/events";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(listTeamsWithMembers());
}

export async function POST(req: Request) {
  const body = (await req.json()) as { name?: string; scrum_master_id?: string | null };
  if (!body.name?.trim()) {
    return NextResponse.json({ error: "name zorunlu" }, { status: 400 });
  }
  const team = createTeam({
    name: body.name.trim(),
    scrum_master_id: body.scrum_master_id ?? null,
  });
  publish("teams", { type: "insert", team });
  return NextResponse.json(team);
}
