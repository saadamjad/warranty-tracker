import JSZip from "jszip";
import { afterEach, describe, expect, it } from "vitest";
import { addDocument } from "@/features/documents/lib/documents";
import { createPurchase, softDeletePurchase } from "@/features/purchases/lib/purchases";
import { addWarranty } from "@/features/warranty/lib/warranties";
import { db } from "@/lib/db";
import { buildExport } from "./exportZip";

describe("buildExport (D-11, AC-19)", () => {
  afterEach(() => Promise.all(db.tables.map((table) => table.clear())));

  it("zips originals, a CSV and a JSON of every live purchase", async () => {
    const tv = await createPurchase({ productName: "Samsung TV", merchant: "Hi-Fi", purchaseDate: "2026-03-14", amount: "1299.00" });
    await addDocument({ purchaseId: tv.id, type: "receipt", pages: [{ original: new Blob(["ORIGINAL"]), enhanced: new Blob(["EDITED"]), mimeType: "image/jpeg" }] });
    await addWarranty(tv.id, { endDate: "2027-03-14" });
    const gone = await createPurchase({ productName: "Old kettle" });
    await softDeletePurchase(gone.id);

    const zip = await JSZip.loadAsync(await (await buildExport()).arrayBuffer());
    const names = Object.keys(zip.files);

    const photo = names.find((name) => name.startsWith("documents/2026-03-14 Samsung TV") && name.endsWith("page-1.jpg"));
    expect(photo).toBeDefined();
    expect(await zip.file(photo!)!.async("string")).toBe("ORIGINAL");

    const json = JSON.parse(await zip.file("purchases.json")!.async("string"));
    expect(json.purchases).toHaveLength(1);
    expect(json.purchases[0]).toMatchObject({ productName: "Samsung TV", warranties: [{ endDate: "2027-03-14" }] });
    expect(json.purchases[0]).not.toHaveProperty("fieldMeta");

    const csv = await zip.file("purchases.csv")!.async("string");
    expect(csv.split("\r\n")[1]).toBe("Samsung TV,Samsung TV,Hi-Fi,2026-03-14,1299.00,,,,,,2027-03-14,,1");
  });
});
