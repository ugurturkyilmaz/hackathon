import { NextResponse } from "next/server";
import { listUsers, upsertUser } from "@/lib/db/repo";
import { publish } from "@/lib/db/events";
import type { Role } from "@/types";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(listUsers());
}

export async function POST(req: Request) {
  const body = (await req.json()) as { name?: string; role?: Role };
  if (!body.name?.trim() || !body.role) {
    return NextResponse.json({ error: "name ve role zorunlu" }, { status: 400 });
  }
  const user = upsertUser(body.name.trim(), body.role);
  publish("users", { type: "upsert", user });
  return NextResponse.json(user);
}
