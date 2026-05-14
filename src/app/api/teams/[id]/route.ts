import { NextResponse } from "next/server";
import { deleteTeam, updateTeam } from "@/lib/db/repo";
import { publish } from "@/lib/db/events";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await req.json()) as { name?: string; scrum_master_id?: string | null };
  const updated = updateTeam(id, body);
  if (!updated) return NextResponse.json({ error: "not found" }, { status: 404 });
  publish("teams", { type: "update", team: updated });
  return NextResponse.json(updated);
}

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  deleteTeam(id);
  publish("teams", { type: "delete", id });
  return NextResponse.json({ ok: true });
}
