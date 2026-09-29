import { afterEach, describe, expect, it } from "vitest";
import { db } from "@/lib/db";
import { addPendingPurge, clearPendingPurges, getCursor, getPendingPurges, getWatermark, setCursor, setWatermark, switchAccount } from "./state";

describe("sync state", () => {
  afterEach(() => db.meta.clear());

  it("tracks pending purges without duplicates", async () => {
    await addPendingPurge("a");
    await addPendingPurge("a");
    await addPendingPurge("b");
    await clearPendingPurges(["a"]);
    expect(await getPendingPurges()).toEqual(["b"]);
  });

  it("starts over when a different account signs in, so everything is uploaded (D-18)", async () => {
    await switchAccount({ id: "u1", email: "a@x" });
    await setWatermark("2026-03-01T00:00:00.000Z");
    await setCursor("42");
    await switchAccount({ id: "u1", email: "a@x" });
    expect([await getWatermark(), await getCursor()]).toEqual(["2026-03-01T00:00:00.000Z", "42"]);
    await switchAccount({ id: "u2", email: "b@x" });
    expect([await getWatermark(), await getCursor()]).toEqual(["", "0"]);
  });
});
