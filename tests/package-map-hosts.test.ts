// ── Package Map Host Tests ───────────────────────────────────────────
import { describe, it, expect, vi } from "vitest";

// We test the host policy module directly for pattern matching
// and also test the packaging script logic where applicable.

describe("ArcGIS Host Policy", () => {
    async function getHostPolicy() {
        return await import("../src/maps/arcgis/arcGisHostPolicy");
    }

    it("allows https://* pattern for any HTTPS host", async () => {
        const { checkHostPolicy, setAllowedHostPatterns } = await getHostPolicy();
        setAllowedHostPatterns(["https://*"]);
        expect(checkHostPolicy("https://services.arcgis.com/test").allowed).toBe(true);
        expect(checkHostPolicy("https://example.com/arcgis/rest").allowed).toBe(true);
    });

    it("allows wildcard sentinel * for any HTTPS host", async () => {
        const { checkHostPolicy, setAllowedHostPatterns } = await getHostPolicy();
        setAllowedHostPatterns(["*"]);
        expect(checkHostPolicy("https://any-host.example.com/test").allowed).toBe(true);
    });

    it("allows subdomain wildcard pattern", async () => {
        const { checkHostPolicy, setAllowedHostPatterns } = await getHostPolicy();
        setAllowedHostPatterns(["https://*.houstontx.gov"]);
        expect(checkHostPolicy("https://geogimstest.houstontx.gov/path").allowed).toBe(true);
        expect(checkHostPolicy("https://houstontx.gov/path").allowed).toBe(true);
    });

    it("allows exact host match", async () => {
        const { checkHostPolicy, setAllowedHostPatterns } = await getHostPolicy();
        setAllowedHostPatterns(["https://example.com"]);
        expect(checkHostPolicy("https://example.com/path").allowed).toBe(true);
        expect(checkHostPolicy("https://other.example.com/path").allowed).toBe(false);
    });

    it("rejects HTTP URLs", async () => {
        const { checkHostPolicy, setAllowedHostPatterns } = await getHostPolicy();
        setAllowedHostPatterns(["https://*"]);
        // eslint-disable-next-line powerbi-visuals/no-http-string
        const result = checkHostPolicy("http://example.com/test");
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain("HTTPS");
    });

    it("rejects URLs with embedded credentials", async () => {
        const { checkHostPolicy, setAllowedHostPatterns } = await getHostPolicy();
        setAllowedHostPatterns(["https://*"]);
        const result = checkHostPolicy("https://user:pass@example.com/test");
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain("credentials");
    });

    it("rejects unlisted hosts", async () => {
        const { checkHostPolicy, setAllowedHostPatterns } = await getHostPolicy();
        setAllowedHostPatterns(["https://allowed-only.example.com"]);
        const result = checkHostPolicy("https://not-allowed.example.com/test");
        expect(result.allowed).toBe(false);
        expect(result.reason).toContain("not in the allowed list");
    });

    it("default patterns allow arcgis.com and arcgisonline.com", async () => {
        // Re-import to get defaults
        vi.resetModules();
        const { checkHostPolicy } = await import("../src/maps/arcgis/arcGisHostPolicy");
        expect(checkHostPolicy("https://services.arcgis.com/test").allowed).toBe(true);
        expect(checkHostPolicy("https://tiles.arcgisonline.com/test").allowed).toBe(true);
    });

    it("returns matched pattern in result", async () => {
        const { checkHostPolicy, setAllowedHostPatterns } = await getHostPolicy();
        setAllowedHostPatterns(["https://*.myorg.com"]);
        const result = checkHostPolicy("https://gis.myorg.com/path");
        expect(result.allowed).toBe(true);
        expect(result.matchedPattern).toBe("https://*.myorg.com");
    });

    it("handles invalid URL gracefully", async () => {
        const { checkHostPolicy, setAllowedHostPatterns } = await getHostPolicy();
        setAllowedHostPatterns(["https://*"]);
        const result = checkHostPolicy("not-a-url");
        expect(result.allowed).toBe(false);
    });
});
