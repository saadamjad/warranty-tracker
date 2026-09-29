// Copies browser worker files from node_modules into public/vendor so they are served
// by the app itself and can be cached for offline use (SPEC D-32). Runs on postinstall.
import { cpSync, mkdirSync } from "node:fs";

const core = "node_modules/tesseract.js-core";
const assets = [
  ["node_modules/pdfjs-dist/build/pdf.worker.min.mjs", "pdf.worker.min.mjs"],
  ["node_modules/tesseract.js/dist/worker.min.js", "tesseract/worker.min.js"],
  // LSTM-only builds: the default engine mode; the browser picks the fastest it supports.
  [`${core}/tesseract-core-lstm.wasm.js`, "tesseract/core/tesseract-core-lstm.wasm.js"],
  [`${core}/tesseract-core-simd-lstm.wasm.js`, "tesseract/core/tesseract-core-simd-lstm.wasm.js"],
  [`${core}/tesseract-core-relaxedsimd-lstm.wasm.js`, "tesseract/core/tesseract-core-relaxedsimd-lstm.wasm.js"],
  ["node_modules/@tesseract.js-data/eng/4.0.0_best_int/eng.traineddata.gz", "tesseract/lang/eng.traineddata.gz"],
];

for (const [from, to] of assets) {
  const target = `public/vendor/${to}`;
  mkdirSync(target.slice(0, target.lastIndexOf("/")), { recursive: true });
  cpSync(from, target);
}
