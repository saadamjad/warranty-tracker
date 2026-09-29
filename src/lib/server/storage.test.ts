import { describe, expect, it } from "vitest";
import { isOwnedKey, pageKey } from "./storage";

describe("storage keys", () => {
  it("scopes page keys to their owner", () => {
    const key = pageKey("user-a", "doc-1", 0, "original");
    expect(key).toBe("users/user-a/documents/doc-1/original/0");
    expect(isOwnedKey("user-a", key)).toBe(true);
  });

  it("rejects other users' keys and path traversal", () => {
    expect(isOwnedKey("user-b", pageKey("user-a", "doc-1", 0, "original"))).toBe(false);
    expect(isOwnedKey("user-a", "users/user-a/../user-b/documents/x")).toBe(false);
    expect(isOwnedKey("user-a", "users/user-ab/documents/x")).toBe(false);
  });
});
