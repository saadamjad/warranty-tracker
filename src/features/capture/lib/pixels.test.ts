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

describe("stretchContrast on sparse pages", () => {
  it("keeps a mostly white page white and its few dark pixels dark (seen in real reading)", () => {
    // 1 dark pixel row in 100: text covers 1% of the page.
    const rgba = image(100, 100, (_, y) => (y === 50 ? 20 : 250));
    stretchContrast(rgba);
    const gray = luminance(rgba);
    expect(gray[10 * 100]).toBeGreaterThan(200);
    expect(gray[50 * 100]).toBeLessThan(60);
  });

  it("leaves a blank page as it is", () => {
    const rgba = image(10, 10, () => 240);
    stretchContrast(rgba);
    expect(luminance(rgba)[0]).toBe(240);
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

  it("never crops dark text on a white page, even short lines (seen in real reading)", () => {
    // Three text lines of different lengths on white: cropping would cut the long line's end.
    const text = (x: number, y: number) => (y % 30 < 8 && x > 5 && x < [90, 40, 60][Math.floor(y / 30) % 3] ? 0 : 255);
    expect(findContentBox(luminance(image(100, 90, text)), 100, 90)).toBeNull();
  });

  it("keeps the whole image when nothing stands out", () => {
    expect(findContentBox(luminance(image(50, 50, () => 128)), 50, 50)).toBeNull();
  });
});
