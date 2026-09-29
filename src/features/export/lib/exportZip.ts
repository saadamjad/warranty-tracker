import { displayTitle } from "@/features/purchases/lib/display";
import { db } from "@/lib/db";
import type { DocumentPage, Purchase, VaultDocument, Warranty } from "@/lib/db/types";
import { toCsv } from "./csv";

// Everything the user saved, in open formats, built on the device so it works offline
// and without an account (D-11, BR-07, AC-19).

const EXTENSIONS: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "application/pdf": "pdf" };

const CSV_HEADER = [
  "Name", "Product", "Store", "Purchase date", "Amount", "Currency", "Model", "Serial number",
  "Invoice or order number", "Last day to return", "Warranty ends", "Notes", "Documents",
];

export async function buildExport(): Promise<Blob> {
  const JSZip = (await import("jszip")).default;
  const zip = new JSZip();
  const [purchases, documents, warranties] = await Promise.all([
    db.purchases.filter((purchase) => !purchase.deletedAt).toArray(),
    db.documents.filter((document) => !document.deletedAt).toArray(),
    db.warranties.filter((warranty) => !warranty.deletedAt).toArray(),
  ]);

  const entries = [];
  for (const purchase of purchases) {
    const folder = `documents/${folderName(purchase)}`;
    const files: Record<string, string[]> = {};
    for (const document of documents.filter((d) => d.purchaseId === purchase.id)) {
      const pages = await db.pages.where("documentId").equals(document.id).sortBy("index");
      files[document.id] = pages.map((page) => {
        const path = `${folder}/${fileName(document, page)}`;
        zip.file(path, page.original); // originals, never the edited copy (rule 5)
        return path;
      });
    }
    entries.push(exportEntry(purchase, documents, warranties, files));
  }

  zip.file("purchases.json", JSON.stringify({ exportedAt: new Date().toISOString(), purchases: entries }, null, 2));
  zip.file("purchases.csv", toCsv(CSV_HEADER, entries.map(csvRow)));
  zip.file("README.txt", README);
  return zip.generateAsync({ type: "blob" });
}

type Entry = ReturnType<typeof exportEntry>;

function exportEntry(purchase: Purchase, documents: VaultDocument[], warranties: Warranty[], files: Record<string, string[]>) {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars -- bookkeeping, not the user's data
  const { fieldMeta, remindersOff, ...fields } = purchase;
  return {
    ...fields,
    name: displayTitle(purchase),
    warranties: warranties
      .filter((w) => w.purchaseId === purchase.id)
      .map(({ provider, startDate, endDate, notes }) => ({ provider, startDate, endDate, notes })),
    documents: documents
      .filter((d) => d.purchaseId === purchase.id)
      .map((d) => ({ type: d.type, pageCount: d.pageCount, files: files[d.id] ?? [], text: d.ocrText })),
  };
}

function csvRow(entry: Entry): (string | undefined)[] {
  return [
    entry.name, entry.productName, entry.merchant, entry.purchaseDate, entry.amount, entry.currency, entry.model,
    entry.serial, entry.reference, entry.returnDeadline,
    entry.warranties.map((w) => w.endDate).filter(Boolean).join("; ") || undefined,
    entry.notes, String(entry.documents.reduce((sum, d) => sum + d.files.length, 0)),
  ];
}

/** Readable, file-system-safe and unique: "2026-03-14 Samsung TV (ab12cd)". */
function folderName(purchase: Purchase): string {
  const name = displayTitle(purchase).replace(/[\\/:*?"<>|\x00-\x1f]/g, " ").replace(/\s+/g, " ").trim().slice(0, 60);
  return [purchase.purchaseDate, name, `(${purchase.id.slice(0, 6)})`].filter(Boolean).join(" ");
}

function fileName(document: VaultDocument, page: DocumentPage): string {
  return `${document.type}-${document.id.slice(0, 6)}-page-${page.index + 1}.${EXTENSIONS[page.mimeType] ?? "bin"}`;
}

const README = `Your Purchase Vault export

purchases.csv   One row per purchase; opens in any spreadsheet.
purchases.json  Everything, including warranties and the text read from documents.
documents/      The original photos and files you saved, one folder per purchase.
`;
