import { z } from "zod";
import { MAX_FILE_BYTES } from "@/features/documents/lib/limits";

// Requests for presigned file URLs. Keys are never sent by the device; the server looks
// them up for the session user's own document.

export const uploadUrlBody = z.object({
  documentId: z.uuid(),
  files: z
    .array(
      z.object({
        index: z.number().int().min(0).max(19),
        variant: z.enum(["original", "enhanced"]),
        /** Exact byte size; the upload link only accepts a file of this size (D-20). */
        size: z.number().int().min(0).max(MAX_FILE_BYTES),
      }),
    )
    .min(1)
    .max(40),
});

export const downloadUrlBody = z.object({ documentId: z.uuid() });

export type FileUrl = { index: number; variant: "original" | "enhanced"; url: string };
export type UploadUrlBody = z.infer<typeof uploadUrlBody>;
