import { NextResponse } from "next/server";
import { createGroupWithCards, listGroupsBySession } from "@/lib/db/repo";
import { publish } from "@/lib/db/events";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return NextResponse.json(listGroupsBySession(id));
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await req.json()) as { name?: string; card_ids?: string[] };
  if (!body.name?.trim() || !Array.isArray(body.card_ids) || body.card_ids.length === 0) {
    return NextResponse.json({ error: "name ve card_ids zorunlu" }, { status: 400 });
  }
  const result = createGroupWithCards({
    session_id: id,
    name: body.name.trim(),
    card_ids: body.card_ids,
  });
  publish(`session:${id}`, { type: "group:insert", group: result.group, cards: result.cards });
  return NextResponse.json(result.group);
}
