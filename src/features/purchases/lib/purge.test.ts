import { afterEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { purgeExpiredLocally } from "./purge";

const today = new Date("2026-09-30T12:00:00.000Z");
const at = "2026-01-01T00:00:00.000Z";

describe("purgeExpiredLocally (D-29)", () => {
  afterEach(() => Promise.all(db.tables.map((table) => table.clear())));

  it("removes only what was deleted more than 30 days ago", async () => {
    await db.purchases.bulkAdd([
      { id: "old", createdAt: at, updatedAt: at, fieldMeta: {}, deletedAt: "2026-08-01T00:00:00.000Z" },
      { id: "recent", createdAt: at, updatedAt: at, fieldMeta: {}, deletedAt: "2026-09-20T00:00:00.000Z" },
      { id: "live", createdAt: at, updatedAt: at, fieldMeta: {} },
    ]);
    const doc = { purchaseId: "live", type: "receipt" as const, pageCount: 1, sha256: "x", sizeBytes: 1, createdAt: at, updatedAt: at };
    await db.documents.bulkAdd([{ ...doc, id: "d-old", deletedAt: "2026-08-01T00:00:00.000Z" }, { ...doc, id: "d-live" }]);
    await db.pages.add({ documentId: "d-old", index: 0, original: new Blob(["x"]), mimeType: "image/jpeg" });
    await db.warranties.add({ id: "w-old", purchaseId: "live", createdAt: at, updatedAt: at, deletedAt: "2026-08-01T00:00:00.000Z" });

    expect(await purgeExpiredLocally(today)).toBe(1);
    expect((await db.purchases.toCollection().primaryKeys()).sort()).toEqual(["live", "recent"]);
    expect(await db.documents.toCollection().primaryKeys()).toEqual(["d-live"]);
    expect([await db.pages.count(), await db.warranties.count()]).toEqual([0, 0]);
  });
});
