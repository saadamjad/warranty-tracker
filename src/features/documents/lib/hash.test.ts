import { describe, expect, it } from "vitest";
import { hashPages } from "./hash";

describe("hashPages", () => {
  it("is stable for the same content and sensitive to page order", async () => {
    const a = new Blob(["page-a"]);
    const b = new Blob(["page-b"]);
    expect(await hashPages([a, b])).toBe(await hashPages([new Blob(["page-a"]), new Blob(["page-b"])]));
    expect(await hashPages([a, b])).not.toBe(await hashPages([b, a]));
    expect(await hashPages([new Blob(["abc"])])).toBe(
      "ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad",
    );
  });
});
