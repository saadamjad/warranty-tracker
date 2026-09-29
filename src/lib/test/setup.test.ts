import { describe, expect, it } from "vitest";

describe("test environment", () => {
  it("provides IndexedDB for local-first storage", () => {
    expect(globalThis.indexedDB).toBeDefined();
  });
});
