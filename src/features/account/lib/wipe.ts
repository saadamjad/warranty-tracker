import { signOut } from "@/features/sync/lib/account";
import { getAccount } from "@/features/sync/lib/state";
import { db } from "@/lib/db";

/**
 * Removes every purchase, document and setting from this device. Signs out first when
 * possible so backup doesn't bring everything straight back.
 */
export async function wipeDevice(): Promise<void> {
  if (await getAccount()) await signOut().catch((error) => console.warn("Sign out before wipe failed", error));
  await db.delete();
  await db.open();
}
