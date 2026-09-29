import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createPurchase } from "@/features/purchases/lib/purchases";
import { db } from "@/lib/db";
import { syncNow } from "./engine";
import { getCursor, getSyncStatus, getWatermark, setAccount } from "./state";

const fetchMock = vi.fn();
const emptyPull = { purchases: [], documents: [], warranties: [], purged: [], cursor: "7", hasMore: false };

describe("syncNow", () => {
  beforeEach(() => vi.stubGlobal("fetch", fetchMock));
  afterEach(async () => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
    await Promise.all(db.tables.map((table) => table.clear()));
  });

  it("does nothing without an account (device-only is normal)", async () => {
    expect(await syncNow()).toBe("no-account");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("pushes local changes, pulls, and records progress (AC-12)", async () => {
    await setAccount({ id: "u1", email: "a@x" });
    const purchase = await createPurchase({ productName: "TV" });
    fetchMock.mockImplementation(async (url: string) => (url.includes("pull") ? Response.json(emptyPull) : Response.json({ ok: true })));

    expect(await syncNow()).toBe("done");

    const pushed = JSON.parse(fetchMock.mock.calls[0][1].body);
    expect(pushed.purchases.map((p: { id: string }) => p.id)).toEqual([purchase.id]);
    expect(await getWatermark()).toBe(purchase.updatedAt);
    expect(await getCursor()).toBe("7");
    expect((await getSyncStatus()).phase).toBe("idle");

    fetchMock.mockClear();
    await syncNow();
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual(["/api/sync/pull?cursor=7"]);
  });

  it("treats a dropped connection as offline, not an error", async () => {
    await setAccount({ id: "u1", email: "a@x" });
    await createPurchase();
    fetchMock.mockRejectedValue(new TypeError("Failed to fetch"));
    expect(await syncNow()).toBe("offline");
    expect((await getSyncStatus()).phase).toBe("idle");
    expect(await getWatermark()).toBe("");
  });

  it("notices an expired sign-in", async () => {
    await setAccount({ id: "u1", email: "a@x" });
    await createPurchase();
    fetchMock.mockResolvedValue(new Response(null, { status: 401 }));
    expect(await syncNow()).toBe("signed-out");
    expect((await getSyncStatus()).phase).toBe("signed-out");
  });

  it("shares one run between callers", async () => {
    await setAccount({ id: "u1", email: "a@x" });
    fetchMock.mockImplementation(async () => Response.json(emptyPull));
    const [a, b] = [syncNow(), syncNow()];
    expect(a).toBe(b);
    await a;
  });
});
