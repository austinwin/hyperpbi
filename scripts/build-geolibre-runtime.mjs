import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDirectory, "..");
const vendor = path.join(root, "vendor", "geolibre");
const output = path.join(root, "apps", "web", "public", "geolibre");
const profile = path.join(root, "src", "components", "geolibre", "runtime", "admin-profile.json");
const integrity = JSON.parse(await readFile(
  path.join(root, "src", "components", "geolibre", "runtime", "upstream-integrity.json"),
  "utf8",
));
const EXPECTED_VERSION = integrity.version;
const EXPECTED_REVISION = integrity.revision;
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const EMBED_API_ORIGINS = "*";
const EMBED_API_ORIGIN_MODE = "parent-window";

function run(command, args, cwd, env = process.env) {
  const result = spawnSync(command, args, { cwd, env, stdio: "inherit", shell: false });
  if (result.status !== 0) process.exit(result.status ?? 1);
}

function runNpm(args, cwd, env = process.env) {
  // `npm run` exposes its CLI path. Reusing it through this process' Node keeps
  // nested upstream builds on the exact CI/runtime Node version instead of a
  // different globally installed npm shim (notably on Windows).
  if (process.env.npm_execpath) {
    run(process.execPath, [process.env.npm_execpath, ...args], cwd, env);
  } else {
    run(npm, args, cwd, env);
  }
}

function tryCapture(command, args, cwd) {
  const result = spawnSync(command, args, { cwd, encoding: "utf8", shell: false });
  return result.status === 0 ? result.stdout.trim() : undefined;
}

const manifest = JSON.parse(await readFile(path.join(vendor, "package.json"), "utf8"));
if (manifest.version !== EXPECTED_VERSION) {
  throw new Error(`Expected GeoLibre ${EXPECTED_VERSION}, found ${manifest.version}.`);
}
const revision = tryCapture("git", ["rev-parse", "HEAD"], vendor);
if (revision) {
  if (revision !== EXPECTED_REVISION) {
    throw new Error(`Expected GeoLibre revision ${EXPECTED_REVISION}, found ${revision}.`);
  }
} else {
  for (const [relativePath, expectedHash] of Object.entries(integrity.sha256)) {
    const contents = await readFile(path.join(vendor, relativePath));
    const actualHash = createHash("sha256").update(contents).digest("hex");
    if (actualHash !== expectedHash) {
      throw new Error(`GeoLibre source integrity check failed for ${relativePath}.`);
    }
  }
  console.log("GeoLibre Git metadata is unavailable; verified the pinned deployment source fingerprints.");
}

async function stagedRuntimeIsValid() {
  try {
    const runtimeManifest = JSON.parse(
      await readFile(path.join(output, "hyperpbi-geolibre-manifest.json"), "utf8"),
    );
    const entrypoint = await stat(path.join(output, "index.html"));
    return entrypoint.isFile() &&
      runtimeManifest.geolibreVersion === EXPECTED_VERSION &&
      runtimeManifest.upstreamRevision === EXPECTED_REVISION &&
      runtimeManifest.basePath === "/geolibre/" &&
      runtimeManifest.profile === "powerbi-embedded" &&
      runtimeManifest.embedApiOrigins === EMBED_API_ORIGIN_MODE;
  } catch {
    return false;
  }
}

if (process.argv.includes("--if-valid") && await stagedRuntimeIsValid()) {
  console.log(`GeoLibre ${EXPECTED_VERSION} runtime is already staged and valid.`);
  process.exit(0);
}

if (!process.argv.includes("--skip-install")) {
  runNpm(["ci"], vendor);
}

const resolvedOutput = path.resolve(output);
const expectedOutput = path.join(path.resolve(root), "apps", "web", "public", "geolibre");
if (resolvedOutput !== expectedOutput || path.dirname(resolvedOutput) !== path.join(path.resolve(root), "apps", "web", "public")) {
  throw new Error(`Refusing to replace unexpected GeoLibre output: ${resolvedOutput}`);
}
await rm(resolvedOutput, { recursive: true, force: true });
await mkdir(resolvedOutput, { recursive: true });

runNpm(
  ["run", "lite:build", "--", "--outDir", resolvedOutput],
  vendor,
  {
    ...process.env,
    GEOLIBRE_APP_BASE: "/geolibre/",
    // Power BI Desktop uses a sandboxed parent whose origin is not stable or
    // enumerable. GeoLibre still accepts messages only from window.parent;
    // wildcarding the origin lets that exact parent complete the handshake.
    VITE_GEOLIBRE_EMBED_ORIGINS: EMBED_API_ORIGINS,
  },
);

await cp(profile, path.join(resolvedOutput, "admin-profile.json"));

async function summarize(directory) {
  let fileCount = 0;
  let totalBytes = 0;
  let largest = { path: "", bytes: 0 };
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      const nested = await summarize(file);
      fileCount += nested.fileCount;
      totalBytes += nested.totalBytes;
      if (nested.largest.bytes > largest.bytes) largest = nested.largest;
    } else if (entry.isFile()) {
      const details = await stat(file);
      fileCount += 1;
      totalBytes += details.size;
      if (details.size > largest.bytes) largest = { path: path.relative(resolvedOutput, file).replaceAll("\\", "/"), bytes: details.size };
    }
  }
  return { fileCount, totalBytes, largest };
}

const summary = await summarize(resolvedOutput);
const runtimeManifest = {
  geolibreVersion: EXPECTED_VERSION,
  upstreamRevision: EXPECTED_REVISION,
  projectFormatVersion: "0.2.0",
  basePath: "/geolibre/",
  profile: "powerbi-embedded",
  embedApiOrigins: EMBED_API_ORIGIN_MODE,
  builtAt: new Date().toISOString(),
  ...summary,
};
await writeFile(
  path.join(resolvedOutput, "hyperpbi-geolibre-manifest.json"),
  `${JSON.stringify(runtimeManifest, null, 2)}\n`,
  "utf8",
);
console.log(
  `GeoLibre ${EXPECTED_VERSION} (${EXPECTED_REVISION.slice(0, 12)}) staged: ${summary.fileCount} files, ${(summary.totalBytes / 1024 / 1024).toFixed(1)} MiB.`,
);
