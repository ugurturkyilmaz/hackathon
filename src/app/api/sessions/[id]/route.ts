import { NextResponse } from "next/server";
import { getSession, updateSessionStatus } from "@/lib/db/repo";
import { publish } from "@/lib/db/events";
import type { SessionStatus } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const s = getSession(id);
  if (!s) return NextResponse.json({ error: "not found" }, { status: 404 });
  return NextResponse.json(s);
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await req.json()) as { status?: SessionStatus };
  if (!body.status) {
    return NextResponse.json({ error: "status zorunlu" }, { status: 400 });
  }
  const updated = updateSessionStatus(id, body.status);
  if (!updated) return NextResponse.json({ error: "not found" }, { status: 404 });
  publish(`session:${id}`, { type: "session:update", session: updated });
  return NextResponse.json(updated);
}
