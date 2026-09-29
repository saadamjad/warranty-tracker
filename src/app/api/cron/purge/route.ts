import { subDays } from "date-fns";
import { NextResponse } from "next/server";
import { isCronRequest } from "@/lib/server/cron";
import { jsonError } from "@/lib/server/http";
import { purgeDeletedBefore } from "@/lib/server/repo";

/** Daily: remove backup data deleted more than 30 days ago (D-19). */
export async function GET(request: Request) {
  if (!isCronRequest(request)) return jsonError(401, "Not allowed.");
  const result = await purgeDeletedBefore(subDays(new Date(), 30));
  return NextResponse.json(result);
}
