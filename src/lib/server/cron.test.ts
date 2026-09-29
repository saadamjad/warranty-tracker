// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

async function check(secret: string | undefined, header?: string) {
  vi.resetModules();
  vi.stubEnv("DATABASE_URL", "postgresql://x");
  vi.stubEnv("AUTH_SECRET", "s");
  vi.stubEnv("S3_ENDPOINT", "http://s3");
  vi.stubEnv("S3_BUCKET", "b");
  vi.stubEnv("S3_ACCESS_KEY_ID", "k");
  vi.stubEnv("S3_SECRET_ACCESS_KEY", "k");
  vi.stubEnv("CRON_SECRET", secret ?? "");
  const { isCronRequest } = await import("./cron");
  return isCronRequest(new Request("http://x", { headers: header ? { authorization: header } : {} }));
}

describe("isCronRequest", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("accepts only the exact bearer secret", async () => {
    expect(await check("s3cret", "Bearer s3cret")).toBe(true);
    expect(await check("s3cret", "Bearer wrong!")).toBe(false);
    expect(await check("s3cret")).toBe(false);
  });

  it("refuses everything when no secret is configured", async () => {
    expect(await check(undefined, "Bearer ")).toBe(false);
  });
});
