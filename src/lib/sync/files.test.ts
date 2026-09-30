import { describe, expect, it } from "vitest";
import { MAX_FILE_BYTES } from "@/features/documents/lib/limits";
import { uploadUrlBody } from "./files";

const request = (size: number) => ({ documentId: crypto.randomUUID(), files: [{ index: 0, variant: "original", size }] });

describe("uploadUrlBody (D-20)", () => {
  it("accepts files up to the size limit", () => {
    expect(uploadUrlBody.safeParse(request(MAX_FILE_BYTES)).success).toBe(true);
  });

  it("refuses a larger file, or one without a size", () => {
    expect(uploadUrlBody.safeParse(request(MAX_FILE_BYTES + 1)).success).toBe(false);
    expect(uploadUrlBody.safeParse({ documentId: crypto.randomUUID(), files: [{ index: 0, variant: "original" }] }).success).toBe(false);
  });
});
