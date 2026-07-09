// ── Map Source Resolver Tests ─────────────────────────────────────────
import { describe, it, expect } from "vitest";
import { resolvePowerBiLayer, type MapSourceContext } from "../src/maps/sources/mapSourceResolver";
import type { MapLayerDefinition } from "../src/schema/mapSchema";

function makeContext(rows: any[], fieldKeys: string[]): MapSourceContext {
    const fields: Record<string, any> = {};
    for (const key of fieldKeys) {
        fields[key] = { key, displayName: key, type: "dimension", roles: [] };
    }
    return {
        rows,
        rowIndices: rows.map((_, i) => i),
        rowKeys: rows.map((_, i) => `source-key-${i}`),
        fields,
        runtimeBindings: {},
        geocodeCache: {},
    };
}

describe("Map Source Resolver", () => {
    describe("resolvePowerBiLayer", () => {
        it("resolves lat/lon point features", () => {
            const rows = [
                { lat: 29.7, lon: -95.3, name: "Houston" },
            ];
            const context = makeContext(rows, ["lat", "lon", "name"]);
            const layer: MapLayerDefinition = {
                id: "test",
                name: "Test Layer",
                source: {
                    type: "powerbi",
                    bindings: { latitude: "lat", longitude: "lon" },
                },
            };

            const result = resolvePowerBiLayer(layer, context);
            expect(result.features).toHaveLength(1);
            expect(result.features[0].lat).toBe(29.7);
            expect(result.features[0].lon).toBe(-95.3);
            expect(result.features[0].geometryType).toBe("point");
            expect(result.sourceType).toBe("powerbi");
        });

        it("preserves source row indices", () => {
            const rows = [
                { lat: 29.7, lon: -95.3, name: "A" },
                { lat: 30.0, lon: -96.0, name: "B" },
            ];
            const context = makeContext(rows, ["lat", "lon", "name"]);
            const layer: MapLayerDefinition = {
                id: "test",
                name: "Test",
                source: { type: "powerbi", bindings: { latitude: "lat", longitude: "lon" } },
            };

            const result = resolvePowerBiLayer(layer, context);
            expect(result.features[0].powerBiRowIndices).toEqual([0]);
            expect(result.features[1].powerBiRowIndices).toEqual([1]);
        });

        it("preserves source row keys", () => {
            const rows = [{ lat: 29.7, lon: -95.3 }];
            const context = makeContext(rows, ["lat", "lon"]);
            const layer: MapLayerDefinition = {
                id: "test",
                name: "Test",
                source: { type: "powerbi", bindings: { latitude: "lat", longitude: "lon" } },
            };

            const result = resolvePowerBiLayer(layer, context);
            expect(result.features[0].powerBiRowKeys).toEqual(["source-key-0"]);
            expect(result.features[0].rowKey).toBe("source-key-0");
        });

        it("resolves with geometry field", () => {
            const rows = [
                { geometry: JSON.stringify({ type: "Point", coordinates: [-95.3, 29.7] }), name: "G" },
            ];
            const context = makeContext(rows, ["geometry", "name"]);
            const layer: MapLayerDefinition = {
                id: "test",
                name: "Test",
                source: { type: "powerbi", bindings: { geometry: "geometry" } },
            };

            const result = resolvePowerBiLayer(layer, context);
            expect(result.features).toHaveLength(1);
            expect(result.features[0].geometry).not.toBeNull();
            expect(result.features[0].geometryType).toBe("point");
        });

        it("returns empty layer for invalid data", () => {
            const rows: any[] = [];
            const context = makeContext(rows, []);
            const layer: MapLayerDefinition = {
                id: "test",
                name: "Test",
                source: { type: "powerbi", bindings: {} },
            };

            const result = resolvePowerBiLayer(layer, context);
            expect(result.features).toHaveLength(0);
        });

        it("includes configured renderer, labels, popup", () => {
            const rows = [{ lat: 29.7, lon: -95.3 }];
            const context = makeContext(rows, ["lat", "lon"]);
            const layer: MapLayerDefinition = {
                id: "test",
                name: "Test",
                source: { type: "powerbi", bindings: { latitude: "lat", longitude: "lon" } },
                renderer: { type: "simple", symbol: { color: "#ff0000" } } as any,
                labels: { enabled: true, field: "lat", placement: "center", color: "#333", size: 12, weight: "normal" } as any,
                popup: { enabled: true, title: "Point {{name}}", fields: [{ field: "lat", fieldSource: "powerbi", display: "number" }] } as any,
            };

            const result = resolvePowerBiLayer(layer, context);
            expect(result.renderer.type).toBe("simple");
            expect(result.labels?.enabled).toBe(true);
            expect(result.popup?.enabled).toBe(true);
            expect(result.popup?.title).toBe("Point {{name}}");
        });
    });
});
