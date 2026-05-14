import { NextResponse } from "next/server";
import { updateActionStatus } from "@/lib/db/repo";
import { publish } from "@/lib/db/events";
import type { ActionStatus } from "@/types";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await req.json()) as { status?: ActionStatus };
  if (!body.status) {
    return NextResponse.json({ error: "status zorunlu" }, { status: 400 });
  }
  const updated = updateActionStatus(id, body.status);
  if (!updated) return NextResponse.json({ error: "not found" }, { status: 404 });
  publish("actions", { type: "update", action: updated });
  return NextResponse.json(updated);
}
