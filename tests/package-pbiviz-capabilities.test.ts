import { describe, expect, it } from "vitest";
import { readdir } from "node:fs/promises";
import { resolve } from "node:path";
import {
    buildWebAccessParameters,
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
        expect(webAccessParameters(capabilities)).toEqual(["https://*"]);
    });
});

describe("package profile host helpers", () => {
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

    it("builds Core, broad Maps, and restricted Maps privilege parameters", () => {
        expect(buildWebAccessParameters({ profile: "core", allowAllHosts: false })).toEqual([]);
        expect(buildWebAccessParameters({ profile: "maps", allowAllHosts: true })).toEqual(["https://*"]);
        const restricted = buildWebAccessParameters({ profile: "maps", allowAllHosts: false, configuredHosts: ["https://example.com"] });
        expect(restricted).toContain("https://tile.openstreetmap.org");
        expect(restricted).toContain("https://*.arcgis.com");
        expect(restricted).toContain("https://example.com");
        expect(restricted).not.toContain("https://*");
    });
});
