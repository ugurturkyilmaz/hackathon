import { createSseResponse } from "@/lib/db/sse";

export const dynamic = "force-dynamic";

export async function GET() {
  return createSseResponse(["actions"]);
}
