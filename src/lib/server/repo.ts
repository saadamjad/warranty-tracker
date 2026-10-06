import type { Prisma, Vault } from "@prisma/client";
import { mergeLatest, mergePurchase } from "@/lib/sync/merge";
import type { ReminderPrefsWire } from "@/lib/sync/prefs";
import type { PullResponse, PushBody } from "@/lib/sync/schema";
import { prisma } from "./prisma";
import { deleteObjects } from "./storage";
import {
  documentFromRow,
  documentToRow,
  purchaseFromRow,
  purchaseToRow,
  warrantyFromRow,
  warrantyToRow,
} from "./syncMapping";

// Every server query lives here and takes the session userId as its first argument,
// so no route can read or write another user's data (SPEC §7, CLAUDE.md).

/** A record id that belongs to someone else, or a child of someone else's purchase. */
export class ForbiddenRecordError extends Error {}

type Tx = Prisma.TransactionClient;

/** Each user has one personal vault for now (ARCHITECTURE: future-proof for family sharing). */
export async function getOrCreateVault(userId: string): Promise<Vault> {
  const existing = await prisma.vault.findFirst({ where: { ownerId: userId } });
  return existing ?? prisma.vault.create({ data: { ownerId: userId } });
}

/**
 * Applies a device's changes with the shared merge rules (D-17) and records each in the
 * change feed. All or nothing: a rejected record rolls the whole push back.
 */
export async function pushChanges(userId: string, body: PushBody): Promise<void> {
  const vault = await getOrCreateVault(userId);
  const purgedKeys = await prisma.$transaction(
    async (tx) => {
      // A device that hasn't heard of a delete-forever yet may still send the purchase or its
      // children; they are skipped, and its next pull removes them there too (D-29).
      const gone = await purgedPurchaseIds(tx, userId, [
        ...body.purchases.map((incoming) => incoming.id),
        ...body.documents.map((incoming) => incoming.purchaseId),
        ...body.warranties.map((incoming) => incoming.purchaseId),
      ]);

      for (const incoming of body.purchases.filter((purchase) => !gone.has(purchase.id))) {
        const row = await tx.purchase.findUnique({ where: { id: incoming.id } });
        if (row && row.userId !== userId) throw new ForbiddenRecordError(`purchase ${incoming.id}`);
        const merged = mergePurchase(row ? purchaseFromRow(row) : undefined, incoming);
        const data = purchaseToRow(merged, userId, row?.vaultId ?? vault.id);
        await tx.purchase.upsert({ where: { id: incoming.id }, create: data, update: data });
        await recordChange(tx, userId, vault.id, "purchase", incoming.id, "UPSERT");
      }

      for (const incoming of body.documents.filter((document) => !gone.has(document.purchaseId))) {
        await assertOwnsPurchase(tx, userId, incoming.purchaseId);
        const row = await tx.document.findUnique({ where: { id: incoming.id } });
        if (row && row.userId !== userId) throw new ForbiddenRecordError(`document ${incoming.id}`);
        const current = row ? documentFromRow(row) : undefined;
        const merged = mergeLatest(current, incoming);
        // File content never changes once stored (documents are append-only, D-17).
        const content = current ? { sha256: current.sha256, files: current.files, pageCount: current.pageCount, sizeBytes: current.sizeBytes } : {};
        const data = documentToRow({ ...merged, ...content }, userId);
        await tx.document.upsert({ where: { id: incoming.id }, create: data, update: data });
        await recordChange(tx, userId, vault.id, "document", incoming.id, "UPSERT");
      }

      for (const incoming of body.warranties.filter((warranty) => !gone.has(warranty.purchaseId))) {
        await assertOwnsPurchase(tx, userId, incoming.purchaseId);
        const row = await tx.warranty.findUnique({ where: { id: incoming.id } });
        if (row && row.userId !== userId) throw new ForbiddenRecordError(`warranty ${incoming.id}`);
        const data = warrantyToRow(mergeLatest(row ? warrantyFromRow(row) : undefined, incoming), userId);
        await tx.warranty.upsert({ where: { id: incoming.id }, create: data, update: data });
        await recordChange(tx, userId, vault.id, "warranty", incoming.id, "UPSERT");
      }

      return purgePurchases(tx, userId, vault.id, body.purged);
    },
    // A full batch over a remote database can exceed Prisma's 5 s default.
    { timeout: 30_000 },
  );
  if (purgedKeys.length) await deleteObjects(purgedKeys);
}

