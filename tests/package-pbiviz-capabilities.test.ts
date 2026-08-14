import { describe, expect, it } from "vitest";
import { mkdtemp, readdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { resolve } from "node:path";
import {
    buildWebAccessParameters,
    acquirePackageProfileLock,
    normalizeMapHostPattern,
    parseMapHostPatterns,
    readPackagedCapabilities,
    webAccessParameters,
} from "../scripts/package-profile-utils.mjs";

async function archive(suffix: string) {
    const dist = resolve(__dirname, "..", "dist");
    const files = await readdir(dist);
    const file = files.find(name => name.endsWith(suffix));
    if (!file) throw new Error(`Missing committed PBIVIZ fixture ending in ${suffix}`);
    return resolve(dist, file);
}

describe("packaged PBIVIZ capabilities", () => {
    it("opens the real Core PBIVIZ ZIP and reads its packaged capabilities payload", async () => {
        const capabilities = await readPackagedCapabilities(await archive("-core.pbiviz"));
        expect(capabilities).toHaveProperty("dataRoles");
        expect(capabilities.dataRoles).toEqual([{ displayName: "Values", name: "values", kind: "GroupingOrMeasure" }]);
        expect(webAccessParameters(capabilities)).toBeNull();
    });

    it("opens the real Maps PBIVIZ ZIP and reads configured WebAccess from the archive", async () => {
        const capabilities = await readPackagedCapabilities(await archive("-maps.pbiviz"));
        expect(capabilities.dataRoles).toEqual([{ displayName: "Values", name: "values", kind: "GroupingOrMeasure" }]);
        expect(webAccessParameters(capabilities)).toEqual(expect.arrayContaining([
            "https://tile.openstreetmap.org",
            "https://nominatim.openstreetmap.org",
            "https://geocode-api.arcgis.com",
            "https://*.arcgis.com",
            "https://*.arcgisonline.com",
        ]));
        expect(webAccessParameters(capabilities)).not.toContain("https://*");
    });
});

describe("package profile host helpers", () => {
    it("serializes concurrent package profiles that share workspace files", async () => {
        const directory = await mkdtemp(resolve(tmpdir(), "hyperpbi-package-lock-"));
        const lockPath = resolve(directory, "profile.lock");
        try {
            const releaseFirst = await acquirePackageProfileLock(lockPath, { pollMs: 5, timeoutMs: 1_000 });
            let secondAcquired = false;
            const second = acquirePackageProfileLock(lockPath, { pollMs: 5, timeoutMs: 1_000 })
                .then(release => { secondAcquired = true; return release; });
            await new Promise(resolveDelay => setTimeout(resolveDelay, 25));
            expect(secondAcquired).toBe(false);
            await releaseFirst();
            const releaseSecond = await second;
            expect(secondAcquired).toBe(true);
            await releaseSecond();
        } finally {
            await rm(directory, { recursive: true, force: true });
        }
    });

    it("keeps a long-running package lock fresh until its owner releases it", async () => {
        const directory = await mkdtemp(resolve(tmpdir(), "hyperpbi-package-heartbeat-"));
        const lockPath = resolve(directory, "profile.lock");
        try {
            const release = await acquirePackageProfileLock(lockPath, {
                pollMs: 5,
                staleMs: 30,
                timeoutMs: 1_000,
            });
            await new Promise(resolveDelay => setTimeout(resolveDelay, 70));
            await expect(acquirePackageProfileLock(lockPath, {
                pollMs: 5,
                staleMs: 30,
                timeoutMs: 30,
            })).rejects.toThrow("Timed out waiting for package profile lock");
            await release();
            const releaseNext = await acquirePackageProfileLock(lockPath, {
                pollMs: 5,
                staleMs: 30,
                timeoutMs: 1_000,
            });
            await releaseNext();
        } finally {
            await rm(directory, { recursive: true, force: true });
        }
    });

    it("normalizes exact and subdomain hosts and deduplicates configured values", () => {
        expect(normalizeMapHostPattern(" HTTPS://Example.COM ")).toBe("https://example.com");
        expect(parseMapHostPatterns("https://*.houstontx.gov, https://example.com,https://example.com"))
            .toEqual(["https://*.houstontx.gov", "https://example.com"]);
    });

    it("rejects HTTP, credentials, query, hash, path, and restricted broad patterns", () => {
        const invalid = [
            // eslint-disable-next-line powerbi-visuals/no-http-string
            "http://example.com", "https://user:pass@example.com", "https://example.com?q=1",
            "https://example.com#hash", "https://example.com/path", "https://*",
        ];
        for (const pattern of invalid) expect(() => normalizeMapHostPattern(pattern)).toThrow();
    });

    it("builds Core and Maps privilege parameters without unsupported all-host wildcards", () => {
        expect(buildWebAccessParameters({ profile: "core" })).toEqual([]);
        const broad = buildWebAccessParameters({ profile: "maps" });
        expect(broad).toContain("https://hyperpbi.com");
        expect(broad).toContain("https://web.geolibre.app");
        expect(broad).toContain("https://tile.openstreetmap.org");
        expect(broad).toContain("https://*.arcgis.com");
        expect(broad).not.toContain("https://*");
        const restricted = buildWebAccessParameters({ profile: "maps", configuredHosts: ["https://example.com"] });
        expect(restricted).toContain("https://tile.openstreetmap.org");
        expect(restricted).toContain("https://*.arcgis.com");
        expect(restricted).toContain("https://example.com");
        expect(restricted).not.toContain("https://*");
    });
});
