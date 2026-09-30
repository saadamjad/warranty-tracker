import { randomUUID } from "node:crypto";
import { addDays, format } from "date-fns";
import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "./prisma";
import { sendDueReminderEmails } from "./reminderEmails";

vi.mock("./env", () => ({ serverEnv: () => ({ APP_URL: "https://vault.test" }) }));

const today = new Date("2026-09-30T08:00:00.000Z");
const inDays = (n: number) => new Date(`${format(addDays(today, n), "yyyy-MM-dd")}T00:00:00.000Z`);
const send = vi.fn(async () => undefined);

async function userWithWarranty(daysLeft: number, extra: { remindersOff?: boolean; emailEnabled?: boolean; productName?: string } = {}) {
  const user = await prisma.user.create({ data: { email: `${randomUUID()}@test.local` } });
  const vault = await prisma.vault.create({ data: { ownerId: user.id } });
  const purchase = await prisma.purchase.create({
    data: { id: randomUUID(), userId: user.id, vaultId: vault.id, productName: extra.productName ?? "TV <55\">", remindersOff: extra.remindersOff ?? false, updatedAt: today },
  });
  await prisma.warranty.create({ data: { id: randomUUID(), userId: user.id, purchaseId: purchase.id, endDate: inDays(daysLeft), updatedAt: today } });
  if (extra.emailEnabled === false) await prisma.reminderPref.create({ data: { userId: user.id, emailEnabled: false } });
  return { user, purchase };
}

describe("sendDueReminderEmails (AC-10)", () => {
  beforeEach(async () => {
    await prisma.reminderLog.deleteMany();
    await prisma.vault.deleteMany();
    await prisma.user.deleteMany();
    send.mockClear();
  });
  afterAll(() => prisma.$disconnect());

  it("emails a due warranty once, with a link and escaped text", async () => {
    const { user, purchase } = await userWithWarranty(20);
    expect(await sendDueReminderEmails(today, send)).toEqual({ emails: 1, reminders: 1, failed: 0 });
    const [mail] = send.mock.calls[0] as unknown as [{ to: string; subject: string; text: string; html: string }];
    expect(mail.to).toBe(user.email);
    expect(mail.subject).toBe('TV <55"> — Warranty ends in 20 days');
    expect(mail.text).toContain(`https://vault.test/p?id=${purchase.id}`);
    expect(mail.html).not.toContain("<55");

    expect(await sendDueReminderEmails(today, send)).toEqual({ emails: 0, reminders: 0, failed: 0 });
  });

  it("sends the final reminder a week before, once", async () => {
    await userWithWarranty(20);
    await sendDueReminderEmails(today, send);
    expect(await sendDueReminderEmails(addDays(today, 14), send)).toEqual({ emails: 1, reminders: 1, failed: 0 });
    expect(await sendDueReminderEmails(addDays(today, 15), send)).toEqual({ emails: 0, reminders: 0, failed: 0 });
  });

  it("respects email off, reminders off per purchase, and far-off dates", async () => {
    await userWithWarranty(20, { emailEnabled: false });
    await userWithWarranty(20, { remindersOff: true });
    await userWithWarranty(200);
    expect(await sendDueReminderEmails(today, send)).toEqual({ emails: 0, reminders: 0, failed: 0 });
    expect(send).not.toHaveBeenCalled();
  });

  it("keeps emailing everyone else when one email fails, and retries it next run", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const first = await userWithWarranty(20);
    const second = await userWithWarranty(20);
    const failing = vi.fn(async (mail: { to: string }) => {
      if (mail.to === first.user.email) throw new Error("mailbox rejected");
    });
    expect(await sendDueReminderEmails(today, failing)).toEqual({ emails: 1, reminders: 1, failed: 1 });
    expect(failing.mock.calls.map(([mail]) => mail.to)).toContain(second.user.email);

    send.mockClear();
    expect(await sendDueReminderEmails(today, send)).toEqual({ emails: 1, reminders: 1, failed: 0 });
    expect((send.mock.calls[0] as unknown as [{ to: string }])[0].to).toBe(first.user.email);
  });
});
