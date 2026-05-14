import { NextResponse } from "next/server";
import { createCard, listCardsBySession } from "@/lib/db/repo";
import { publish } from "@/lib/db/events";
import type { Category } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  return NextResponse.json(listCardsBySession(id));
}

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const body = (await req.json()) as {
    text?: string;
    category?: Category;
    user_id?: string | null;
  };
  if (!body.text?.trim() || !body.category) {
    return NextResponse.json({ error: "text ve category zorunlu" }, { status: 400 });
  }
  const card = createCard({
    session_id: id,
    text: body.text.trim(),
    category: body.category,
    user_id: body.user_id ?? null,
  });
  publish(`session:${id}`, { type: "card:insert", card });
  return NextResponse.json(card);
}
