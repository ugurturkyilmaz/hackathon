import { NextResponse } from "next/server";
import { removeMemberFromTeam } from "@/lib/db/repo";
import { publish } from "@/lib/db/events";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string; userId: string }> },
) {
  const { id, userId } = await params;
  const user = removeMemberFromTeam(userId);
  if (!user) return NextResponse.json({ error: "not found" }, { status: 404 });
  publish("teams", { type: "members:update", team_id: id });
  return NextResponse.json({ ok: true });
}
