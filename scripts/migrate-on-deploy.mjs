// Production build step (Vercel: vercel-build; other hosts: build:live): apply committed migrations before the new code goes live, so the
// schema and code can't drift. Only production deploys migrate; previews could otherwise
// apply an unmerged branch's migrations to the shared database. Neon's pooled URL can't
// run migrations, so DIRECT_URL (the unpooled string) is used when set.
import { execFileSync } from "node:child_process";

if (process.env.APP_ENV !== "production" && process.env.VERCEL_ENV !== "production") {
  console.log("Skipping migrations (not a production deploy).");
  process.exit(0);
}

const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
execFileSync("npx", ["prisma", "migrate", "deploy"], {
  stdio: "inherit",
  env: { ...process.env, DATABASE_URL: url },
});
