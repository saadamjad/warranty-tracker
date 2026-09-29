import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/lib/db";
import { refreshAccount } from "./account";
import { getAccount, getSyncStatus, setAccount } from "./state";

const fetchMock = vi.fn();

describe("refreshAccount", () => {
  beforeEach(() => vi.stubGlobal("fetch", fetchMock));
  afterEach(async () => {
    vi.unstubAllGlobals();
    fetchMock.mockReset();
    await db.meta.clear();
  });

  it("remembers the signed-in account", async () => {
    fetchMock.mockResolvedValueOnce(Response.json({ user: { id: "u1", email: "a@x" } }));
    await refreshAccount();
    expect(await getAccount()).toEqual({ id: "u1", email: "a@x" });
  });

  it("keeps the account but asks to sign in again when the session expired", async () => {
    await setAccount({ id: "u1", email: "a@x" });
    fetchMock.mockResolvedValueOnce(Response.json(null));
    await refreshAccount();
    expect(await getAccount()).toEqual({ id: "u1", email: "a@x" });
    expect((await getSyncStatus()).phase).toBe("signed-out");
  });

  it("changes nothing while offline", async () => {
    await setAccount({ id: "u1", email: "a@x" });
    fetchMock.mockRejectedValueOnce(new TypeError("offline"));
    await refreshAccount();
    expect((await getSyncStatus()).phase).toBe("idle");
  });
});
