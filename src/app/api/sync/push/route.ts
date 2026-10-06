import { NextResponse } from "next/server";
import { apiRateLimit, jsonError, parseJson, sessionUserId } from "@/lib/server/http";
import { ForbiddenRecordError, pushChanges } from "@/lib/server/repo";
import { pushBody } from "@/lib/sync/schema";

export async function POST(request: Request) {
  const userId = await sessionUserId();
  if (!userId) return jsonError(401, "Sign in to back up.");
  const limited = await apiRateLimit(userId);
  if (limited) return limited;

  const body = await parseJson(request, pushBody);
  if (!body) return jsonError(400, "Invalid backup data.");

  try {
    await pushChanges(userId, body);
    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ForbiddenRecordError) return jsonError(403, "Not allowed.");
    console.error("sync push failed", { userId, error });
    return jsonError(500, "Backup failed. It will try again.");
  }
}
