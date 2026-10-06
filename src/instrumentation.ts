import { serverEnv } from "@/lib/server/env";

// Runs once when the server boots: a misconfigured live deployment fails here,
// visibly, instead of on a visitor's first sign-in.
export function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") serverEnv();
}
