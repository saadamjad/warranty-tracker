import type { Vault } from "@prisma/client";
import { prisma } from "./prisma";

// Every server query lives here and takes the session userId as its first argument,
// so no route can read or write another user's data (SPEC §7, CLAUDE.md).

/** Each user has one personal vault for now (ARCHITECTURE: future-proof for family sharing). */
export async function getOrCreateVault(userId: string): Promise<Vault> {
  const existing = await prisma.vault.findFirst({ where: { ownerId: userId } });
  return existing ?? prisma.vault.create({ data: { ownerId: userId } });
}
