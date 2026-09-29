import { afterEach, describe, expect, it, vi } from "vitest";

const valid = {
  DATABASE_URL: "postgresql://vault:vault@localhost:5432/vault",
  AUTH_SECRET: "secret",
  S3_ENDPOINT: "http://localhost:9000",
  S3_BUCKET: "vault-documents",
  S3_ACCESS_KEY_ID: "key",
  S3_SECRET_ACCESS_KEY: "secret",
};

async function loadEnv(vars: Record<string, string>) {
  vi.resetModules();
  for (const [key, value] of Object.entries(vars)) vi.stubEnv(key, value);
  return (await import("./env")).serverEnv;
}

describe("serverEnv", () => {
  afterEach(() => vi.unstubAllEnvs());

  it("parses a valid environment with defaults", async () => {
    const serverEnv = await loadEnv(valid);
    expect(serverEnv()).toMatchObject({ S3_REGION: "auto", SMTP_PORT: 587 });
  });

  it("names missing variables without echoing values", async () => {
    const serverEnv = await loadEnv({ ...valid, AUTH_SECRET: "", S3_ENDPOINT: "not-a-url" });
    expect(serverEnv).toThrow(/AUTH_SECRET, S3_ENDPOINT/);
  });
});