/** Permanently removes purchases (with documents and warranties); returns their file keys. */
async function purgePurchases(tx: Tx, userId: string, vaultId: string, ids: string[]): Promise<string[]> {
  if (ids.length === 0) return [];
  const rows = await tx.purchase.findMany({ where: { id: { in: ids }, userId }, include: { documents: true } });
  await tx.purchase.deleteMany({ where: { id: { in: rows.map((row) => row.id) }, userId } });
  for (const row of rows) await recordChange(tx, userId, vaultId, "purchase", row.id, "DELETE");
  return rows.flatMap((row) => row.documents.flatMap((document) => [...document.originalKeys, ...document.enhancedKeys])).filter(Boolean);
}

/** Which of these purchases were deleted forever (by the user or the 30-day purge). */
async function purgedPurchaseIds(tx: Tx, userId: string, ids: string[]): Promise<Set<string>> {
  if (ids.length === 0) return new Set();
  const deletes = await tx.change.findMany({
    where: { userId, entity: "purchase", op: "DELETE", entityId: { in: [...new Set(ids)] } },
    select: { entityId: true },
  });
  return new Set(deletes.map((change) => change.entityId));
}

async function assertOwnsPurchase(tx: Tx, userId: string, purchaseId: string): Promise<void> {
  const owned = await tx.purchase.count({ where: { id: purchaseId, userId } });
  if (!owned) throw new ForbiddenRecordError(`purchase ${purchaseId}`);
}

function recordChange(tx: Tx, userId: string, vaultId: string, entity: string, entityId: string, op: "UPSERT" | "DELETE") {
  return tx.change.create({ data: { userId, vaultId, entity, entityId, op } });
}

/** Current state of everything that changed after `cursor`, oldest change first (ARCHITECTURE: sync). */
export async function pullChanges(userId: string, cursor: bigint, limit = 200): Promise<PullResponse> {
  const changes = await prisma.change.findMany({
    where: { userId, seq: { gt: cursor } },
    orderBy: { seq: "asc" },
    take: limit + 1,
  });
  const page = changes.slice(0, limit);
  const idsOf = (entity: string) => [...new Set(page.filter((change) => change.entity === entity).map((change) => change.entityId))];

  const [purchases, documents, warranties] = await Promise.all([
    prisma.purchase.findMany({ where: { userId, id: { in: idsOf("purchase") } } }),
    prisma.document.findMany({ where: { userId, id: { in: idsOf("document") } } }),
    prisma.warranty.findMany({ where: { userId, id: { in: idsOf("warranty") } } }),
  ]);
  const existing = new Set(purchases.map((purchase) => purchase.id));
  const purged = [
    ...new Set(page.filter((change) => change.op === "DELETE" && !existing.has(change.entityId)).map((change) => change.entityId)),
  ];

  return {
    purchases: purchases.map(purchaseFromRow),
    documents: documents.map(documentFromRow),
    warranties: warranties.map(warrantyFromRow),
    purged,
    cursor: String(page.at(-1)?.seq ?? cursor),
    hasMore: changes.length > limit,
  };
}

/** Storage keys of one of the user's documents, for presigned URLs; null if not theirs. */
export async function documentKeys(userId: string, documentId: string) {
  return prisma.document.findFirst({
    where: { id: documentId, userId },
    select: { originalKeys: true, enhancedKeys: true, mimeTypes: true },
  });
}

/**
 * Deletes the account and everything backed up for it: records, change feed, reminder log,
 * sign-in data and stored files (BR-07). Devices keep their own copy unless the user wipes it.
 */
