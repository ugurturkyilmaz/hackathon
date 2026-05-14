import { NextResponse } from "next/server";
import { createAction, listActionsEnriched } from "@/lib/db/repo";
import { publish } from "@/lib/db/events";

export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(listActionsEnriched());
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    card_id?: string | null;
    group_id?: string | null;
    assigned_to?: string | null;
    description?: string;
    deadline?: string | null;
  };
  if ((!body.card_id && !body.group_id) || !body.description?.trim()) {
    return NextResponse.json(
      { error: "(card_id veya group_id) ve description zorunlu" },
      { status: 400 },
    );
  }
  const action = createAction({
    card_id: body.card_id ?? null,
    group_id: body.group_id ?? null,
    assigned_to: body.assigned_to ?? null,
    description: body.description.trim(),
    deadline: body.deadline ?? null,
  });
  publish("actions", { type: "insert", action });
  return NextResponse.json(action);
}
