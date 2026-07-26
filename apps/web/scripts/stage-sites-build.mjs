import {
  access,
  cp,
  mkdir,
  readFile,
  readdir,
  rm,
  stat,
  writeFile,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const openNextRoot = path.join(projectRoot, ".open-next");
const nativeWorker = path.join(openNextRoot, "worker.js");
const nativeAssets = path.join(openNextRoot, "assets");
const nativeCacheAssets = path.join(
  nativeAssets,
  "cdn-cgi",
  "_next_cache",
);
const runtimeIsland = path.join(
  nativeAssets,
  "runtime",
  "hyperpbi-island.js",
);
const distRoot = path.join(projectRoot, "dist");
const compatibilityWorker = path.join(distRoot, "server", "index.js");
const compatibilityAssets = path.join(distRoot, "client");
const stagedOpenNext = path.join(distRoot, ".open-next");
const packageManifest = path.join(projectRoot, "package.json");

async function requireFile(file) {
  await access(file);
  const details = await stat(file);
  if (!details.isFile() || details.size === 0) {
    throw new Error(`Expected a non-empty file at ${file}`);
  }
}

async function requireDirectory(directory) {
  await access(directory);
  const details = await stat(directory);
  if (!details.isDirectory()) {
    throw new Error(`Expected a directory at ${directory}`);
  }
}

async function countFiles(directory) {
  let total = 0;
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      total += await countFiles(path.join(directory, entry.name));
    } else if (entry.isFile()) {
      total += 1;
    }
  }
  return total;
}

await requireFile(nativeWorker);
await requireDirectory(nativeAssets);
await requireDirectory(nativeCacheAssets);
await requireFile(runtimeIsland);

const manifest = JSON.parse(await readFile(packageManifest, "utf8"));
const resolvedProjectRoot = path.resolve(projectRoot);
const resolvedDistRoot = path.resolve(distRoot);
const expectedDistRoot = path.join(resolvedProjectRoot, "dist");
if (
  manifest.name !== "@hyperpbi/web" ||
  resolvedDistRoot !== expectedDistRoot ||
  path.dirname(resolvedDistRoot) !== resolvedProjectRoot
) {
  throw new Error(
    `Refusing to replace an unexpected staging directory: ${resolvedDistRoot}`,
  );
}

await rm(distRoot, { recursive: true, force: true });
await mkdir(path.dirname(compatibilityWorker), { recursive: true });

await cp(openNextRoot, stagedOpenNext, { recursive: true });
await cp(nativeAssets, compatibilityAssets, { recursive: true });
await writeFile(
  compatibilityWorker,
  [
    'export { default } from "../.open-next/worker.js";',
    'export * from "../.open-next/worker.js";',
    "",
  ].join("\n"),
  "utf8",
);

await requireFile(compatibilityWorker);
await requireFile(path.join(stagedOpenNext, "worker.js"));
await requireFile(
  path.join(compatibilityAssets, "runtime", "hyperpbi-island.js"),
);
await requireDirectory(
  path.join(compatibilityAssets, "cdn-cgi", "_next_cache"),
);

const nativeFileCount = await countFiles(stagedOpenNext);
const compatibilityAssetCount = await countFiles(compatibilityAssets);

console.log(
  `Sites staging complete: ${nativeFileCount} OpenNext files and ${compatibilityAssetCount} compatibility assets.`,
);
