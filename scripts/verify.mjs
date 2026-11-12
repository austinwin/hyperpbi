import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import { resolve } from "node:path";

const level = process.argv[2] ?? "fast";
if (!["fast", "pr", "full"].includes(level)) throw new Error("Use verify.mjs fast|pr|full.");
const baseIndex = process.argv.indexOf("--base");
const filesIndex = process.argv.indexOf("--files");
const git = args => execFileSync("git", ["-c", "core.safecrlf=false", ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim().split(/\r?\n/).filter(Boolean);
const base = baseIndex >= 0 ? process.argv[baseIndex + 1] : process.env.HYPERPBI_VERIFY_BASE ?? "origin/main";
const files = [...new Set(filesIndex >= 0 ? process.argv.slice(filesIndex + 1) : [...git(["diff", "--name-only", `${base}...HEAD`]), ...git(["diff", "--name-only", "HEAD"]), ...git(["ls-files", "--others", "--exclude-standard"])])].map(file => file.replaceAll("\\", "/"));
const full = level === "full";
const has = pattern => files.some(file => pattern.test(file));
const impact = {
    shared: has(/^src\/(render|schema|security|fragments|data|providers|interactions)\//),
    maps: has(/^(src\/(maps|components\/maps|editor\/map-studio)|examples\/map|tests\/.*(?:map|arcgis|fragment))/),
    runtime: has(/^(src\/|apps\/playground\/src\/|apps\/web\/runtime\/)/),
    web: has(/^apps\/web\//),
    docs: has(/^(docs\/|README|CHANGELOG|examples\/|src\/(catalog|docs|schema|maps)|scripts\/.*(?:documentation|content))/),
    build: has(/^(package(?:-lock)?\.json|.*config\.|scripts\/(package|verify)|capabilities\.json|style\/)/),
};
console.log(`Verification: ${level}; ${files.length} changed files; impact ${JSON.stringify(impact)}`);
const plan = [];
const add = (name, entry, args = [], env) => plan.push({ name, command: process.execPath, args: [entry, ...args], env });
const npm = (name, script) => plan.push({ name, command: process.platform === "win32" ? "npm.cmd" : "npm", args: ["run", script], shell: process.platform === "win32" });
const code = files.filter(file => /\.(?:ts|tsx|mjs|cjs)$/.test(file) && existsSync(file));
if (full || code.length || impact.build) add("types:runtime", "node_modules/typescript/bin/tsc", ["--noEmit", "--incremental", "--tsBuildInfoFile", ".tmp/verify-runtime.tsbuildinfo"]);
if (full || level === "pr" && (impact.web || impact.runtime || impact.build)) {
    npm("types:web", "web:typecheck");
    npm("types:playground", "playground:typecheck");
}
if (full || code.length) add("lint", "node_modules/eslint/bin/eslint.js", full || level === "pr" && impact.build ? [".", "--cache", "--cache-location", ".tmp/eslintcache"] : [...code, "--cache", "--cache-location", ".tmp/eslintcache"]);
if (full || level === "pr" && (impact.shared || impact.build)) add("unit", "node_modules/vitest/vitest.mjs", ["run"]);
else if (code.length) {
    const broadFastChange = level === "fast" && (code.length > 20 || has(/^src\/(render|schema|security|catalog)\//));
    if (broadFastChange) {
        const focused = new Set(["tests/schema.test.ts", "tests/security.test.ts", "tests/component-descriptor-parity.test.ts"]);
        if (impact.maps || impact.shared) for (const test of ["tests/remote-fragments.test.ts", "tests/remote-fragment-isolation.test.tsx", "tests/map-feature-details.test.tsx", "tests/map-popup-content.test.tsx", "tests/remote-data-sources.test.ts", "tests/remote-data-workspace.test.tsx", "tests/chart-events.test.ts"]) focused.add(test);
        add("unit:focused", "node_modules/vitest/vitest.mjs", ["run", ...focused]);
    } else add("unit:related", "node_modules/vitest/vitest.mjs", ["related", ...code, "--run", "--passWithNoTests"]);
}
if (full || impact.docs) {
    npm("docs", "docs:check");
    add("content", "node_modules/vitest/vitest.mjs", ["run", "tests/documentation-contract.test.ts", "tests/content-integrity.test.ts", "tests/map-example-gallery.test.ts", "tests/dashboard-examples.test.ts"]);
}
if (full || impact.maps || impact.shared) add("browser:runtime", "node_modules/@playwright/test/cli.js", ["test", ...(full ? [] : ["tests/browser/remote-fragments.spec.ts", ...(level === "pr" ? ["tests/browser/map-runtime.spec.ts"] : ["--grep", "real fragments render interactive charts"])])]);
if (full || level === "pr" && (impact.runtime || impact.web)) add("browser:playground", "node_modules/@playwright/test/cli.js", ["test", "--config", "apps/playground/playwright.config.ts", ...(full ? [] : ["remote-fragments.spec.ts"])]);
if (full || level === "pr" && (impact.runtime || impact.build)) npm("build:playground", "playground:build");
if (full || level === "pr" && (impact.web || impact.runtime || impact.docs || impact.build)) npm("build:web", "web:build");
// The Sites build invokes Next internally. Full releases build it once, then stage the Worker.
if (full) {
    plan.splice(plan.findIndex(item => item.name === "build:web"), 1);
    npm("build:website-worker", "web:sites:build");
    npm("package:core", "package:core");
    npm("package:maps", "package:maps");
    npm("package:capabilities", "package:verify");
    add("browser:packaged-visuals", "node_modules/@playwright/test/cli.js", ["test", "tests/browser/scene3d-package.spec.ts", "tests/browser/svg-binding-package.spec.ts", "--workers", "1"], { HYPERPBI_TEST_PACKAGES: "1" });
}
if (process.argv.includes("--dry-run")) { console.log(JSON.stringify(plan, null, 2)); process.exit(0); }
mkdirSync(".verification", { recursive: true });
const measurements = [];
for (const step of plan) {
    console.log(`\n[${level}] ${step.name}`);
    const start = performance.now();
    const result = spawnSync(step.command, step.args, { stdio: "inherit", shell: step.shell ?? false, env: { ...process.env, ...step.env, NODE_OPTIONS: process.env.NODE_OPTIONS ?? "--max-old-space-size=4096" } });
    measurements.push({ name: step.name, seconds: +((performance.now() - start) / 1000).toFixed(2), exitCode: result.status ?? 1 });
    writeFileSync(resolve(`.verification/${level}-timings.json`), JSON.stringify({ level, base, files, measurements }, null, 2));
    if (result.error) console.error(result.error);
    if (result.status !== 0) process.exit(result.status ?? 1);
}
console.log(`\n${level} verification passed in ${measurements.reduce((sum, item) => sum + item.seconds, 0).toFixed(1)}s.`);
