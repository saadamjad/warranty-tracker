import { NextResponse } from "next/server";
import { jsonError, parseJson, sessionUserId } from "@/lib/server/http";
import { documentKeys } from "@/lib/server/repo";
import { uploadUrl } from "@/lib/server/storage";
import { uploadUrlBody, type FileUrl } from "@/lib/sync/files";

/** Presigned PUT URLs for a document the user already pushed (its metadata came first). */
export async function POST(request: Request) {
  const userId = await sessionUserId();
  if (!userId) return jsonError(401, "Sign in to back up.");
  const body = await parseJson(request, uploadUrlBody);
  if (!body) return jsonError(400, "Invalid request.");

  const keys = await documentKeys(userId, body.documentId);
  if (!keys) return jsonError(404, "Document not found.");

  const urls: FileUrl[] = [];
  for (const { index, variant, size } of body.files) {
    const key = variant === "original" ? keys.originalKeys[index] : keys.enhancedKeys[index];
    if (!key) return jsonError(400, "Invalid page.");
    // Enhanced copies are always JPEG (capture pipeline); originals keep their own type.
    const contentType = variant === "original" ? keys.mimeTypes[index] : "image/jpeg";
    urls.push({ index, variant, url: await uploadUrl(key, contentType, size) });
  }
  return NextResponse.json({ urls });
}
