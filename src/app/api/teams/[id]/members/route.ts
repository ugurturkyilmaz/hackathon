import { NextResponse } from "next/server";
import { addMemberToTeam } from "@/lib/db/repo";
import { publish } from "@/lib/db/events";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await req.json()) as { user_id?: string };
  if (!body.user_id) {
    return NextResponse.json({ error: "user_id zorunlu" }, { status: 400 });
  }
  const user = addMemberToTeam(id, body.user_id);
  if (!user) return NextResponse.json({ error: "user not found" }, { status: 404 });
  publish("teams", { type: "members:update", team_id: id });
  return NextResponse.json(user);
}
