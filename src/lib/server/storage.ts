import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, open, rename, rm, stat } from "node:fs/promises";
import path from "node:path";
import { Readable } from "node:stream";
import { serverEnv } from "./env";

// Document files live on the server's own disk under STORAGE_DIR (D-38). Devices still never
// send file bytes through sync requests: they get short-lived signed links to /api/files/blob.

export type PageVariant = "original" | "enhanced";

// Short-lived: long enough for a slow mobile upload, short enough to limit a leaked link.
const LINK_TTL_MS = 15 * 60 * 1000;
const BLOB_ROUTE = "/api/files/blob";

/** Keys start with the owner's id so every file access can be checked against the session user. */
export function pageKey(userId: string, documentId: string, page: number, variant: PageVariant): string {
  return `users/${userId}/documents/${documentId}/${variant}/${page}`;
}

export function isOwnedKey(userId: string, key: string): boolean {
  return key.startsWith(`users/${userId}/`) && !key.includes("..");
}

export type FileLink =
  | { method: "PUT"; key: string; contentType: string; size: number; expires: number }
  | { method: "GET"; key: string; expires: number };

function signature(payload: string): Buffer {
  // Prefixed so a file-link signature can never be mistaken for any other use of AUTH_SECRET.
  return createHmac("sha256", serverEnv().AUTH_SECRET).update(`file-link:${payload}`).digest();
}

function signLink(link: FileLink): string {
  const payload = Buffer.from(JSON.stringify(link)).toString("base64url");
  return `${BLOB_ROUTE}?token=${payload}.${signature(payload).toString("base64url")}`;
}

/** The link's details if it was signed here, isn't expired and is for this method; else null. */
export function verifyLink(token: string, method: FileLink["method"], now = Date.now()): FileLink | null {
  const [payload, signed] = token.split(".");
  if (!payload || !signed) return null;
  const expected = signature(payload);
  const actual = Buffer.from(signed, "base64url");
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  try {
    const link = JSON.parse(Buffer.from(payload, "base64url").toString()) as FileLink;
    return link.method === method && link.expires > now ? link : null;
  } catch {
    return null;
  }
}

/** The size and type are signed into the link, so the upload route refuses any other file (D-20). */
export async function uploadUrl(key: string, contentType: string, size: number): Promise<string> {
  return signLink({ method: "PUT", key, contentType, size, expires: Date.now() + LINK_TTL_MS });
}

export async function downloadUrl(key: string): Promise<string> {
  return signLink({ method: "GET", key, expires: Date.now() + LINK_TTL_MS });
}

/** Absolute path for a key, refusing anything that would land outside STORAGE_DIR. */
function filePath(key: string): string {
  const root = path.resolve(serverEnv().STORAGE_DIR);
  const target = path.resolve(root, key);
  if (!target.startsWith(root + path.sep)) throw new Error("Storage key escapes the storage folder");
  return target;
}

export class FileSizeError extends Error {}

/**
 * Saves exactly `size` bytes under `key`. Written to a temporary file first and renamed,
 * so an interrupted upload never leaves a half-written page behind.
 */
export async function writeFile(key: string, body: ReadableStream<Uint8Array>, size: number): Promise<void> {
  const target = filePath(key);
  await mkdir(path.dirname(target), { recursive: true });
  const temporary = `${target}.${randomUUID()}.part`;
  const handle = await open(temporary, "w");
  let written = 0;
  try {
    for await (const chunk of Readable.fromWeb(body as import("node:stream/web").ReadableStream<Uint8Array>)) {
      written += chunk.length;
      if (written > size) throw new FileSizeError("Upload is larger than announced");
      await handle.write(chunk);
    }
    if (written !== size) throw new FileSizeError("Upload is smaller than announced");
    await handle.close();
    await rename(temporary, target);
  } catch (error) {
    await handle.close().catch(() => undefined);
    await rm(temporary, { force: true });
    throw error;
  }
}

/** A stored file as a web stream with its size, or null if it isn't there. */
export async function readFile(key: string): Promise<{ body: ReadableStream<Uint8Array>; size: number } | null> {
  const source = filePath(key);
  const info = await stat(source).catch(() => null);
  if (!info?.isFile()) return null;
  return { body: Readable.toWeb(createReadStream(source)) as ReadableStream<Uint8Array>, size: info.size };
}

/** Removes stored files for good (delete forever, 30-day purge). Missing files are fine. */
export async function deleteObjects(keys: string[]): Promise<void> {
  for (const key of keys) await rm(filePath(key), { force: true });
}
