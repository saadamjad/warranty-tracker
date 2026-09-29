import { z } from "zod";

// Reminder settings as stored with the backup, so reminder emails follow the user's
// choices (D-14, D-24, FR-19).

const days = z.number().int().min(1).max(90);

export const reminderPrefsWire = z.object({
  warrantyDaysBefore: days,
  finalDaysBefore: days.nullable(),
  returnDaysBefore: days,
  emailReminders: z.boolean(),
});

export type ReminderPrefsWire = z.infer<typeof reminderPrefsWire>;
