// Production build step (build:live): apply committed migrations before the new code goes live, so the
// schema and code can't drift. Only production deploys migrate; previews could otherwise
// apply an unmerged branch's migrations to the shared database.
import { execFileSync } from "node:child_process";

if (process.env.APP_ENV !== "production" && process.env.VERCEL_ENV !== "production") {
  console.log("Skipping migrations (not a production deploy).");
  process.exit(0);
}

execFileSync("npx", ["prisma", "migrate", "deploy"], { stdio: "inherit" });
