import { DeleteObjectsCommand, GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { serverEnv } from "./env";

export type PageVariant = "original" | "enhanced";

// Short-lived: long enough for a slow mobile upload, short enough to limit a leaked URL.
const URL_TTL_SECONDS = 15 * 60;

let client: S3Client | undefined;

function s3(): S3Client {
  if (!client) {
    const env = serverEnv();
    client = new S3Client({
      endpoint: env.S3_ENDPOINT,
      region: env.S3_REGION,
      credentials: {
        accessKeyId: env.S3_ACCESS_KEY_ID,
        secretAccessKey: env.S3_SECRET_ACCESS_KEY,
      },
      // Local S3Mock and R2 serve buckets by path, not subdomain.
      forcePathStyle: true,
    });
  }
  return client;
}

/** Keys start with the owner's id so every file access can be checked against the session user. */
export function pageKey(userId: string, documentId: string, page: number, variant: PageVariant): string {
  return `users/${userId}/documents/${documentId}/${variant}/${page}`;
}

export function isOwnedKey(userId: string, key: string): boolean {
  return key.startsWith(`users/${userId}/`) && !key.includes("..");
}

/** The size is signed into the link, so storage refuses any other file size (D-20 limits). */
export function uploadUrl(key: string, contentType: string, size: number): Promise<string> {
  const command = new PutObjectCommand({ Bucket: serverEnv().S3_BUCKET, Key: key, ContentType: contentType, ContentLength: size });
  return getSignedUrl(s3(), command, { expiresIn: URL_TTL_SECONDS });
}

export function downloadUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({ Bucket: serverEnv().S3_BUCKET, Key: key });
  return getSignedUrl(s3(), command, { expiresIn: URL_TTL_SECONDS });
}

/** Removes stored files for good (delete forever, 30-day purge). S3 takes up to 1000 keys per call. */
export async function deleteObjects(keys: string[]): Promise<void> {
  for (let start = 0; start < keys.length; start += 1000) {
    const batch = keys.slice(start, start + 1000).map((Key) => ({ Key }));
    await s3().send(new DeleteObjectsCommand({ Bucket: serverEnv().S3_BUCKET, Delete: { Objects: batch, Quiet: true } }));
  }
}
