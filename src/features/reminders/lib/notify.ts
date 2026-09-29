import { getReminderPrefs } from "@/features/warranty/lib/prefs";
import { db } from "@/lib/db";
import { listUpcoming } from "./reminders";
import { upcomingText } from "./text";
import { reminderKey } from "./upcoming";

const SHOWN_KEY = "shownReminders";

/**
 * Shows each due reminder once (sparse notifications, §6). Returns how many were shown.
 * `show` is injected so callers choose the channel (browser notification now, email later).
 */
export async function showDueReminders(show: (text: string) => void, today: Date = new Date()): Promise<number> {
  const [items, prefs, stored] = await Promise.all([listUpcoming(today), getReminderPrefs(), db.meta.get(SHOWN_KEY)]);
  const shown = new Set((stored?.value as string[] | undefined) ?? []);
  let count = 0;

  for (const item of items) {
    const key = reminderKey(item, prefs);
    if (shown.has(key)) continue;
    show(upcomingText(item));
    shown.add(key);
    count++;
  }

  if (count > 0) await db.meta.put({ key: SHOWN_KEY, value: [...shown] });
  return count;
}
