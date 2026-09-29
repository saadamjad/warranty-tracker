import Link from "next/link";
import { AccountSection } from "@/features/account/components/AccountSection";
import { ReminderSettings } from "@/features/reminders/components/ReminderSettings";

export default function SettingsPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col gap-8 px-4 py-12">
      <Link href="/" className="text-primary hover:underline">
        ← All purchases
      </Link>
      <h1 className="text-2xl font-bold">Settings</h1>
      <AccountSection />
      <ReminderSettings />
      <section aria-labelledby="data-heading" className="flex flex-col gap-2">
        <h2 id="data-heading" className="text-lg font-semibold">
          Your purchases
        </h2>
        <Link href="/settings/deleted" className="text-primary hover:underline">
          Recently Deleted
        </Link>
      </section>
    </main>
  );
}
