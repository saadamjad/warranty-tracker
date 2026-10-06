import { hitRateLimit } from "./repo";

type Policy = { max: number; windowMs: number };

const MINUTE = 60_000;

// Generous for real use (a person signs in rarely; a busy device backs up a few times a
// minute) but low enough that the form can't be used to spam inboxes or exhaust the DB.
export const LIMITS = {
  /** Sign-in emails to one address — so nobody can flood someone else's inbox. */
  signInEmail: { max: 3, windowMs: 10 * MINUTE },
  /** Sign-in requests from one network — so one sender can't cycle through many addresses. */
  signInIp: { max: 10, windowMs: 60 * MINUTE },
  /** Backup and file-link calls per signed-in person. */
  api: { max: 300, windowMs: MINUTE },
} satisfies Record<string, Policy>;

/** True when this hit is over the limit. */
export async function isRateLimited(name: keyof typeof LIMITS, subject: string): Promise<boolean> {
  const { max, windowMs } = LIMITS[name];
  return (await hitRateLimit(`${name}:${subject}`, windowMs)) > max;
}

/**
 * The caller's IP as reported by the hosting proxy (Vercel always sets x-forwarded-for).
 * Null without a proxy (local runs); lumping every caller into one bucket would lock everyone out.
 */
export function clientIp(request: Request): string | null {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null;
}
