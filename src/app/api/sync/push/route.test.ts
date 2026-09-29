// @vitest-environment node
import { afterEach, describe, expect, it, vi } from "vitest";

const sessionUserId = vi.fn();
const pushChanges = vi.fn();
vi.mock("@/lib/server/http", async (original) => ({
  ...(await original<typeof import("@/lib/server/http")>()),
  sessionUserId: () => sessionUserId(),
}));
vi.mock("@/lib/server/repo", async () => {
  class ForbiddenRecordError extends Error {}
  return { ForbiddenRecordError, pushChanges: (...args: unknown[]) => pushChanges(...args) };
});
vi.mock("@/lib/server/auth", () => ({ auth: vi.fn() }));

const { POST } = await import("./route");
const { ForbiddenRecordError } = await import("@/lib/server/repo");
const empty = { purchases: [], documents: [], warranties: [], purged: [] };
const request = (body: unknown) => new Request("http://test/api/sync/push", { method: "POST", body: JSON.stringify(body) });

describe("POST /api/sync/push", () => {
  afterEach(() => vi.clearAllMocks());

  it("requires a signed-in user", async () => {
    sessionUserId.mockResolvedValueOnce(null);
    expect((await POST(request(empty))).status).toBe(401);
    expect(pushChanges).not.toHaveBeenCalled();
  });

  it("rejects invalid input before touching data", async () => {
    sessionUserId.mockResolvedValueOnce("u1");
    expect((await POST(request({ purchases: "nope" }))).status).toBe(400);
    expect(pushChanges).not.toHaveBeenCalled();
  });

  it("pushes for the session user only", async () => {
    sessionUserId.mockResolvedValueOnce("u1");
    expect((await POST(request(empty))).status).toBe(200);
    expect(pushChanges).toHaveBeenCalledWith("u1", empty);
  });

  it("answers 403 for someone else's records, without details", async () => {
    sessionUserId.mockResolvedValueOnce("u1");
    pushChanges.mockRejectedValueOnce(new ForbiddenRecordError("purchase abc"));
    const response = await POST(request(empty));
    expect(response.status).toBe(403);
    expect(await response.json()).toEqual({ error: "Not allowed." });
  });
});
