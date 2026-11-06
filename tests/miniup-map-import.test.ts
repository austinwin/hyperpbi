import { describe, expect, it, vi } from "vitest";
import fixture from "../examples/map/miniup-published-map.json";
import { parseMiniUpManifest, publicMapUrl } from "../src/maps/miniup/miniupManifest";
import { importMiniUpMap } from "../src/maps/miniup/miniupImport";
import { exportMiniUpManifest, loadMiniUpManifest } from "../src/maps/miniup/miniupSourceAdapter";
import { validateSchema } from "../src/schema/validateSchema";
import type { MapComponent } from "../src/schema/hyperpbiSchema";

const current: MapComponent = { type: "map", id: "operations", layers: [{ id: "analytics", name: "Power BI", source: { type: "powerbi", bindings: { latitude: "lat", longitude: "lon" } } }] };
const url = "https://published.miniup.app/map.hyperpbi.json";
describe("portable MiniUp maps", () => {
    it("validates a real multi-layer fixture and round-trips native configuration", () => {
        const { manifest } = parseMiniUpManifest(fixture);
        const result = importMiniUpMap(current, manifest, { mode: "snapshot" });
        expect(result.map.layers).toHaveLength(3);
        expect(result.map.layers?.[1].source.type).toBe("geoJson");
        expect(result.map.layers?.[1].provenance?.fields?.[0].name).toBe("site_id");
        expect(result.map.layers?.[2].opacity).toBe(0.45);
        expect(result.map.layers?.[2].groupId).toBe(result.map.layerGroups?.[0].id);
        expect(validateSchema({ version: "2.0", components: [JSON.parse(JSON.stringify(result.map))] }).errors).toEqual([]);
        expect(current.layers).toHaveLength(1);
    });
    it("refreshes linked layers with a three-way merge preserving nested styles, joins, visibility, order and local deletions", () => {
        const { manifest } = parseMiniUpManifest(fixture);
        const imported = importMiniUpMap(current, manifest, { mode: "linked", manifestUrl: url }).map;
        const first = imported.layers![1];
        first.visible = false; first.order = 42;
        first.renderer = { type: "simple", symbol: { color: "#f00", radius: 8 } };
        first.join = { enabled: true, serviceField: "site_id", powerBiField: "code" };
        imported.layers = imported.layers!.filter(layer => layer !== imported.layers![2]);
        const updated = structuredClone(manifest); updated.version = "2"; updated.layers[0].name = "Updated facilities";
        updated.layers[0].renderer = { type: "simple", symbol: { color: "#00f", radius: 12 } };
        const refreshed = importMiniUpMap(imported, updated, { mode: "linked", manifestUrl: url, refreshId: imported.imports![0].id }).map;
        expect(refreshed.layers).toHaveLength(2);
        expect(refreshed.layers![1]).toMatchObject({ id: first.id, name: "Updated facilities", visible: false, order: 42, join: first.join, renderer: { symbol: { color: "#f00", radius: 12 } }, provenance: { mapVersion: "2" } });
        expect(refreshed.layers![0].id).toBe("analytics");
    });
    it("supports multiple imports without colliding with existing layer IDs", () => {
        const { manifest } = parseMiniUpManifest(fixture);
        const a = importMiniUpMap(current, manifest, { mode: "snapshot" }).map;
        const b = importMiniUpMap(a, manifest, { mode: "snapshot" }).map;
        expect(new Set(b.layers?.map(layer => layer.id)).size).toBe(5);
    });
    it.each(["https://a.miniup.app/map.json?token=secret", "https://user:password@a.miniup.app/map.json", "javascript:alert(1)"])("rejects credential-bearing or executable URLs: %s", value => expect(() => publicMapUrl(value)).toThrow());
    it("rejects malformed layers and credentials before changing a dashboard", () => {
        expect(() => parseMiniUpManifest({ ...fixture, layers: [{ ...fixture.layers[0], headers: { Authorization: "secret" } }] })).toThrow(/credentials/);
        expect(() => parseMiniUpManifest({ ...fixture, layers: [fixture.layers[0], fixture.layers[0]] })).toThrow(/unique/);
        expect(() => parseMiniUpManifest({ ...fixture, schemaVersion: "99" })).toThrow(/1.0/);
        expect(() => parseMiniUpManifest({ ...fixture, layers: [{ ...fixture.layers[0], renderer: { type: "madeUp" } }] })).toThrow();
    });
    it("reports unsupported sources without pretending to convert them", () => {
        const result = parseMiniUpManifest({ ...fixture, layers: [...fixture.layers, { id: "unsupported", name: "Raster", source: { type: "cog" } }] });
        expect(result.manifest.layers).toHaveLength(2); expect(result.warnings.join(" ")).toContain("unsupported");
    });
    it("exports an explicit portable definition without executing publisher scripts", () => expect(exportMiniUpManifest(parseMiniUpManifest(fixture).manifest).schemaVersion).toBe("1.0"));
    it("reports unauthorized and HTML resources without changing saved state", async () => {
        const fetch = vi.fn().mockResolvedValueOnce(new Response("", { status: 403 })).mockResolvedValueOnce(new Response("<html>arbitrary map</html>"));
        vi.stubGlobal("fetch", fetch);
        try {
            await expect(loadMiniUpManifest(url, { webAccessAvailable: true })).rejects.toThrow(/unauthorized/);
            await expect(loadMiniUpManifest(url, { webAccessAvailable: true })).rejects.toThrow(/not scraped/);
            expect(fetch.mock.calls[0][1]).toMatchObject({ credentials: "omit", redirect: "error" });
        } finally { vi.unstubAllGlobals(); }
    });
});
