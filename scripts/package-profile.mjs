import { copyFile, readFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { join } from "node:path";
import {
    DEFAULT_MAP_HOSTS,
    acquirePackageProfileLock,
    buildWebAccessParameters,
    parseMapHostPatterns,
} from "./package-profile-utils.mjs";

const profile = process.argv[2] === "maps" ? "maps" : "core";
const audit = process.argv.includes("audit");
const root = process.cwd();
const capabilitiesPath = join(root, "capabilities.json");
const buildPath = join(root, "src/providers/providerBuild.ts");
const hostPolicyPath = join(root, "src/maps/arcgis/arcGisHostPolicy.ts");
const releasePackageLock = await acquirePackageProfileLock(
    join(root, ".tmp", "package-profile.lock"),
);

const retryableRestoreCodes = new Set(["EBUSY", "EPERM", "EACCES", "UNKNOWN"]);
async function restoreFile(path, contents) {
    for (let attempt = 0; ; attempt += 1) {
        try {
            await writeFile(path, contents);
            return;
        } catch (error) {
            if (attempt >= 19 || !retryableRestoreCodes.has(error?.code)) throw error;
            await new Promise(resolve => setTimeout(resolve, 100 * (attempt + 1)));
        }
    }
}

try {
    const originalCapabilities = await readFile(capabilitiesPath, "utf8");
    const originalBuild = await readFile(buildPath, "utf8");
    let originalHostPolicy = "";
    try {
        originalHostPolicy = await readFile(hostPolicyPath, "utf8");
    } catch {
        // A build without the ArcGIS host policy has nothing to restore here.
    }

    // Read broad-host setting while holding the profile lock because all
    // profiles temporarily mutate the same fixed workspace files.
    const allowAllHosts = process.env.HYPERPBI_ALLOW_ALL_MAP_HOSTS !== "false";

    try {
        const extraHosts = parseMapHostPatterns(process.env.HYPERPBI_MAP_HOSTS ?? "");
        const webAccessParams = buildWebAccessParameters({
            profile,
            allowAllHosts,
            configuredHosts: extraHosts,
        });
        if (profile === "maps") {
            console.log(allowAllHosts
                ? "Maps package: using broad wildcard https://* for all HTTPS hosts."
                : `Maps package: using restricted host list (${webAccessParams.length} hosts).`);
        }

        const capabilities = JSON.parse(originalCapabilities);
        capabilities.privileges = profile === "maps"
            ? [{
                name: "WebAccess",
                essential: false,
                parameters: webAccessParams,
            }]
            : [];
        await writeFile(capabilitiesPath, JSON.stringify(capabilities, null, 2) + "\n");

        await writeFile(buildPath, [
            "/** Generated temporarily by package-profile.mjs. */",
            `export const EXTERNAL_PROVIDERS_AVAILABLE = ${profile === "maps"};`,
        ].join("\n") + "\n");

        if (originalHostPolicy && profile === "maps") {
            const injectedHosts = allowAllHosts
                ? ["https://*"]
                : [...DEFAULT_MAP_HOSTS, ...extraHosts];
            const injected = originalHostPolicy.replace(
                /const DEFAULT_PUBLIC_HOSTS = \[[\s\S]*?\];/,
                `const DEFAULT_PUBLIC_HOSTS = ${JSON.stringify(injectedHosts)};`,
            );
            await writeFile(hostPolicyPath, injected);
        }

        const flags = [
            profile === "core" ? "--certification-fix" : "",
            audit ? "--certification-audit" : "",
        ].filter(Boolean).join(" ");
        const result = spawnSync(`npx pbiviz package ${flags}`, {
            cwd: root,
            stdio: "inherit",
            shell: true,
        });

        if (result.error) console.error(result.error);
        if (result.status !== 0) {
            process.exitCode = result.status ?? 1;
        } else {
            const { readdir } = await import("node:fs/promises");
            const dist = join(root, "dist");
            const files = await readdir(dist);
            const packageLabel = profile === "maps"
                ? allowAllHosts ? "maps-broad" : "maps-restricted"
                : "core";
            for (const file of files) {
                if (file.endsWith(".pbiviz") && !/-(?:core|maps)(?:-|\.pbiviz$)/.test(file)) {
                    const source = join(dist, file);
                    const target = join(dist, file.replace(".pbiviz", `-${packageLabel}.pbiviz`));
                    await copyFile(source, target);
                    if (profile === "maps") {
                        await copyFile(source, join(dist, file.replace(".pbiviz", "-maps.pbiviz")));
                    }
                }
            }

            const profileManifestPath = join(dist, "package-capability-profiles.json");
            let profileManifest = {};
            try {
                profileManifest = JSON.parse(await readFile(profileManifestPath, "utf8"));
            } catch {
                // The first package in a validation run creates the manifest.
            }
            profileManifest[packageLabel] = { webAccessParameters: webAccessParams };
            await writeFile(profileManifestPath, JSON.stringify(profileManifest, null, 2) + "\n");
        }
    } finally {
        await restoreFile(capabilitiesPath, originalCapabilities);
        await restoreFile(buildPath, originalBuild);
        if (originalHostPolicy) await restoreFile(hostPolicyPath, originalHostPolicy);
    }
} finally {
    await releasePackageLock();
}
