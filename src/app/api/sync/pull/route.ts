import { NextResponse } from "next/server";
import { jsonError, sessionUserId } from "@/lib/server/http";
import { pullChanges } from "@/lib/server/repo";
import { pullQuery } from "@/lib/sync/schema";

export async function GET(request: Request) {
  const userId = await sessionUserId();
  if (!userId) return jsonError(401, "Sign in to restore.");

  const query = pullQuery.safeParse(Object.fromEntries(new URL(request.url).searchParams));
  if (!query.success) return jsonError(400, "Invalid cursor.");

  return NextResponse.json(await pullChanges(userId, BigInt(query.data.cursor)));
}
