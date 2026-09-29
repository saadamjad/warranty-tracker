import { timingSafeEqual } from "node:crypto";
import { serverEnv } from "./env";

/** Vercel Cron sends `Authorization: Bearer <CRON_SECRET>`; anything else is refused. */
export function isCronRequest(request: Request): boolean {
  const secret = serverEnv().CRON_SECRET;
  if (!secret) return false;
  const expected = Buffer.from(`Bearer ${secret}`);
  const given = Buffer.from(request.headers.get("authorization") ?? "");
  return given.length === expected.length && timingSafeEqual(given, expected);
}
