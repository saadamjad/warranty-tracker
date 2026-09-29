import { afterEach, describe, expect, it } from "vitest";
import { VaultDatabase } from "./index";

const testDb = new VaultDatabase("test-vault-schema");

describe("VaultDatabase", () => {
  afterEach(() => testDb.delete().then(() => testDb.open()));

  it("stores a purchase with no fields filled in (FR-12)", async () => {
    const now = new Date().toISOString();
    await testDb.purchases.add({ id: "p1", createdAt: now, updatedAt: now, fieldMeta: {} });
    expect(await testDb.purchases.get("p1")).toMatchObject({ id: "p1" });
  });

  it("keeps pages in order per document (EC-01)", async () => {
    const page = (index: number) => ({
      documentId: "d1",
      index,
      original: new Blob([String(index)]),
      mimeType: "image/jpeg",
    });
    await testDb.pages.bulkAdd([page(1), page(0), page(2)]);
    const pages = await testDb.pages.where("documentId").equals("d1").sortBy("index");
    expect(pages.map((p) => p.index)).toEqual([0, 1, 2]);
  });
});
