import { jsonError, sessionUserId } from "@/lib/server/http";
import { FileSizeError, isOwnedKey, readFile, verifyLink, writeFile, type FileLink } from "@/lib/server/storage";

// Target of the signed links from upload-url and download-url (D-38). The link fixes the file,
// size and type; the session must also own the file, so a leaked link alone opens nothing.

async function authorize(request: Request, method: FileLink["method"]) {
  const token = new URL(request.url).searchParams.get("token") ?? "";
  const link = verifyLink(token, method);
  if (!link) return { error: jsonError(403, "This link has expired. It will be renewed on the next try.") };
  const userId = await sessionUserId();
  if (!userId) return { error: jsonError(401, "Sign in to back up.") };
  if (!isOwnedKey(userId, link.key)) return { error: jsonError(403, "Not allowed.") };
  return { link };
}

export async function PUT(request: Request) {
  const { link, error } = await authorize(request, "PUT");
  if (error) return error;
  if (link.method !== "PUT") return jsonError(403, "Not allowed.");
  if (request.headers.get("content-type") !== link.contentType) return jsonError(400, "Invalid file type.");
  if (!request.body) return jsonError(400, "Invalid file.");
  try {
    await writeFile(link.key, request.body, link.size);
  } catch (failure) {
    if (failure instanceof FileSizeError) return jsonError(400, "Invalid file size.");
    throw failure;
  }
  return new Response(null, { status: 204 });
}

export async function GET(request: Request) {
  const { link, error } = await authorize(request, "GET");
  if (error) return error;
  const file = await readFile(link.key);
  if (!file) return jsonError(404, "File not found.");
  return new Response(file.body, {
    headers: {
      // Never rendered by the browser: the app reads the bytes and knows each page's real type.
      "Content-Type": "application/octet-stream",
      "Content-Length": String(file.size),
      "Cache-Control": "private, no-store",
    },
  });
}
