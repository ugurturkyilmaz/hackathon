import { NextResponse } from "next/server";
import { resetAndSeed } from "@/lib/db/seed";

export const dynamic = "force-dynamic";

export async function POST() {
  const summary = resetAndSeed();
  return NextResponse.json({ ok: true, ...summary });
}
