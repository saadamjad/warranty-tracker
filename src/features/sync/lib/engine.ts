import type { PullResponse } from "@/lib/sync/schema";
import { applyPull } from "./apply";
import { collectChanges } from "./collect";
import { downloadMissingPages, uploadPendingFiles } from "./files";
import { SyncHttpError, getJson, postJson } from "./http";
import { clearPendingPurges, getAccount, getCursor, getPendingPurges, getSyncStatus, getWatermark, setCursor, setSyncStatus, setWatermark } from "./state";

export type SyncOutcome = "done" | "no-account" | "offline" | "signed-out" | "error";

let running: Promise<SyncOutcome> | undefined;

/**
 * Backs up local changes, then brings in changes from other devices. One run at a time;
 * callers share the run in progress. Offline is a normal outcome, not an error (rule 7).
 */
export function syncNow(): Promise<SyncOutcome> {
  running ??= run().finally(() => {
    running = undefined;
  });
  return running;
}

async function run(): Promise<SyncOutcome> {
  if (!(await getAccount())) return "no-account";
  if (typeof navigator !== "undefined" && !navigator.onLine) return "offline";

  const { lastSyncedAt } = await getSyncStatus();
  await setSyncStatus({ phase: "syncing", lastSyncedAt });
  try {
    await pushAll();
    await uploadPendingFiles();
    await pullAll();
    await downloadMissingPages();
    await setSyncStatus({ phase: "idle", lastSyncedAt: new Date().toISOString() });
    return "done";
  } catch (error) {
    if (error instanceof SyncHttpError && error.status === 401) {
      await setSyncStatus({ phase: "signed-out", lastSyncedAt });
      return "signed-out";
    }
    if (error instanceof TypeError) {
      // fetch failed: connection dropped mid-run. Everything is still safe on this device.
      await setSyncStatus({ phase: "idle", lastSyncedAt });
      return "offline";
    }
    console.warn("Backup run failed", error);
    await setSyncStatus({ phase: "error", lastSyncedAt });
    return "error";
  }
}

async function pushAll(): Promise<void> {
  let purged = await getPendingPurges();
  for (;;) {
    const batch = await collectChanges(await getWatermark());
    if (!batch && purged.length === 0) return;
    await postJson("/api/sync/push", {
      purchases: batch?.purchases ?? [],
      documents: batch?.documents ?? [],
      warranties: batch?.warranties ?? [],
      purged,
    });
    if (purged.length) await clearPendingPurges(purged);
    purged = [];
    if (!batch) return;
    await setWatermark(batch.upTo);
  }
}

async function pullAll(): Promise<void> {
  for (;;) {
    const response = await getJson<PullResponse>(`/api/sync/pull?cursor=${await getCursor()}`);
    await applyPull(response);
    await setCursor(response.cursor);
    if (!response.hasMore) return;
  }
}
