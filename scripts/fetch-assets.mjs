// Downloads the storefront imagery into public/assets (git-ignored).
//
// The photos belong to the Aniq UI template, so they are not committed to this
// repository. They are fetched from the reconstruction repo listed below, or
// set ASSETS_BASE_URL to wherever you keep your own licensed copies. Existing
// files are skipped, so re-running is cheap.
import { mkdir, readFile, stat, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const base = process.env.ASSETS_BASE_URL ?? "https://raw.githubusercontent.com/moain2028/aniq-ecommerce/main";
const manifest = JSON.parse(await readFile(join(root, "scripts", "assets-manifest.json"), "utf8"));

const exists = (p) => stat(p).then(() => true, () => false);
let fetched = 0;
let failed = 0;

await Promise.all(
  manifest.map(async ({ path, src }) => {
    const dest = join(root, "public", path);
    if (await exists(dest)) return;
    try {
      const res = await fetch(`${base}/${src}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      await mkdir(dirname(dest), { recursive: true });
      await writeFile(dest, Buffer.from(await res.arrayBuffer()));
      fetched++;
    } catch (e) {
      failed++;
      console.warn(`[assets] ${path}: ${e.message}`);
    }
  }),
);

console.log(`[assets] ${fetched} downloaded, ${manifest.length - fetched - failed} already present, ${failed} failed`);
