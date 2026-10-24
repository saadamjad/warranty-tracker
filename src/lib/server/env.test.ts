import { afterEach, describe, expect, it, vi } from "vitest";

const valid = {
  DATABASE_URL: "mysql://vault:vault@localhost:3307/vault",
  AUTH_SECRET: "secret",
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
    expect(serverEnv()).toMatchObject({ STORAGE_DIR: ".storage", SMTP_PORT: 587 });
  });

  it("names missing variables without echoing values", async () => {
    const serverEnv = await loadEnv({ ...valid, AUTH_SECRET: "", APP_URL: "not-a-url" });
    expect(serverEnv).toThrow(/AUTH_SECRET, APP_URL/);
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
      STORAGE_DIR: "/home/vault/files",
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
        STORAGE_DIR: "files",
      });
      expect(serverEnv).toThrow(/APP_URL.*AUTH_SECRET.*CRON_SECRET.*SMTP_HOST.*STORAGE_DIR.*EMAIL_FROM/);
    });

    it("applies the same checks on other hosts via APP_ENV", async () => {
      const serverEnv = await loadEnv({ ...live, VERCEL_ENV: "", APP_ENV: "production", APP_URL: "http://localhost:3000" });
      expect(serverEnv).toThrow(/APP_URL/);
    });

    it("leaves preview and local deployments on dev defaults", async () => {
      const serverEnv = await loadEnv({ ...valid, VERCEL_ENV: "preview" });
      expect(serverEnv().APP_URL).toBe("http://localhost:3000");
    });
  });
});
