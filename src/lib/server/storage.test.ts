// @vitest-environment node
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

let dir: string;
let storage: typeof import("./storage");

beforeAll(async () => {
  dir = await mkdtemp(path.join(tmpdir(), "vault-storage-"));
  vi.stubEnv("DATABASE_URL", "mysql://x");
  vi.stubEnv("AUTH_SECRET", "test-secret");
  vi.stubEnv("STORAGE_DIR", dir);
  storage = await import("./storage");
});

afterAll(async () => {
  vi.unstubAllEnvs();
  await rm(dir, { recursive: true, force: true });
});

const streamOf = (text: string) => new Blob([text]).stream();
const tokenOf = (url: string) => new URL(url, "http://app").searchParams.get("token") ?? "";

describe("storage keys", () => {
  it("scopes page keys to their owner", () => {
    const key = storage.pageKey("user-a", "doc-1", 0, "original");
    expect(key).toBe("users/user-a/documents/doc-1/original/0");
    expect(storage.isOwnedKey("user-a", key)).toBe(true);
  });

  it("rejects other users' keys and path traversal", () => {
    expect(storage.isOwnedKey("user-b", storage.pageKey("user-a", "doc-1", 0, "original"))).toBe(false);
    expect(storage.isOwnedKey("user-a", "users/user-a/../user-b/documents/x")).toBe(false);
    expect(storage.isOwnedKey("user-a", "users/user-ab/documents/x")).toBe(false);
  });
});

describe("signed file links", () => {
  it("round-trips an upload link with its size and type", async () => {
    const link = storage.verifyLink(tokenOf(await storage.uploadUrl("users/u/a", "image/png", 5)), "PUT");
    expect(link).toMatchObject({ method: "PUT", key: "users/u/a", contentType: "image/png", size: 5 });
  });

  it("refuses a tampered, expired or wrong-method link", async () => {
    const token = tokenOf(await storage.downloadUrl("users/u/a"));
    const [payload, signed] = token.split(".");
    const forged = Buffer.from(JSON.stringify({ method: "GET", key: "users/other/a", expires: Date.now() + 60_000 })).toString("base64url");
    expect(storage.verifyLink(`${forged}.${signed}`, "GET")).toBeNull();
    expect(storage.verifyLink(`${payload}.${signed}`, "PUT")).toBeNull();
    expect(storage.verifyLink(token, "GET", Date.now() + 16 * 60 * 1000)).toBeNull();
    expect(storage.verifyLink("garbage", "GET")).toBeNull();
  });
});

describe("files on disk", () => {
  it("writes, reads and deletes a file", async () => {
    await storage.writeFile("users/u/documents/d/original/0", streamOf("hello"), 5);
    const file = await storage.readFile("users/u/documents/d/original/0");
    expect(file?.size).toBe(5);
    expect(await new Response(file?.body).text()).toBe("hello");
    await storage.deleteObjects(["users/u/documents/d/original/0", "users/u/missing"]);
    expect(await storage.readFile("users/u/documents/d/original/0")).toBeNull();
  });

  it("refuses a file of another size and leaves nothing behind", async () => {
    await expect(storage.writeFile("users/v/big", streamOf("too long"), 3)).rejects.toBeInstanceOf(storage.FileSizeError);
    await expect(storage.writeFile("users/v/small", streamOf("ab"), 3)).rejects.toBeInstanceOf(storage.FileSizeError);
    expect(await readdir(path.join(dir, "users/v"))).toEqual([]);
  });

  it("never touches files outside the storage folder", async () => {
    await expect(storage.writeFile("../escape", streamOf("x"), 1)).rejects.toThrow(/escapes/);
  });
});
