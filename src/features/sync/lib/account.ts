import { fetchAccount } from "@/features/account/lib/authClient";
import { getAccount, getSyncStatus, setAccount, setCursor, setSyncStatus, setWatermark, switchAccount } from "./state";

/**
 * Checks the sign-in with the server. An expired session keeps the account on this device
 * (so status can say "not backed up yet") and asks to sign in again. Offline: no change.
 */
export async function refreshAccount(): Promise<void> {
  let server;
  try {
    server = await fetchAccount();
  } catch {
    return;
  }
  if (server) return switchAccount(server);
  if (await getAccount()) {
    const { lastSyncedAt } = await getSyncStatus();
    await setSyncStatus({ phase: "signed-out", lastSyncedAt });
  }
}

/** Signs out of backup. Purchases stay on this device (rule 7). */
export async function signOut(): Promise<void> {
  const { csrfToken } = (await (await fetch("/api/auth/csrf")).json()) as { csrfToken: string };
  const response = await fetch("/api/auth/signout", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ csrfToken }),
  });
  if (!response.ok) throw new Error(`Sign out failed: ${response.status}`);
  await setAccount(null);
  await setSyncStatus({ phase: "idle" });
}

/** Deletes the account and its backup. Purchases on this device stay (BR-07). */
export async function deleteAccountAndBackup(): Promise<void> {
  const response = await fetch("/api/account", { method: "DELETE" });
  if (!response.ok) throw new Error(`Account deletion failed: ${response.status}`);
  await Promise.all([setAccount(null), setWatermark(""), setCursor("0"), setSyncStatus({ phase: "idle" })]);
}
