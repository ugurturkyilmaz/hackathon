import { NextResponse } from "next/server";
import { createSession, listSessions } from "@/lib/db/repo";
import { publish } from "@/lib/db/events";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(listSessions());
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    name?: string;
    vote_limit?: number;
    created_by?: string | null;
  };
  if (!body.name?.trim()) {
    return NextResponse.json({ error: "name zorunlu" }, { status: 400 });
  }
  const session = createSession({
    name: body.name.trim(),
    vote_limit: body.vote_limit ?? 3,
    created_by: body.created_by ?? null,
  });
  publish("sessions", { type: "insert", session });
  return NextResponse.json(session);
}
