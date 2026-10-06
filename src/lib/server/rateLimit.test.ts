// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

vi.mock("./repo", () => ({ hitRateLimit: vi.fn() }));
const { clientIp } = await import("./rateLimit");

describe("clientIp", () => {
  it("takes the first address the proxy reports", () => {
    const request = new Request("http://test", { headers: { "x-forwarded-for": "203.0.113.7, 10.0.0.1" } });
    expect(clientIp(request)).toBe("203.0.113.7");
  });

  it("is unknown without a proxy, so local callers aren't lumped together", () => {
    expect(clientIp(new Request("http://test"))).toBeNull();
  });
});