export async function deleteAccount(userId: string): Promise<void> {
  const documents = await prisma.document.findMany({ where: { userId }, select: { originalKeys: true, enhancedKeys: true } });
  await prisma.$transaction([
    prisma.change.deleteMany({ where: { userId } }),
    prisma.reminderLog.deleteMany({ where: { userId } }),
    // Cascades to sessions, sign-in accounts, vaults, purchases, documents, warranties, reminder settings.
    prisma.user.delete({ where: { id: userId } }),
  ]);
  const keys = documents.flatMap((document) => [...document.originalKeys, ...document.enhancedKeys]).filter(Boolean);
  if (keys.length) await deleteObjects(keys);
}

/** Saves the user's reminder settings for reminder emails. */
export async function saveReminderPrefs(userId: string, prefs: ReminderPrefsWire): Promise<void> {
  const data = {
    warrantyDaysBefore: prefs.warrantyDaysBefore,
    finalDaysBefore: prefs.finalDaysBefore,
    returnDaysBefore: prefs.returnDaysBefore,
    emailEnabled: prefs.emailReminders,
  };
  await prisma.reminderPref.upsert({ where: { userId }, create: { userId, ...data }, update: data });
}

/**
 * Counts one hit for `key` in a fixed window and returns the hits so far, including this one.
 * A single upsert, so simultaneous requests can't all slip under the limit. All times come
 * from the database clock, so app servers with drifting clocks agree on the window.
 */
export async function hitRateLimit(key: string, windowMs: number): Promise<number> {
  const [row] = await prisma.$queryRaw<{ count: number }[]>`
    WITH bounds AS (SELECT now() - make_interval(secs => ${windowMs / 1000}) AS expired)
    INSERT INTO "RateLimit" ("key", "windowStart", "count") VALUES (${key}, now(), 1)
    ON CONFLICT ("key") DO UPDATE SET
      "count" = CASE WHEN "RateLimit"."windowStart" < (SELECT expired FROM bounds) THEN 1 ELSE "RateLimit"."count" + 1 END,
      "windowStart" = CASE WHEN "RateLimit"."windowStart" < (SELECT expired FROM bounds) THEN now() ELSE "RateLimit"."windowStart" END
    RETURNING "count"`;
  return row.count;
}

/** Drops counters whose window ended before `cutoff`; they would restart on their next hit anyway. */
export async function clearRateLimitsBefore(cutoff: Date): Promise<number> {
  const { count } = await prisma.rateLimit.deleteMany({ where: { windowStart: { lt: cutoff } } });
  return count;
}

// ---- Scheduled jobs (not user-scoped: they run for everyone, from the cron route only) ----

const PURGE_BATCH = 500;

/**
 * Permanently removes backup data deleted before `cutoff` (30 days, D-19): purchases with
 * their documents and warranties, plus documents and warranties deleted on their own.
 * Purchase removals go into each user's change feed so their devices drop them too.
 */
export async function purgeDeletedBefore(cutoff: Date): Promise<{ purchases: number; documents: number; warranties: number }> {
  const purchases = await prisma.purchase.findMany({
    where: { deletedAt: { lt: cutoff } },
    select: { id: true, userId: true, vaultId: true, documents: { select: { originalKeys: true, enhancedKeys: true } } },
    take: PURGE_BATCH,
  });
  const documents = await prisma.document.findMany({
    where: { deletedAt: { lt: cutoff }, purchase: { deletedAt: null } },
    select: { id: true, originalKeys: true, enhancedKeys: true },
    take: PURGE_BATCH,
  });

  const [, , , warranties] = await prisma.$transaction([
    prisma.purchase.deleteMany({ where: { id: { in: purchases.map((p) => p.id) } } }),
    prisma.change.createMany({
      data: purchases.map((p) => ({ userId: p.userId, vaultId: p.vaultId, entity: "purchase", entityId: p.id, op: "DELETE" as const })),
    }),
    prisma.document.deleteMany({ where: { id: { in: documents.map((d) => d.id) } } }),
    prisma.warranty.deleteMany({ where: { deletedAt: { lt: cutoff } } }),
  ]);

  const keys = [...purchases.flatMap((p) => p.documents), ...documents]
    .flatMap((document) => [...document.originalKeys, ...document.enhancedKeys])
    .filter(Boolean);
  if (keys.length) await deleteObjects(keys);
  return { purchases: purchases.length, documents: documents.length, warranties: warranties.count };
}
