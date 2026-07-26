import {
  access,
  readFile,
  readdir,
  rm,
  stat,
} from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const distRoot = path.join(projectRoot, "dist");
const serverRoot = path.join(distRoot, "server");
const serverWorker = path.join(serverRoot, "index.js");
const serverSource = path.join(distRoot, "server-source");
const packageManifest = path.join(projectRoot, "package.json");
const maximumWorkerBytes = 64 * 1024 * 1024;

async function requireFile(file) {
  await access(file);
  const details = await stat(file);
  if (!details.isFile() || details.size === 0) {
    throw new Error(`Expected a non-empty file at ${file}`);
  }
  return details;
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

const manifest = JSON.parse(await readFile(packageManifest, "utf8"));
const resolvedProjectRoot = path.resolve(projectRoot);
const resolvedDistRoot = path.resolve(distRoot);
if (
  manifest.name !== "@hyperpbi/web" ||
  resolvedDistRoot !== path.join(resolvedProjectRoot, "dist") ||
  path.dirname(resolvedDistRoot) !== resolvedProjectRoot
) {
  throw new Error(
    `Refusing to finalize an unexpected staging directory: ${resolvedDistRoot}`,
  );
}

const workerDetails = await requireFile(serverWorker);
if (workerDetails.size >= maximumWorkerBytes) {
  throw new Error(
    `Bundled Sites worker is ${workerDetails.size} bytes; expected less than ${maximumWorkerBytes}.`,
  );
}

const workerSource = await readFile(serverWorker, "utf8");
if (
  workerSource.includes('from "./worker.js"') ||
  !workerSource.includes("var __require =")
) {
  throw new Error("Sites worker does not appear to be a bundled entrypoint.");
}

await rm(path.join(serverRoot, "index.js.map"), { force: true });
await rm(path.join(serverRoot, "README.md"), { force: true });
await rm(serverSource, { recursive: true, force: true });

const serverFileCount = await countFiles(serverRoot);
console.log(
  `Sites worker finalized: ${serverFileCount} file (${(workerDetails.size / 1024 / 1024).toFixed(2)} MiB).`,
);
