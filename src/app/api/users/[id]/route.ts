import { NextResponse } from "next/server";
import { updateUserRole } from "@/lib/db/repo";
import { publish } from "@/lib/db/events";
import type { Role } from "@/types";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await req.json()) as { role?: Role };
  if (!body.role) return NextResponse.json({ error: "role zorunlu" }, { status: 400 });
  const updated = updateUserRole(id, body.role);
  if (!updated) return NextResponse.json({ error: "not found" }, { status: 404 });
  publish("users", { type: "update", user: updated });
  return NextResponse.json(updated);
}
