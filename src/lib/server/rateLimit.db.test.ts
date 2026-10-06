import { randomUUID } from "node:crypto";
import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "./prisma";
import { clearRateLimitsBefore, hitRateLimit } from "./repo";

describe("hitRateLimit (Postgres)", () => {
  afterAll(() => prisma.$disconnect());

  it("counts every simultaneous hit exactly once", async () => {
    const key = `test:${randomUUID()}`;
    const counts = await Promise.all(Array.from({ length: 20 }, () => hitRateLimit(key, 60_000)));
    expect([...counts].sort((a, b) => a - b)).toEqual(Array.from({ length: 20 }, (_, i) => i + 1));
  });

  it("starts a new window once the old one has passed", async () => {
    const key = `test:${randomUUID()}`;
    await hitRateLimit(key, 60_000);
    await prisma.rateLimit.update({ where: { key }, data: { windowStart: new Date(Date.now() - 120_000) } });
    expect(await hitRateLimit(key, 60_000)).toBe(1);
  });

  it("clears finished counters", async () => {
    const key = `test:${randomUUID()}`;
    await hitRateLimit(key, 60_000);
    await prisma.rateLimit.update({ where: { key }, data: { windowStart: new Date("2020-01-01") } });
    await clearRateLimitsBefore(new Date("2021-01-01"));
    expect(await prisma.rateLimit.findUnique({ where: { key } })).toBeNull();
  });
});
