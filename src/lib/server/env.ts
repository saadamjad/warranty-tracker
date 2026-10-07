import { z } from "zod";

const schema = z.object({
  DATABASE_URL: z.string().min(1),
  AUTH_SECRET: z.string().min(1),
  AUTH_GOOGLE_ID: z.string().optional(),
  AUTH_GOOGLE_SECRET: z.string().optional(),
  S3_ENDPOINT: z.url(),
  S3_REGION: z.string().default("auto"),
  S3_BUCKET: z.string().min(1),
  S3_ACCESS_KEY_ID: z.string().min(1),
  S3_SECRET_ACCESS_KEY: z.string().min(1),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASSWORD: z.string().optional(),
  EMAIL_FROM: z.string().default("Purchase Vault <no-reply@example.com>"),
  CRON_SECRET: z.string().optional(),
  /** Public address used in email links. */
  APP_URL: z.url().default("http://localhost:3000"),
  /** "production" on the public site (set by hand on other hosts; Vercel sets VERCEL_ENV). */
  APP_ENV: z.string().optional(),
  VERCEL_ENV: z.string().optional(),
});

// Dev defaults (localhost links, sign-in links printed to logs, no cron secret)
// would be unsafe on the public site, so the live deployment refuses to start with them.
const liveSchema = schema.superRefine((env, ctx) => {
  if (env.APP_ENV !== "production" && env.VERCEL_ENV !== "production") return;
  const fail = (path: string, message: string) => ctx.addIssue({ code: "custom", path: [path], message });
  if (!env.APP_URL.startsWith("https://")) fail("APP_URL", "must be the public https address");
  if (env.AUTH_SECRET.length < 32) fail("AUTH_SECRET", "must be at least 32 characters");
  if (!env.CRON_SECRET || env.CRON_SECRET.length < 32) fail("CRON_SECRET", "must be at least 32 characters");
  for (const key of ["SMTP_HOST", "SMTP_USER", "SMTP_PASSWORD"] as const) {
    if (!env[key]) fail(key, "is required so sign-in links are emailed, not logged");
  }
  if (/@example\.com>?$/.test(env.EMAIL_FROM)) fail("EMAIL_FROM", "must be a real sending address");
});

export type ServerEnv = z.infer<typeof liveSchema>;

let cached: ServerEnv | undefined;

// Parsed lazily so `next build` and tests don't require server secrets.
export function serverEnv(): ServerEnv {
  if (!cached) {
    const result = liveSchema.safeParse(process.env);
    if (!result.success) {
      const missing = result.error.issues.map((issue) => issue.path.join(".")).join(", ");
      throw new Error(`Invalid server environment: ${missing}. See .env.example.`);
    }
    cached = result.data;
  }
  return cached;
}
