import { afterEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";
import { prepareOfflineReading } from "./warmUp";

const prepareReader = vi.fn(async () => undefined);
vi.mock("./reader", () => ({ prepareReader: () => prepareReader() }));

describe("prepareOfflineReading", () => {
  afterEach(async () => {
    vi.restoreAllMocks();
    prepareReader.mockClear();
    await db.meta.clear();
  });

  it("prepares once, online", async () => {
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
    expect(await prepareOfflineReading()).toBe(true);
    expect(await prepareOfflineReading()).toBe(false);
    expect(prepareReader).toHaveBeenCalledTimes(1);
  });

  it("waits while offline", async () => {
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    expect(await prepareOfflineReading()).toBe(false);
    expect(prepareReader).not.toHaveBeenCalled();
  });
});
