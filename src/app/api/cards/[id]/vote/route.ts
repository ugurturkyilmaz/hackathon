import { NextResponse } from "next/server";
import { voteCard } from "@/lib/db/repo";
import { publish } from "@/lib/db/events";

export const dynamic = "force-dynamic";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const card = voteCard(id);
  if (!card) return NextResponse.json({ error: "not found" }, { status: 404 });
  publish(`session:${card.session_id}`, { type: "card:update", card });
  return NextResponse.json(card);
}
