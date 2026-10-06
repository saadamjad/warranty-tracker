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

  describe("on the live deployment", () => {
    const live = {
      ...valid,
      VERCEL_ENV: "production",
      AUTH_SECRET: "a".repeat(32),
      CRON_SECRET: "c".repeat(32),
      APP_URL: "https://vault.example.org",
      SMTP_HOST: "smtp.example.org",
      SMTP_USER: "user",
      SMTP_PASSWORD: "password",
      EMAIL_FROM: "Purchase Vault <hello@vault.example.org>",
    };

    it("accepts a complete configuration", async () => {
      const serverEnv = await loadEnv(live);
      expect(serverEnv().APP_URL).toBe("https://vault.example.org");
    });

    it("refuses dev defaults that would be unsafe in public", async () => {
      const serverEnv = await loadEnv({
        ...live,
        APP_URL: "http://localhost:3000",
        SMTP_HOST: "",
        CRON_SECRET: "short",
        AUTH_SECRET: "short",
        EMAIL_FROM: "Purchase Vault <no-reply@example.com>",
      });
      expect(serverEnv).toThrow(/APP_URL.*AUTH_SECRET.*CRON_SECRET.*SMTP_HOST.*EMAIL_FROM/);
    });

    it("leaves preview and local deployments on dev defaults", async () => {
      const serverEnv = await loadEnv({ ...valid, VERCEL_ENV: "preview" });
      expect(serverEnv().APP_URL).toBe("http://localhost:3000");
    });
  });
});
