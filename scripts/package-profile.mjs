import { copyFile, readFile, writeFile } from "node:fs/promises";
import { spawnSync } from "node:child_process";
import { join } from "node:path";

const profile=process.argv[2]==="maps"?"maps":"core";
const audit=process.argv.includes("audit");
const root=process.cwd();
const capabilitiesPath=join(root,"capabilities.json");
const buildPath=join(root,"src/providers/providerBuild.ts");
const hostPolicyPath=join(root,"src/maps/arcgis/arcGisHostPolicy.ts");

const originalCapabilities=await readFile(capabilitiesPath,"utf8");
const originalBuild=await readFile(buildPath,"utf8");
let originalHostPolicy="";
try { originalHostPolicy=await readFile(hostPolicyPath,"utf8"); } catch {}

// ── Read broad-host setting ──────────────────────────────────────────
const allowAllHosts = process.env.HYPERPBI_ALLOW_ALL_MAP_HOSTS !== "false";

// Default public ArcGIS hosts
const defaultMapHosts = [
    "https://*.arcgis.com",
    "https://*.arcgisonline.com",
];

// Read additional hosts from HYPERPBI_MAP_HOSTS env var
const extraHostsEnv = process.env.HYPERPBI_MAP_HOSTS ?? "";
const extraHosts = extraHostsEnv
    .split(",")
    .map(h => h.trim())
    .filter(h => {
        // Validate: only HTTPS patterns, no credentials
        if (!h.startsWith("https://")) {
            console.warn(`Skipping non-HTTPS host pattern: ${h}`);
            return false;
        }
        try {
            const u = new URL(h);
            if (u.username || u.password) {
                console.warn(`Skipping credential-bearing host pattern: ${h}`);
                return false;
            }
        } catch {
            console.warn(`Skipping malformed host pattern: ${h}`);
            return false;
        }
        return true;
    });

const allHosts = [...new Set([...defaultMapHosts, ...extraHosts])];

// ── Determine WebAccess parameters ────────────────────────────────────
let webAccessParams = [];
if (profile === "maps") {
    if (allowAllHosts) {
        // Broad wildcard: https://* for all HTTPS hosts
        webAccessParams = ["https://*"];
        console.log("Maps package: using broad wildcard https://* for all HTTPS hosts.");
    } else {
        // Restricted: use only configured hosts
        webAccessParams = [
            "https://tile.openstreetmap.org",
            "https://nominatim.openstreetmap.org",
            "https://geocode-api.arcgis.com",
            ...allHosts,
        ];
        console.log(`Maps package: using restricted host list (${webAccessParams.length} hosts).`);
    }
}

try {
    const capabilities=JSON.parse(originalCapabilities);

    if (profile === "maps") {
        capabilities.privileges = [{
            name: "WebAccess",
            essential: false,
            parameters: webAccessParams,
        }];
    } else {
        capabilities.privileges = [];
    }

    await writeFile(capabilitiesPath, JSON.stringify(capabilities, null, 2) + "\n");

    // Write provider build
    await writeFile(buildPath, [
        `/** Generated temporarily by package-profile.mjs. */`,
        `export const EXTERNAL_PROVIDERS_AVAILABLE = ${profile === "maps"};`,
    ].join("\n") + "\n");

    // Inject hosts into arcGisHostPolicy if maps profile
    if (originalHostPolicy && profile === "maps") {
        let injectedHosts;
        if (allowAllHosts) {
            // Include wildcard sentinel for runtime matching
            injectedHosts = [...defaultMapHosts, "https://*"];
        } else {
            injectedHosts = allHosts;
        }
        const injected = originalHostPolicy.replace(
            /const DEFAULT_PUBLIC_HOSTS = \[[\s\S]*?\];/,
            `const DEFAULT_PUBLIC_HOSTS = ${JSON.stringify(injectedHosts)};`
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
    if (result.status !== 0) process.exitCode = result.status ?? 1;
    else {
        const { readdir } = await import("node:fs/promises");
        const dist = join(root, "dist");
        const files = await readdir(dist);
        for (const file of files) {
            if (file.endsWith(".pbiviz") && !/-(?:core|maps)(?:-|\.pbiviz$)/.test(file)) {
                const source = join(dist, file);
                const target = join(dist, file.replace(".pbiviz", `-${profile}.pbiviz`));
                await copyFile(source, target);
            }
        }
    }
} finally {
    await writeFile(capabilitiesPath, originalCapabilities);
    await writeFile(buildPath, originalBuild);
    if (originalHostPolicy) await writeFile(hostPolicyPath, originalHostPolicy);
}
