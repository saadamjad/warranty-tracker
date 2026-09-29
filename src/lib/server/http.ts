import { NextResponse } from "next/server";
import type { z } from "zod";
import { auth } from "./auth";

// Route helpers: every API route needs the session user and validated input (CLAUDE.md).
// Messages stay generic so nothing internal leaks (CODING_STANDARDS §10).

export function jsonError(status: number, message: string) {
  return NextResponse.json({ error: message }, { status });
}

/** The signed-in user's id, or null. */
export async function sessionUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

export async function parseJson<T extends z.ZodType>(request: Request, schema: T): Promise<z.infer<T> | null> {
  const body = await request.json().catch(() => undefined);
  const result = schema.safeParse(body);
  return result.success ? result.data : null;
}
