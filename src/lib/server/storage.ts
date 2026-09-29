import { GetObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
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
      // MinIO and R2 serve buckets by path, not subdomain.
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

export function uploadUrl(key: string, contentType: string): Promise<string> {
  const command = new PutObjectCommand({ Bucket: serverEnv().S3_BUCKET, Key: key, ContentType: contentType });
  return getSignedUrl(s3(), command, { expiresIn: URL_TTL_SECONDS });
}

export function downloadUrl(key: string): Promise<string> {
  const command = new GetObjectCommand({ Bucket: serverEnv().S3_BUCKET, Key: key });
  return getSignedUrl(s3(), command, { expiresIn: URL_TTL_SECONDS });
}
