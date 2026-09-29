import { NextResponse } from "next/server";
import { jsonError, parseJson, sessionUserId } from "@/lib/server/http";
import { documentKeys } from "@/lib/server/repo";
import { downloadUrl } from "@/lib/server/storage";
import { downloadUrlBody, type FileUrl } from "@/lib/sync/files";

/** Presigned GET URLs for every page of one of the user's documents (restore, FR-29). */
export async function POST(request: Request) {
  const userId = await sessionUserId();
  if (!userId) return jsonError(401, "Sign in to restore.");
  const body = await parseJson(request, downloadUrlBody);
  if (!body) return jsonError(400, "Invalid request.");

  const keys = await documentKeys(userId, body.documentId);
  if (!keys) return jsonError(404, "Document not found.");

  const urls: FileUrl[] = [];
  for (const [index, key] of keys.originalKeys.entries()) {
    urls.push({ index, variant: "original", url: await downloadUrl(key) });
    if (keys.enhancedKeys[index]) urls.push({ index, variant: "enhanced", url: await downloadUrl(keys.enhancedKeys[index]) });
  }
  return NextResponse.json({ urls });
}
