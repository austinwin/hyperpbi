import { copyFile, readFile, unlink, writeFile } from "node:fs/promises";
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

    // Retain the historical artifact labels, but never emit the unsupported
    // https://* WebAccess sentinel. Power BI only supports wildcards on a
    // concrete parent host (for example, https://*.arcgis.com).
    const broadProfileLabel = process.env.HYPERPBI_ALLOW_ALL_MAP_HOSTS !== "false";

    try {
        const extraHosts = parseMapHostPatterns(process.env.HYPERPBI_MAP_HOSTS ?? "");
        const webAccessParams = buildWebAccessParameters({
            profile,
            configuredHosts: extraHosts,
        });
        if (profile === "maps") {
            console.log(
                `Maps package: using ${webAccessParams.length} Power BI-compatible HTTPS host declaration(s).` +
                (extraHosts.length
                    ? ""
                    : " Set HYPERPBI_MAP_HOSTS for custom basemap or geocoder hosts."),
            );
        }

        const capabilities = JSON.parse(originalCapabilities);
        capabilities.privileges = profile === "maps"
            ? [{
                name: "WebAccess",
                essential: true,
                parameters: webAccessParams,
            }]
            : [];
        await writeFile(capabilitiesPath, JSON.stringify(capabilities, null, 2) + "\n");

        await writeFile(buildPath, [
            "/** Generated temporarily by package-profile.mjs. */",
            `export const EXTERNAL_PROVIDERS_AVAILABLE = ${profile === "maps"};`,
        ].join("\n") + "\n");

        if (originalHostPolicy && profile === "maps") {
            const injectedHosts = [...DEFAULT_MAP_HOSTS, ...extraHosts];
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
                ? broadProfileLabel ? "maps-broad" : "maps-restricted"
                : "core";
            const pbiviz = JSON.parse(await readFile(join(root, "pbiviz.json"), "utf8"));
            const packageBase = `${pbiviz.visual.guid}.${pbiviz.visual.version}`;
            const sourceName = `${packageBase}.pbiviz`;
            const source = join(dist, sourceName);
            const escapedGuid = String(pbiviz.visual.guid).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
            const staleProfilePattern = new RegExp(
                `^${escapedGuid}\\..+-${packageLabel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\.pbiviz$`,
            );
            const staleBasePattern = new RegExp(`^${escapedGuid}\\.[0-9.]+\\.pbiviz$`);

            for (const file of files) {
                if (
                    staleProfilePattern.test(file) ||
                    (staleBasePattern.test(file) && file !== sourceName) ||
                    (profile === "maps" && broadProfileLabel && new RegExp(`^${escapedGuid}\\..+-maps\\.pbiviz$`).test(file))
                ) {
                    await unlink(join(dist, file));
                }
            }
            await copyFile(source, join(dist, `${packageBase}-${packageLabel}.pbiviz`));
            if (profile === "maps" && broadProfileLabel) {
                await copyFile(source, join(dist, `${packageBase}-maps.pbiviz`));
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
