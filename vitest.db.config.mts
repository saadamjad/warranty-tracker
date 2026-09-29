import { fileURLToPath } from "node:url";
import { loadEnv } from "vite";
import { defineConfig } from "vitest/config";

// Server tests against a real Postgres (npm run test:db). Needs TEST_DATABASE_URL pointing at
// a migrated, disposable database — tests delete its rows.
// Reads .env.local locally; CI sets TEST_DATABASE_URL directly.
const { TEST_DATABASE_URL = "" } = { ...loadEnv("test", process.cwd(), ""), ...process.env };

export default defineConfig({
  resolve: {
    alias: { "@": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  test: {
    environment: "node",
    include: ["src/**/*.db.test.ts"],
    fileParallelism: false,
    env: { DATABASE_URL: TEST_DATABASE_URL },
  },
});
