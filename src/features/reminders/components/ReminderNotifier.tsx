"use client";

import { useEffect } from "react";
import { showDueReminders } from "../lib/notify";

/**
 * When the app opens, shows due reminders as browser notifications — only if the user
 * allowed them in Settings; we never ask on load. Email reminders arrive with backup (phase 10).
 */
export function ReminderNotifier() {
  useEffect(() => {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    showDueReminders((text) => new Notification("Purchase Vault", { body: text, icon: "/favicon.ico" })).catch((error) =>
      console.warn("Could not check reminders", error),
    );
  }, []);

  return null;
}
