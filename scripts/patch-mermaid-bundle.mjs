import { readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import path from "node:path";

const require = createRequire(import.meta.url);
const packagePath = require.resolve("mermaid/package.json");
const bundlePath = path.join(path.dirname(packagePath), "dist", "mermaid.min.js");
const originalExport = 'globalThis["mermaid"] = globalThis.__esbuild_esm_mermaid_nm["mermaid"].default;';
const moduleExport = 'globalThis["mermaid"] = __esbuild_esm_mermaid_nm["mermaid"].default;export default globalThis["mermaid"];';

const source = await readFile(bundlePath, "utf8");
if (source.includes(moduleExport)) process.exit(0);
if (!source.includes(originalExport)) {
    throw new Error("Unsupported Mermaid bundle shape; update scripts/patch-mermaid-bundle.mjs for the installed version.");
}
await writeFile(bundlePath, source.replace(originalExport, moduleExport));
