import { NextResponse } from "next/server";
import { isCronRequest } from "@/lib/server/cron";
import { jsonError } from "@/lib/server/http";
import { sendDueReminderEmails } from "@/lib/server/reminderEmails";

/** Daily: email warranty and return reminders to people with backup on (AC-10). */
export async function GET(request: Request) {
  if (!isCronRequest(request)) return jsonError(401, "Not allowed.");
  return NextResponse.json(await sendDueReminderEmails());
}
