import type { Account } from "@/features/account/lib/authClient";
import { db } from "@/lib/db";
import { readMeta, writeMeta } from "@/lib/db/meta";

// What this device knows about its backup. Kept locally so status shows offline too.

export type SyncPhase = "idle" | "syncing" | "error" | "signed-out";
export type SyncStatus = { phase: SyncPhase; lastSyncedAt?: string };

const KEYS = {
  account: "account",
  watermark: "syncWatermark",
  cursor: "syncCursor",
  purges: "pendingPurges",
  status: "syncStatus",
} as const;

export const getAccount = () => readMeta<Account | null>(KEYS.account, null);
export const setAccount = (account: Account | null) => writeMeta(KEYS.account, account);

/** Highest updatedAt already sent; anything newer still needs backing up (D-35). */
export const getWatermark = () => readMeta(KEYS.watermark, "");
export const setWatermark = (value: string) => writeMeta(KEYS.watermark, value);

export const getCursor = () => readMeta(KEYS.cursor, "0");
export const setCursor = (value: string) => writeMeta(KEYS.cursor, value);

export const getSyncStatus = () => readMeta<SyncStatus>(KEYS.status, { phase: "idle" });
export const setSyncStatus = (status: SyncStatus) => writeMeta(KEYS.status, status);

export const getPendingPurges = () => readMeta<string[]>(KEYS.purges, []);

/** Remembers a delete-forever so backup removes it too (D-29). */
export async function addPendingPurge(purchaseId: string): Promise<void> {
  await db.transaction("rw", db.meta, async () => {
    const pending = await getPendingPurges();
    if (!pending.includes(purchaseId)) await writeMeta(KEYS.purges, [...pending, purchaseId]);
  });
}

export async function clearPendingPurges(done: string[]): Promise<void> {
  await db.transaction("rw", db.meta, async () => {
    await writeMeta(KEYS.purges, (await getPendingPurges()).filter((id) => !done.includes(id)));
  });
}

/** Signing in as someone else must never mix accounts: start the cursor and watermark over (D-18). */
export async function switchAccount(account: Account | null): Promise<void> {
  const current = await getAccount();
  if (current?.id !== account?.id) {
    await Promise.all([setWatermark(""), setCursor("0")]);
  }
  await setAccount(account);
}
