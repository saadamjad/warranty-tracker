import { afterEach, describe, expect, it } from "vitest";
import { createPurchase } from "@/features/purchases/lib/purchases";
import { db } from "@/lib/db";
import { backupState } from "./pending";
import { setAccount, setSyncStatus, setWatermark } from "./state";

describe("backupState (FR-27, AC-13)", () => {
  afterEach(() => Promise.all(db.tables.map((table) => table.clear())));

  it("is 'saved on this device' without an account", async () => {
    await createPurchase();
    expect(await backupState()).toBe("device-only");
  });

  it("is pending until backed up, backing up while syncing, then backed up", async () => {
    await setAccount({ id: "u1", email: "a@x" });
    const purchase = await createPurchase();
    expect(await backupState()).toBe("pending");
    expect(await backupState(purchase.id)).toBe("pending");

    await setSyncStatus({ phase: "syncing" });
    expect(await backupState()).toBe("backing-up");

    await setWatermark(purchase.updatedAt);
    expect(await backupState()).toBe("backed-up");
    expect(await backupState(purchase.id)).toBe("backed-up");
  });

  it("counts a document whose files aren't uploaded yet", async () => {
    await setAccount({ id: "u1", email: "a@x" });
    const purchase = await createPurchase();
    const at = purchase.updatedAt;
    await db.documents.add({ id: "d1", purchaseId: purchase.id, type: "receipt", pageCount: 1, sha256: "x", sizeBytes: 1, createdAt: at, updatedAt: at });
    await setWatermark(at);
    expect(await backupState(purchase.id)).toBe("pending");
  });
});
