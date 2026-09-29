import type { ReminderKind } from "@prisma/client";
import { addDays } from "date-fns";
import { upcomingText } from "@/features/reminders/lib/text";
import { reminderKey, upcomingDeadlines, type Upcoming } from "@/features/reminders/lib/upcoming";
import { DEFAULT_REMINDER_PREFS, type ReminderPrefs } from "@/features/warranty/lib/prefs";
import type { Purchase } from "@/lib/db/types";
import { serverEnv } from "./env";
import { sendMail, type Mail } from "./mailer";
import { prisma } from "./prisma";
import { purchaseFromRow, warrantyFromRow } from "./syncMapping";

// Daily reminder emails for backed-up purchases: the same deadlines and timing rules as the
// app (D-14, D-24), at most one email per person per day, each reminder sent once.

const KINDS: Record<string, ReminderKind> = { warranty: "WARRANTY", "warranty-final": "WARRANTY_FINAL", return: "RETURN" };
const HORIZON_DAYS = 91;
const USER_BATCH = 200;

type Send = (mail: Mail) => Promise<void>;

export async function sendDueReminderEmails(today: Date = new Date(), send: Send = sendMail): Promise<{ emails: number; reminders: number }> {
  let cursor: string | undefined;
  const totals = { emails: 0, reminders: 0 };

  for (;;) {
    const users = await prisma.user.findMany({
      where: { email: { not: null }, OR: [{ reminderPref: null }, { reminderPref: { emailEnabled: true } }] },
      include: { reminderPref: true },
      orderBy: { id: "asc" },
      take: USER_BATCH,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    });
    for (const user of users) {
      const prefs: ReminderPrefs = user.reminderPref
        ? { ...DEFAULT_REMINDER_PREFS, ...user.reminderPref, emailReminders: user.reminderPref.emailEnabled }
        : DEFAULT_REMINDER_PREFS;
      const sent = await remindUser(user.id, user.email!, prefs, today, send);
      if (sent) {
        totals.emails++;
        totals.reminders += sent;
      }
    }
    if (users.length < USER_BATCH) return totals;
    cursor = users.at(-1)!.id;
  }
}

async function remindUser(userId: string, email: string, prefs: ReminderPrefs, today: Date, send: Send): Promise<number> {
  const horizon = addDays(today, HORIZON_DAYS);
  const [purchases, warranties] = await Promise.all([
    prisma.purchase.findMany({ where: { userId, deletedAt: null, remindersOff: false } }),
    prisma.warranty.findMany({ where: { userId, deletedAt: null, endDate: { gte: addDays(today, -1), lte: horizon } } }),
  ]);
  const due = upcomingDeadlines(purchases.map(purchaseFromRow) as Purchase[], warranties.map(warrantyFromRow), prefs, today).map((item) => ({
    item,
    kind: KINDS[reminderKey(item, prefs).split(":")[0]],
    dueAt: new Date(`${item.date}T00:00:00.000Z`),
  }));
  if (due.length === 0) return 0;

  const logged = await prisma.reminderLog.findMany({ where: { userId, targetId: { in: due.map((d) => d.item.targetId) } } });
  const fresh = due.filter((d) => !logged.some((log) => log.targetId === d.item.targetId && log.kind === d.kind && log.dueAt.getTime() === d.dueAt.getTime()));
  if (fresh.length === 0) return 0;

  await send(reminderMail(email, fresh.map((d) => d.item)));
  // Logged after sending: if sending fails, tomorrow's run tries again.
  await prisma.reminderLog.createMany({
    data: fresh.map((d) => ({ userId, targetId: d.item.targetId, kind: d.kind, dueAt: d.dueAt })),
    skipDuplicates: true,
  });
  return fresh.length;
}

function reminderMail(to: string, items: Upcoming[]): Mail {
  const base = serverEnv().APP_URL.replace(/\/$/, "");
  const link = (item: Upcoming) => `${base}/p?id=${encodeURIComponent(item.purchaseId)}`;
  const subject = items.length === 1 ? upcomingText(items[0]) : `${items.length} dates coming up`;
  const footer = `You get these because backup is on. Change or turn off reminders: ${base}/settings`;
  return {
    to,
    subject,
    text: [...items.map((item) => `• ${upcomingText(item)}\n  ${link(item)}`), "", footer].join("\n"),
    html: `<ul>${items.map((item) => `<li><a href="${escapeHtml(link(item))}">${escapeHtml(upcomingText(item))}</a></li>`).join("")}</ul><p style="color:#57534e">${escapeHtml(footer)}</p>`,
  };
}

function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => `&#${char.charCodeAt(0)};`);
}
