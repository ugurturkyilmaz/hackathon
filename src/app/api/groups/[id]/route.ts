import { NextResponse } from "next/server";
import { deleteGroup, getGroup } from "@/lib/db/repo";
import { publish } from "@/lib/db/events";

export const dynamic = "force-dynamic";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const g = getGroup(id);
  deleteGroup(id);
  if (g) publish(`session:${g.session_id}`, { type: "group:delete", id });
  return NextResponse.json({ ok: true });
}
