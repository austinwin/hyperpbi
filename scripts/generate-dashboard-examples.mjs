import { build } from "esbuild";
import { mkdir, rm } from "node:fs/promises";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";

const root = process.cwd();
const temporaryDirectory = resolve(root, ".tmp", "dashboard-examples-generator");
const output = resolve(temporaryDirectory, "generator.mjs");

await mkdir(temporaryDirectory, { recursive: true });
await build({
    entryPoints: [resolve(root, "scripts", "generate-dashboard-examples.ts")],
    outfile: output,
    bundle: true,
    platform: "node",
    format: "esm",
    target: "node22",
    sourcemap: false,
    logLevel: "warning",
});

try {
    await import(`${pathToFileURL(output).href}?generated=${Date.now()}`);
} finally {
    await rm(temporaryDirectory, { recursive: true, force: true });
}
