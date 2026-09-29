"use client";

import { liveQuery } from "dexie";
import { useEffect } from "react";
import { refreshAccount } from "../lib/account";
import { syncNow } from "../lib/engine";
import { backupState } from "../lib/pending";

/** Soon after a local change; gathers quick successive edits into one run. */
const AFTER_CHANGE_MS = 4_000;
const EVERY_MS = 5 * 60_000;

/** Keeps backup running in the background whenever there's an account (FR-26, AC-12). */
export function SyncRunner() {
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const run = () => void syncNow();
    const soon = () => {
      clearTimeout(timer);
      timer = setTimeout(run, AFTER_CHANGE_MS);
    };
    const onVisible = () => document.visibilityState === "visible" && run();

    refreshAccount().then(run);
    window.addEventListener("online", run);
    document.addEventListener("visibilitychange", onVisible);
    const interval = setInterval(run, EVERY_MS);
    const changes = liveQuery(() => backupState()).subscribe((state) => state === "pending" && soon());

    return () => {
      clearTimeout(timer);
      clearInterval(interval);
      window.removeEventListener("online", run);
      document.removeEventListener("visibilitychange", onVisible);
      changes.unsubscribe();
    };
  }, []);

  return null;
}
