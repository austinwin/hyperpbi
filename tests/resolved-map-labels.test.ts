import { beforeEach, describe, expect, it, vi } from "vitest";

const leaflet = vi.hoisted(() => {
    const markers: Array<{ position: [number, number]; options: Record<string, unknown> }> = [];
    class Group {
        layers: unknown[] = [];
        addLayer(layer: unknown) { this.layers.push(layer); return this; }
        addTo(map: MapRuntime) { map.addLayer(this); return this; }
        clearLayers() { this.layers = []; }
    }
    class MapRuntime {
        zoom = 10; layers = new Set<unknown>(); listeners = new Map<string, Set<() => void>>();
        getZoom() { return this.zoom; }
        hasLayer(layer: unknown) { return this.layers.has(layer); }
        addLayer(layer: unknown) { this.layers.add(layer); }
        removeLayer(layer: unknown) { this.layers.delete(layer); }
        on(name: string, handler: () => void) { const set = this.listeners.get(name) ?? new Set(); set.add(handler); this.listeners.set(name, set); }
        off(name: string, handler: () => void) { this.listeners.get(name)?.delete(handler); }
        emit(name: string) { for (const handler of this.listeners.get(name) ?? []) handler(); }
    }
    const layerGroup = vi.fn(() => new Group());
    const marker = vi.fn((position: [number, number], options: Record<string, unknown>) => { const value = { position, options }; markers.push(value); return value; });
    const divIcon = vi.fn((options: Record<string, unknown>) => options);
    const geoJSON = vi.fn(() => ({ getBounds: () => ({ isValid: () => true, getCenter: () => ({ lat: 5, lng: 6 }) }) }));
    return { markers, Group, MapRuntime, layerGroup, marker, divIcon, geoJSON };
});

vi.mock("leaflet", () => ({ layerGroup: leaflet.layerGroup, marker: leaflet.marker, divIcon: leaflet.divIcon, geoJSON: leaflet.geoJSON }));

import { createResolvedMapLabels } from "../src/components/maps/ResolvedMapLabels";
import type { ResolvedMapFeature, ResolvedMapLayer } from "../src/maps/model/resolvedMapTypes";

function feature(id: string, geometry: GeoJSON.GeoJsonObject | null, lat: number | null = null, lon: number | null = null): ResolvedMapFeature {
    return { id, layerId: "labels", geometryType: "point", geometry, lat, lon, serviceAttributes: { NAME: id }, powerBiAttributes: {}, powerBiRowIndices: [], powerBiRowKeys: [], joinedAttributes: {}, selected: false };
}

function layer(features: ResolvedMapFeature[], overrides: Partial<NonNullable<ResolvedMapLayer["labels"]>> = {}): ResolvedMapLayer {
    return { id: "labels", name: "Labels", sourceType: "arcgisFeature", geometryType: "point", visible: true, opacity: 1, order: 1, features, renderer: { type: "simple", symbol: {} }, labels: { enabled: true, field: "NAME", fieldSource: "service", placement: "above", color: "#123456", size: 14, weight: 600, haloColor: "white", haloSize: 2, collision: "none", ...overrides }, diagnostics: { featureCount: features.length, requestCount: 1, loading: false, sourceType: "arcgisFeature", geometryType: "point", usedServiceSymbology: false, usedServiceLabels: false, warnings: [] }, loading: false };
}

beforeEach(() => { leaflet.markers.length = 0; leaflet.layerGroup.mockClear(); leaflet.marker.mockClear(); leaflet.divIcon.mockClear(); leaflet.geoJSON.mockClear(); });

describe("ResolvedMapLabels", () => {
    it("supports zero coordinates and all practical GeoJSON geometry families without defaulting missing geometry to zero", () => {
        const features = [
            feature("zero", null, 0, 0),
            feature("point", { type: "Point", coordinates: [1, 2] } as GeoJSON.Point),
            feature("multi", { type: "MultiPoint", coordinates: [[1, 2], [3, 4]] } as GeoJSON.MultiPoint),
            feature("line", { type: "LineString", coordinates: [[1, 2], [3, 4]] } as GeoJSON.LineString),
            feature("multiline", { type: "MultiLineString", coordinates: [[[1, 2], [3, 4]], [[5, 6]]] } as GeoJSON.MultiLineString),
            feature("polygon", { type: "Polygon", coordinates: [[[0, 0], [1, 0], [0, 0]]] } as GeoJSON.Polygon),
            feature("multipolygon", { type: "MultiPolygon", coordinates: [[[[0, 0], [1, 0], [0, 0]]]] } as GeoJSON.MultiPolygon),
            feature("missing", null),
        ];
        const map = new leaflet.MapRuntime();
        createResolvedMapLabels(map as never, layer(features), { pane: "labels-pane", visible: true });
        expect(leaflet.markers).toHaveLength(7);
        expect(leaflet.markers[0].position).toEqual([0, 0]);
        expect(leaflet.markers.map(marker => marker.position)).not.toContainEqual([0, 0, 0]);
    });

    it("resolves templates, styles, placement, and maxLabels", () => {
        const map = new leaflet.MapRuntime();
        createResolvedMapLabels(map as never, layer([feature("A", null, 1, 2), feature("B", null, 3, 4)], { template: "Asset {{NAME}}", maxLabels: 1, placement: "right" }), { pane: "labels-pane", visible: true });
        expect(leaflet.markers).toHaveLength(1);
        const icon = leaflet.divIcon.mock.calls[0][0] as Record<string, unknown>;
        expect(String(icon.html)).toContain("Asset A");
        expect(String(icon.html)).toContain("rgb(18, 52, 86)");
        expect(icon.iconAnchor).toEqual([12, 0]);
    });

    it("adds/removes the group for zoom limits and fully cleans up", () => {
        const map = new leaflet.MapRuntime(); map.zoom = 4;
        const runtime = createResolvedMapLabels(map as never, layer([feature("A", null, 1, 2)], { minZoom: 5, maxZoom: 10, collision: "hideOverlaps" }), { pane: "labels-pane", visible: true });
        expect(map.hasLayer(runtime.group)).toBe(false);
        expect(runtime.warnings[0]).toMatch(/hideOverlaps/);
        map.zoom = 6; map.emit("zoomend");
        expect(map.hasLayer(runtime.group)).toBe(true);
        map.zoom = 11; map.emit("zoomend");
        expect(map.hasLayer(runtime.group)).toBe(false);
        runtime.cleanup();
        expect((runtime.group as unknown as { layers: unknown[] }).layers).toHaveLength(0);
        expect(map.listeners.get("zoomend")?.size ?? 0).toBe(0);
    });
});
