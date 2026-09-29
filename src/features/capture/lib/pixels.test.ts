import { describe, expect, it } from "vitest";
import { findContentBox, luminance, stretchContrast } from "./pixels";

function image(width: number, height: number, fill: (x: number, y: number) => number) {
  const rgba = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const i = (y * width + x) * 4;
      rgba[i] = rgba[i + 1] = rgba[i + 2] = fill(x, y);
      rgba[i + 3] = 255;
    }
  }
  return rgba;
}

describe("stretchContrast", () => {
  it("spreads a faded range across black to white", () => {
    const rgba = image(10, 10, (x) => 120 + x * 2); // 120..138: faded print
    stretchContrast(rgba);
    const gray = luminance(rgba);
    expect(Math.min(...gray)).toBe(0);
    expect(Math.max(...gray)).toBe(255);
  });
});

describe("findContentBox", () => {
  it("finds light paper on a dark table", () => {
    // 100x100 dark table, paper at x 20..69, y 10..89
    const gray = luminance(image(100, 100, (x, y) => (x >= 20 && x < 70 && y >= 10 && y < 90 ? 240 : 40)));
    const box = findContentBox(gray, 100, 100);
    expect(box).not.toBeNull();
    expect(box!.x).toBeLessThanOrEqual(20);
    expect(box!.x + box!.width).toBeGreaterThanOrEqual(70);
    expect(box!.y).toBeLessThanOrEqual(10);
    expect(box!.y + box!.height).toBeGreaterThanOrEqual(90);
  });

  it("keeps the whole image when the paper already fills it (screenshots)", () => {
    const gray = luminance(image(100, 100, (x) => (x % 10 === 0 ? 0 : 255)));
    expect(findContentBox(gray, 100, 100)).toBeNull();
  });

  it("keeps the whole image when nothing stands out", () => {
    expect(findContentBox(luminance(image(50, 50, () => 128)), 50, 50)).toBeNull();
  });
});
