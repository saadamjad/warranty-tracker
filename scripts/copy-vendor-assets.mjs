// Copies browser worker files from node_modules into public/vendor so they are served
// by the app itself and can be cached for offline use (SPEC D-32). Runs on postinstall.
import { cpSync, mkdirSync } from "node:fs";

const assets = [["node_modules/pdfjs-dist/build/pdf.worker.min.mjs", "public/vendor/pdf.worker.min.mjs"]];

mkdirSync("public/vendor", { recursive: true });
for (const [from, to] of assets) cpSync(from, to);
