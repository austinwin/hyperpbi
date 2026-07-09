// ── ArcGIS Host Policy Tests ──────────────────────────────────────────
import { describe, it, expect, beforeEach } from "vitest";
import { checkHostPolicy, setAllowedHostPatterns } from "../src/maps/arcgis/arcGisHostPolicy";

describe("ArcGIS Host Policy", () => {
    beforeEach(() => {
        setAllowedHostPatterns([]);
    });

    describe("exact host matching", () => {
        it("allows exact HTTPS host match", () => {
            setAllowedHostPatterns(["https://example.com"]);
            const result = checkHostPolicy("https://example.com/arcgis/rest/services/Test/MapServer");
            expect(result.allowed).toBe(true);
            expect(result.matchedPattern).toBe("https://example.com");
        });

        it("rejects non-matching host", () => {
            setAllowedHostPatterns(["https://example.com"]);
            const result = checkHostPolicy("https://other.com/arcgis/rest/services/Test/MapServer");
            expect(result.allowed).toBe(false);
        });

        it("rejects HTTP URLs even when host matches", () => {
            setAllowedHostPatterns(["https://example.com"]);
            // eslint-disable-next-line powerbi-visuals/no-http-string
            const result = checkHostPolicy("http://example.com/arcgis/rest/services/Test/MapServer");
            expect(result.allowed).toBe(false);
            expect(result.reason).toContain("HTTPS");
        });
    });

    describe("wildcard subdomain matching", () => {
        it("allows subdomain wildcard match", () => {
            setAllowedHostPatterns(["https://*.houstontx.gov"]);
            const result = checkHostPolicy("https://geogimstest.houstontx.gov/arcgis/rest/services/HW/MapServer/9");
            expect(result.allowed).toBe(true);
        });

        it("allows base domain with wildcard", () => {
            setAllowedHostPatterns(["https://*.arcgis.com"]);
            const result = checkHostPolicy("https://services.arcgis.com/rest/services");
            expect(result.allowed).toBe(true);
        });

        it("allows root domain with wildcard", () => {
            setAllowedHostPatterns(["https://*.arcgis.com"]);
            const result = checkHostPolicy("https://arcgis.com/rest/services");
            expect(result.allowed).toBe(true);
        });
    });

    describe("universal wildcard", () => {
        it("allows any HTTPS host with https://*", () => {
            setAllowedHostPatterns(["https://*"]);
            expect(checkHostPolicy("https://geogimstest.houstontx.gov/arcgis/rest").allowed).toBe(true);
            expect(checkHostPolicy("https://services.arcgis.com/rest").allowed).toBe(true);
            expect(checkHostPolicy("https://example.com/arcgis").allowed).toBe(true);
            expect(checkHostPolicy("https://maps.example.org/server").allowed).toBe(true);
            expect(checkHostPolicy("https://localhost:6443/arcgis").allowed).toBe(true);
            expect(checkHostPolicy("https://192.168.1.1/arcgis").allowed).toBe(true);
        });

        it("rejects HTTP even with universal wildcard", () => {
            setAllowedHostPatterns(["https://*"]);
            // eslint-disable-next-line powerbi-visuals/no-http-string
            const result = checkHostPolicy("http://example.com/arcgis");
            expect(result.allowed).toBe(false);
        });

        it("allows with bare * sentinel", () => {
            setAllowedHostPatterns(["*"]);
            expect(checkHostPolicy("https://any-host.example.com/arcgis").allowed).toBe(true);
        });
    });

    describe("embedded credentials", () => {
        it("rejects URLs with embedded credentials", () => {
            setAllowedHostPatterns(["https://*"]);
            const result = checkHostPolicy("https://user:pass@example.com/arcgis");
            expect(result.allowed).toBe(false);
            expect(result.reason).toContain("credentials");
        });
    });

    describe("restricted mode", () => {
        it("rejects unlisted host in restricted mode", () => {
            setAllowedHostPatterns(["https://*.houstontx.gov", "https://example.com"]);
            const result = checkHostPolicy("https://unlisted.com/arcgis");
            expect(result.allowed).toBe(false);
        });

        it("allows listed host in restricted mode", () => {
            setAllowedHostPatterns(["https://*.houstontx.gov", "https://example.com"]);
            expect(checkHostPolicy("https://example.com/arcgis").allowed).toBe(true);
            expect(checkHostPolicy("https://sub.houstontx.gov/arcgis").allowed).toBe(true);
        });
    });

    describe("non-HTTPS schemes", () => {
        it("rejects javascript: URLs", () => {
            const result = checkHostPolicy("javascript:alert(1)");
            expect(result.allowed).toBe(false);
        });

        it("rejects data: URLs", () => {
            const result = checkHostPolicy("data:text/html,<script>alert(1)</script>");
            expect(result.allowed).toBe(false);
        });

        it("rejects file: URLs", () => {
            const result = checkHostPolicy("file:///etc/passwd");
            expect(result.allowed).toBe(false);
        });
    });

    describe("default ArcGIS hosts", () => {
        it("allows default arcgis.com hosts", () => {
            // Default hosts are loaded at module init; test without resetting
            const result = checkHostPolicy("https://services.arcgis.com/rest/services/Test/FeatureServer");
            expect(result.allowed).toBe(true);
        });

        it("allows default arcgisonline.com hosts", () => {
            const result = checkHostPolicy("https://services.arcgisonline.com/arcgis/rest/services/Test/MapServer");
            expect(result.allowed).toBe(true);
        });
    });
});
