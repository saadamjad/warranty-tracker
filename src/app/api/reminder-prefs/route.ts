import { NextResponse } from "next/server";
import { jsonError, parseJson, sessionUserId } from "@/lib/server/http";
import { saveReminderPrefs } from "@/lib/server/repo";
import { reminderPrefsWire } from "@/lib/sync/prefs";

export async function PUT(request: Request) {
  const userId = await sessionUserId();
  if (!userId) return jsonError(401, "Sign in to save reminder settings.");
  const prefs = await parseJson(request, reminderPrefsWire);
  if (!prefs) return jsonError(400, "Invalid reminder settings.");
  await saveReminderPrefs(userId, prefs);
  return NextResponse.json({ ok: true });
}
