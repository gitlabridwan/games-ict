import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const dist = resolve(root, "dist");
const failures = [];
const warnings = [];

function requireFile(path) {
  if (!existsSync(resolve(root, path))) failures.push(`File wajib tidak ditemukan: ${path}`);
}

[
  "dist/index.html",
  "dist/.nojekyll",
  "dist/multiplayer-config.json",
  "dist/assets/town.webp",
  ".github/workflows/deploy-pages.yml",
  "firebase.rules.json",
].forEach(requireFile);

const html = readFileSync(resolve(dist, "index.html"), "utf8");
if (/\b(?:href|src)="\/(?:_next|assets)\//.test(html)) {
  failures.push("index.html masih memiliki asset root-absolute yang rusak pada GitHub project Pages.");
}

const gameChunk = readFileSync(
  resolve(dist, "_next/static/chunks/Game-BdOVIn-G.js"),
  "utf8",
);
if (gameChunk.includes("fetch(`/multiplayer-config.json`)")) {
  failures.push("Konfigurasi multiplayer masih dimuat dari root domain.");
}

try {
  const config = JSON.parse(readFileSync(resolve(dist, "multiplayer-config.json"), "utf8"));
  if (config.provider === "firebase") {
    if (!config.firebase?.apiKey || config.firebase.apiKey.startsWith("GANTI_")) {
      warnings.push("FIREBASE apiKey belum diisi; mode solo tetap dapat dimainkan.");
    }
    if (!config.firebase?.databaseURL || config.firebase.databaseURL.includes("NAMA_PROJECT")) {
      warnings.push("FIREBASE databaseURL belum diisi; mode solo tetap dapat dimainkan.");
    }
  }
} catch (error) {
  failures.push(`multiplayer-config.json tidak valid: ${error.message}`);
}

for (const warning of warnings) console.warn(`PERINGATAN: ${warning}`);
if (failures.length) {
  for (const failure of failures) console.error(`GAGAL: ${failure}`);
  process.exit(1);
}
console.log("Paket GitHub Pages valid.");
