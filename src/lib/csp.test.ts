import { describe, expect, it } from "vitest";
import { contentSecurityPolicy } from "./csp";

describe("contentSecurityPolicy", () => {
  const live = contentSecurityPolicy({ dev: false });

  it("keeps page data on the app's own address (files are stored by the app, D-38)", () => {
    expect(live).toContain("connect-src 'self';");
    expect(live).toContain("img-src 'self' blob: data:;");
  });

  it("blocks plugins, framing and eval on the live site", () => {
    expect(live).toContain("object-src 'none'");
    expect(live).toContain("frame-ancestors 'none'");
    expect(live).not.toContain("'unsafe-eval'");
  });
});
