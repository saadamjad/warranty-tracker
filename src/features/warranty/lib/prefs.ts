import { db } from "@/lib/db";

export type ReminderPrefs = {
  /** First warranty reminder (D-14). */
  warrantyDaysBefore: number;
  /** Optional final warranty reminder; null turns it off (D-14). */
  finalDaysBefore: number | null;
  /** Return deadline reminder (D-24). */
  returnDaysBefore: number;
};

export const DEFAULT_REMINDER_PREFS: ReminderPrefs = { warrantyDaysBefore: 30, finalDaysBefore: 7, returnDaysBefore: 3 };

const KEY = "reminderPrefs";

export async function getReminderPrefs(): Promise<ReminderPrefs> {
  const stored = await db.meta.get(KEY);
  return { ...DEFAULT_REMINDER_PREFS, ...(stored?.value as Partial<ReminderPrefs> | undefined) };
}

/** Read-modify-write in one transaction so quick successive changes don't overwrite each other. */
export async function setReminderPrefs(prefs: Partial<ReminderPrefs>): Promise<void> {
  await db.transaction("rw", db.meta, async () => {
    await db.meta.put({ key: KEY, value: { ...(await getReminderPrefs()), ...prefs } });
  });
}
