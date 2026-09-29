"use client";

import { useEffect, useState } from "react";
import { useAccount } from "@/features/sync/lib/hooks";
import { useReminderPrefs } from "@/features/warranty/lib/hooks";
import { setReminderPrefs } from "@/features/warranty/lib/prefs";

type Permission = NotificationPermission | "unsupported";

/** Reminder timing (FR-19) and the opt-in for notifications on this device. */
export function ReminderSettings() {
  const prefs = useReminderPrefs();
  const account = useAccount();
  const signedIn = account.status === "ready" && Boolean(account.value);

  return (
    <section aria-labelledby="reminders-heading" className="flex flex-col gap-4">
      <h2 id="reminders-heading" className="text-lg font-semibold">
        Reminders
      </h2>
      <DaysInput label="Remind me before a warranty ends" value={prefs.warrantyDaysBefore} onChange={(days) => setReminderPrefs({ warrantyDaysBefore: days })} />
      <label className="flex items-center gap-3">
        <input
          type="checkbox"
          checked={prefs.finalDaysBefore !== null}
          onChange={(event) => setReminderPrefs({ finalDaysBefore: event.target.checked ? 7 : null })}
          className="h-5 w-5"
        />
        Also remind me a week before
      </label>
      <DaysInput label="Remind me before a return date" value={prefs.returnDaysBefore} onChange={(days) => setReminderPrefs({ returnDaysBefore: days })} />
      {signedIn && (
        <label className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={prefs.emailReminders}
            onChange={(event) => setReminderPrefs({ emailReminders: event.target.checked })}
            className="h-5 w-5"
          />
          Email me reminders
        </label>
      )}
      <NotificationPermission />
    </section>
  );
}

function DaysInput({ label, value, onChange }: { label: string; value: number; onChange: (days: number) => void }) {
  return (
    <label className="flex flex-wrap items-center gap-2">
      <span>{label}</span>
      <input
        type="number"
        min={1}
        max={90}
        value={value}
        onChange={(event) => {
          const days = Number(event.target.value);
          if (days >= 1 && days <= 90) onChange(days);
        }}
        className="w-20 rounded-card border border-line bg-background px-3 py-2"
      />
      <span>days</span>
    </label>
  );
}

function NotificationPermission() {
  const [permission, setPermission] = useState<Permission>("default");

  useEffect(() => {
    setPermission("Notification" in window ? Notification.permission : "unsupported");
  }, []);

  if (permission === "unsupported") return <p className="text-sm text-muted">This browser can&apos;t show notifications. Reminders still appear on the home screen.</p>;
  if (permission === "granted") return <p className="text-sm text-muted">Notifications are on for this device while the app is open.</p>;
  if (permission === "denied") {
    return <p className="text-sm text-muted">Notifications are blocked in your browser settings. Reminders still appear on the home screen.</p>;
  }
  return (
    <button
      type="button"
      onClick={async () => setPermission(await Notification.requestPermission())}
      className="self-start rounded-card border border-line px-4 py-2 hover:bg-surface"
    >
      Allow notifications on this device
    </button>
  );
}
