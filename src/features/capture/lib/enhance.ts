import { findContentBox, luminance, stretchContrast } from "./pixels";

/** Enough detail for reading small print while keeping stored copies modest. */
const MAX_SIDE = 2400;

export type QuarterTurns = 0 | 1 | 2 | 3;

/**
 * Makes a readable copy of a photo: upright (EXIF + manual turns), cropped to the paper when
 * confident, grayscale with stretched contrast. The original is never changed (rule 5, FR-06).
 * Returns undefined if the browser can't process it; the original alone is still saved.
 */
export async function enhanceImage(original: Blob, turns: QuarterTurns = 0): Promise<Blob | undefined> {
  try {
    const bitmap = await createImageBitmap(original, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_SIDE / Math.max(bitmap.width, bitmap.height));
    const width = Math.round(bitmap.width * scale);
    const height = Math.round(bitmap.height * scale);
    const sideways = turns % 2 === 1;

    const canvas = makeCanvas(sideways ? height : width, sideways ? width : height);
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) return undefined;
    context.translate(canvas.width / 2, canvas.height / 2);
    context.rotate((turns * Math.PI) / 2);
    context.drawImage(bitmap, -width / 2, -height / 2, width, height);
    bitmap.close();

    const full = context.getImageData(0, 0, canvas.width, canvas.height);
    const box = findContentBox(luminance(full.data), full.width, full.height);
    const pixels = box ? context.getImageData(box.x, box.y, box.width, box.height) : full;
    stretchContrast(pixels.data);

    const output = makeCanvas(pixels.width, pixels.height);
    output.getContext("2d")?.putImageData(pixels, 0, 0);
    return await new Promise<Blob | undefined>((resolve) =>
      output.toBlob((blob) => resolve(blob ?? undefined), "image/jpeg", 0.85),
    );
  } catch (error) {
    console.warn("Could not make a readable copy; keeping the original only", error);
    return undefined;
  }
}

function makeCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}
