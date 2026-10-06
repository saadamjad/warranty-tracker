import { describe, expect, it } from "vitest";
import { contentSecurityPolicy } from "./csp";

describe("contentSecurityPolicy", () => {
  const live = contentSecurityPolicy({ storageEndpoint: "https://acc.r2.cloudflarestorage.com/", dev: false });

  it("lets the browser reach file storage and nothing else outside the app", () => {
    expect(live).toContain("connect-src 'self' https://acc.r2.cloudflarestorage.com;");
    expect(live).toContain("img-src 'self' blob: data: https://acc.r2.cloudflarestorage.com;");
  });

  it("blocks plugins, framing and eval on the live site", () => {
    expect(live).toContain("object-src 'none'");
    expect(live).toContain("frame-ancestors 'none'");
    expect(live).not.toContain("'unsafe-eval'");
  });

  it("works without a storage endpoint (builds without server settings)", () => {
    expect(contentSecurityPolicy({ dev: false })).toContain("connect-src 'self';");
  });
});
