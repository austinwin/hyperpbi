import { h, render } from "preact";
import { act } from "preact/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
    class Bounds {
        points: Array<[number, number]> = [];
        extend(value: unknown) {
            if (value instanceof Bounds) this.points.push(...value.points);
            else if (Array.isArray(value) && typeof value[0] === "number") this.points.push(value as [number, number]);
            return this;
        }
        isValid() { return this.points.length > 0; }
        pad() { return this; }
        getCenter() { const point = this.points[0] ?? [0, 0]; return { lat: point[0], lng: point[1] }; }
        getSouthWest() { const point = this.points[0] ?? [0, 0]; return { lat: point[0], lng: point[1], equals: (other: { lat: number; lng: number }) => point[0] === other.lat && point[1] === other.lng }; }
        getNorthEast() { const point = this.points.at(-1) ?? [0, 0]; return { lat: point[0], lng: point[1] }; }
        getWest() { return -96; } getSouth() { return 29; } getEast() { return -94; } getNorth() { return 31; }
    }

    class Layer {
        listeners = new Map<string, Set<(event?: unknown) => void>>();
        options: Record<string, unknown>;
        popup: unknown;
        tooltip: unknown;
        layers: Layer[] = [];
        removed = false;
        constructor(options: Record<string, unknown> = {}) { this.options = options; }
        addTo(map: MapRuntime) { map.addLayer(this); return this; }
        addLayer(layer: Layer) { this.layers.push(layer); return this; }
        clearLayers() { this.layers = []; return this; }
        on(name: string, handler: (event?: unknown) => void) { const set = this.listeners.get(name) ?? new Set(); set.add(handler); this.listeners.set(name, set); return this; }
        off(name: string, handler: (event?: unknown) => void) { this.listeners.get(name)?.delete(handler); return this; }
        fire(name: string, event: unknown = {}) { for (const handler of this.listeners.get(name) ?? []) handler(event); }
        bindTooltip(content: unknown) { this.tooltip = content; return this; }
        bindPopup(content: unknown) { this.popup = content; return this; }
        setStyle(style: Record<string, unknown>) { Object.assign(this.options, style); return this; }
        setRadius(radius: number) { this.options.radius = radius; return this; }
        getBounds() { const bounds = new Bounds(); bounds.extend([29, -95]); return bounds; }
    }

    class Tile extends Layer {
        url: string;
        opacity: number;
        constructor(url: string, options: Record<string, unknown>) { super(options); this.url = url; this.opacity = Number(options.opacity ?? 1); }
        setOpacity(value: number) { this.opacity = value; return this; }
    }

    class MapRuntime {
        listeners = new Map<string, Set<() => void>>();
        layers = new Set<Layer>();
        panes = new Map<string, { style: { zIndex: string } }>();
        center: [number, number] = [0, 0];
        zoom = 2;
        setViewCalls: Array<{ center: [number, number]; zoom: number }> = [];
        fitBoundsCalls: unknown[] = [];
        minZoomCalls: number[] = [];
        maxZoomCalls: number[] = [];
        invalidateSizeCalls = 0;
        removed = false;
        setView(center: [number, number], zoom: number) { const changed = this.center[0] !== center[0] || this.center[1] !== center[1] || this.zoom !== zoom; this.center = center; this.zoom = zoom; this.setViewCalls.push({ center, zoom }); if (changed) this.emit("moveend"); return this; }
        fitBounds(bounds: unknown) { this.fitBoundsCalls.push(bounds); this.center = [29, -95]; this.zoom = 12; this.emit("moveend"); return this; }
        getCenter() { const current = this.center; return { lat: current[0], lng: current[1], equals: (other: { lat: number; lng: number }) => current[0] === other.lat && current[1] === other.lng }; }
        getZoom() { return this.zoom; }
        setMinZoom(value: number) { this.minZoomCalls.push(value); return this; }
        setMaxZoom(value: number) { this.maxZoomCalls.push(value); return this; }
        getBounds() { return new Bounds(); }
        getSize() { return { x: 800, y: 600 }; }
        on(name: string, handler: () => void) { const set = this.listeners.get(name) ?? new Set(); set.add(handler); this.listeners.set(name, set); return this; }
        off(name: string, handler: () => void) { this.listeners.get(name)?.delete(handler); return this; }
        emit(name: string) { for (const handler of this.listeners.get(name) ?? []) handler(); }
        addLayer(layer: Layer) { this.layers.add(layer); return this; }
        removeLayer(layer: Layer) { this.layers.delete(layer); layer.removed = true; const onRemove = (layer as unknown as { onRemove?: (map: MapRuntime) => void }).onRemove; onRemove?.(this); return this; }
        hasLayer(layer: Layer) { return this.layers.has(layer); }
        createPane(name: string) { const pane = { style: { zIndex: "" } }; this.panes.set(name, pane); return pane; }
        getPane(name: string) { return this.panes.get(name); }
        invalidateSize() { this.invalidateSizeCalls += 1; return this; }
        remove() { this.removed = true; }
    }

    const maps: MapRuntime[] = [];
    const tiles: Tile[] = [];
    const circles: Layer[] = [];
    const geoLayers: Layer[] = [];
    const dynamicLayers: Array<Layer & { opacity: number; setOpacity(value: number): unknown }> = [];
    const labelCleanups: ReturnType<typeof vi.fn>[] = [];

    const map = vi.fn(() => { const runtime = new MapRuntime(); maps.push(runtime); return runtime; });
    const tileLayer = vi.fn((url: string, options: Record<string, unknown>) => { const tile = new Tile(url, options); tiles.push(tile); return tile; });
    const circleMarker = vi.fn((_position: unknown, options: Record<string, unknown>) => { const layer = new Layer(options); circles.push(layer); return layer; });
    const geoJSON = vi.fn((_geometry: unknown, options: Record<string, unknown> = {}) => { const layer = new Layer(options); geoLayers.push(layer); return layer; });
    const featureGroup = vi.fn(() => new Layer());
    const layerGroup = vi.fn(() => new Layer());
    const markerClusterGroup = vi.fn(() => new Layer());
    const marker = vi.fn((_position: unknown, options: Record<string, unknown>) => new Layer(options));
    const divIcon = vi.fn((options: Record<string, unknown>) => options);
    const latLngBounds = vi.fn(() => new Bounds());

    const createDynamic = vi.fn((options: Record<string, unknown>, state: (value: { loading: boolean; error?: string }) => void) => {
        const layer = new Layer(options) as Layer & { opacity: number; setOpacity(value: number): unknown };
        layer.opacity = Number(options.opacity ?? 1);
        layer.setOpacity = vi.fn((value: number) => { layer.opacity = value; return layer; });
        (layer as unknown as { emitState: typeof state }).emitState = state;
        dynamicLayers.push(layer);
        return layer;
    });
    const createLabels = vi.fn((mapRuntime: MapRuntime, _layer: unknown, options: { visible: boolean }) => {
        const group = new Layer(); if (options.visible) group.addTo(mapRuntime);
        const cleanup = vi.fn(() => mapRuntime.removeLayer(group)); labelCleanups.push(cleanup);
        return { group, cleanup, warnings: ["label warning"] };
    });

    const externalAccess = { allowed: true, reason: "Access denied" };
    return { Bounds, Layer, Tile, MapRuntime, maps, tiles, circles, geoLayers, dynamicLayers, labelCleanups, externalAccess,
        map, tileLayer, circleMarker, geoJSON, featureGroup, layerGroup, markerClusterGroup, marker, divIcon, latLngBounds,
        createDynamic, createLabels };
});

vi.mock("leaflet", () => ({
    map: mocks.map, tileLayer: mocks.tileLayer, circleMarker: mocks.circleMarker, geoJSON: mocks.geoJSON,
    featureGroup: mocks.featureGroup, layerGroup: mocks.layerGroup, markerClusterGroup: mocks.markerClusterGroup,
    marker: mocks.marker, divIcon: mocks.divIcon, latLngBounds: mocks.latLngBounds,
}));
vi.mock("leaflet.markercluster", () => ({}));
vi.mock("../src/providers/providerPolicy", () => ({
    resolveProviderPolicy: () => ({ externalAvailable: true, certificationSafe: false, tilesAllowed: true, geocoderAllowed: false, warnings: [] }),
    externalServiceAccess: () => ({ allowed: mocks.externalAccess.allowed, reason: mocks.externalAccess.reason }),
}));
vi.mock("../src/maps/arcgis/arcGisDynamicLayer", () => ({
    createArcGisDynamicLayer: mocks.createDynamic,
    buildArcGisTileUrl: (url: string) => `${url.replace(/\/$/, "")}/tile/{z}/{y}/{x}`,
}));
vi.mock("../src/components/maps/ResolvedMapLabels", () => ({ createResolvedMapLabels: mocks.createLabels }));

import { LeafletMap, type LeafletMapController } from "../src/components/maps/LeafletMap";
import { calculateAggregates } from "../src/data/aggregations";
import { normalizeMapBindings } from "../src/data/normalizeMapBindings";
import type { DataRow, NormalizedData } from "../src/data/normalizeData";
import { defaultConfig } from "../src/config/hyperpbiConfig";
import { RenderContext, type RenderContextValue } from "../src/render/RenderContext";
import { dashboardReducer, initialDashboardState } from "../src/render/stateStore";
import { toRuntimeSettings, VisualFormattingSettingsModel } from "../src/settings";
import type { MapComponent } from "../src/schema/hyperpbiSchema";
import type { ResolvedMapFeature, ResolvedMapLayer } from "../src/maps/model/resolvedMapTypes";

const resizeCallbacks: Array<() => void> = [];

const rows: DataRow[] = [{ id: "A", value: 10 }, { id: "B", value: 20 }];
const fields: NormalizedData["fields"] = { id: { key: "id", displayName: "ID", type: "dimension", roles: ["values"] }, value: { key: "value", displayName: "Value", type: "measure", roles: ["values"] } };
const data: NormalizedData = { rows, rowKeys: ["row-0", "row-1"], fields, aggregates: calculateAggregates(rows), map: normalizeMapBindings(rows, fields) };

function feature(id: string, overrides: Partial<ResolvedMapFeature> = {}): ResolvedMapFeature {
    return { id, layerId: "features", geometryType: "point", geometry: null, lat: 29, lon: -95, serviceAttributes: { NAME: id }, powerBiAttributes: {}, powerBiRowIndices: [], powerBiRowKeys: [], joinedAttributes: {}, selected: false, ...overrides };
}

function layer(id: string, overrides: Partial<ResolvedMapLayer> = {}): ResolvedMapLayer {
    return { id, name: id, sourceType: "powerbi", geometryType: "point", visible: true, opacity: 1, order: 1,
        features: [feature(`${id}-feature`, { layerId: id })], renderer: { type: "simple", symbol: { color: "#111", fillColor: "#222" } },
        diagnostics: { featureCount: 1, requestCount: 0, loading: false, sourceType: "powerbi", geometryType: "point", usedServiceSymbology: false, usedServiceLabels: false, warnings: [] }, loading: false, ...overrides };
}

function testContext() {
    const dispatchSpy = vi.fn();
    const selectExternal = vi.fn(() => ({ sent: true as const }));
    const executeUiAction = vi.fn(() => ({ success: true as const }));
    const value = { data, rows, sourceRows: rows, sourceRowKeys: data.rowKeys, getRowsForComponent: () => rows, componentRows: () => [], schema: { version: "1.0", components: [] }, settings: toRuntimeSettings(new VisualFormattingSettingsModel()), state: initialDashboardState(), dispatch: (action: Parameters<typeof dashboardReducer>[1]) => { dispatchSpy(action); value.state = dashboardReducer(value.state, action); }, warnings: [], selectExternal, clearExternal: vi.fn(() => ({ sent: true as const })), applyExternalFilter: vi.fn(() => ({ sent: true as const })), clearExternalFilter: vi.fn(() => ({ sent: true as const })), reportInteraction: vi.fn(), config: defaultConfig, webAccessAvailable: true, executeUiAction, isOverlayOpen: () => false } as unknown as RenderContextValue;
    return { value, dispatchSpy, selectExternal, executeUiAction };
}

function renderMap(host: HTMLElement, context: RenderContextValue, component: MapComponent, layers: ResolvedMapLayer[], callbacks: { onControllerReady?: (controller: LeafletMapController) => void; onViewportChange?: (viewport: unknown) => void; onLayerRuntimeStateChange?: (layerId: string, update: unknown) => void } = {}) {
    act(() => render(h(RenderContext.Provider, { value: context }, h(LeafletMap, { component, resolvedLayers: layers, ...callbacks })), host));
}

beforeEach(() => {
    vi.useFakeTimers();
    for (const collection of [mocks.maps, mocks.tiles, mocks.circles, mocks.geoLayers, mocks.dynamicLayers, mocks.labelCleanups]) collection.length = 0;
    for (const fn of [mocks.map, mocks.tileLayer, mocks.circleMarker, mocks.geoJSON, mocks.featureGroup, mocks.markerClusterGroup, mocks.createDynamic, mocks.createLabels]) fn.mockClear();
    mocks.externalAccess.allowed = true;
    resizeCallbacks.length = 0;
    vi.stubGlobal("ResizeObserver", class { constructor(callback: () => void) { resizeCallbacks.push(callback); } observe() {} disconnect() {} });
});
afterEach(() => { vi.useRealTimers(); document.body.replaceChildren(); });

describe("LeafletMap controller and viewport", () => {
    it("fits one data point with setView and multiple points with fitBounds", async () => {
        const singleHost = document.createElement("div");
        const test = testContext();
        renderMap(singleHost, test.value, { type: "map", id: "single", basemap: { type: "none" }, view: { fitMode: "data", minZoom: 2, maxZoom: 16 } }, [layer("single", { features: [feature("one", { layerId: "single", lat: 29.76, lon: -95.37 })] })]);
        await vi.runAllTimersAsync();
        expect(mocks.maps[0].setViewCalls.at(-1)).toEqual({ center: expect.objectContaining({ lat: 29.76, lng: -95.37 }), zoom: 14 });
        expect(mocks.maps[0].fitBoundsCalls).toHaveLength(0);

        const multipleHost = document.createElement("div");
        renderMap(multipleHost, test.value, { type: "map", id: "multiple", basemap: { type: "none" }, view: { fitMode: "data" } }, [layer("multiple", { features: [feature("one", { layerId: "multiple", lat: 29.76, lon: -95.37 }), feature("two", { layerId: "multiple", lat: 32.78, lon: -96.8 })] })]);
        await vi.runAllTimersAsync();
        expect(mocks.maps[1].fitBoundsCalls).toHaveLength(1);
    });

    it("initializes the map once and the controller reads updated component view", async () => {
        const host = document.createElement("div"); const test = testContext(); let controller: LeafletMapController | undefined;
        renderMap(host, test.value, { type: "map", id: "map", view: { center: [10, 20], zoom: 5 } }, [], { onControllerReady: value => { controller = value; } });
        await vi.runAllTimersAsync();
        renderMap(host, test.value, { type: "map", id: "map", view: { center: [30, 40], zoom: 8 } }, []);
        controller!.home();
        expect(mocks.map).toHaveBeenCalledTimes(1);
        expect(mocks.maps[0].setViewCalls.at(-1)).toEqual({ center: [30, 40], zoom: 8 });
    });

    it("Zoom to Selection reads current layers and current row/local selections", async () => {
        const host = document.createElement("div"); const test = testContext(); let controller: LeafletMapController | undefined;
        renderMap(host, test.value, { type: "map", id: "map", view: { fitMode: "none" } }, [], { onControllerReady: value => { controller = value; } });
        await vi.runAllTimersAsync();
        const selected = layer("updated", { features: [feature("selected", { layerId: "updated", lat: null, lon: null, geometry: { type: "Polygon", coordinates: [[[-96, 29], [-94, 29], [-94, 31], [-96, 29]]] }, powerBiRowKeys: ["row-1"] })] });
        test.value.state.componentSelectedRowKeys.map = ["row-1"];
        renderMap(host, test.value, { type: "map", id: "map", view: { fitMode: "none" } }, [selected]);
        controller!.zoomToSelection();
        expect(mocks.maps[0].fitBoundsCalls).toHaveLength(1);

        test.value.state.componentSelectedRowKeys.map = [];
        test.value.state.mapSelectedFeatureIds.map = ["point"];
        renderMap(host, test.value, { type: "map", id: "map", view: { fitMode: "none" } }, [layer("points", { features: [feature("point", { layerId: "points", lat: 30, lon: -96 })] })]);
        controller!.zoomToSelection();
        expect(mocks.maps[0].setViewCalls.at(-1)?.center).toEqual([30, -96]);
    });

    it("emits one initial viewport, emits user moves, and suppresses programmatic Home movement", async () => {
        const host = document.createElement("div"); const test = testContext(); const viewport = vi.fn(); let controller: LeafletMapController | undefined;
        renderMap(host, test.value, { type: "map", id: "map", view: { center: [10, 20], zoom: 5, fitMode: "none" } }, [], { onViewportChange: viewport, onControllerReady: value => { controller = value; } });
        await vi.advanceTimersByTimeAsync(300);
        expect(viewport).toHaveBeenCalledTimes(1);
        mocks.maps[0].emit("moveend");
        await vi.advanceTimersByTimeAsync(300);
        expect(viewport).toHaveBeenCalledTimes(2);
        controller!.home();
        await vi.advanceTimersByTimeAsync(300);
        expect(viewport).toHaveBeenCalledTimes(2);
    });
});

describe("LeafletMap external layer lifecycle", () => {
    it("replaces tile instances for definition edits, reuses unchanged definitions, and preserves the viewport", () => {
        const host = document.createElement("div"); const test = testContext();
        const component: MapComponent = { type: "map", id: "map", basemap: { type: "none" }, view: { fitMode: "none" } };
        const first = layer("tile", { sourceType: "arcgisTile", features: [], tile: { url: "https://tiles.arcgisonline.com/a/MapServer", attribution: "A", minZoom: 2, maxZoom: 16 } });
        renderMap(host, test.value, component, [first]); const runtime = mocks.maps[0];
        runtime.setView([30, 40], 9);
        renderMap(host, test.value, component, [{ ...first, name: "Renamed" }]);
        expect(mocks.tiles).toHaveLength(1);
        const second = { ...first, tile: { ...first.tile!, url: "https://tiles.arcgisonline.com/b/MapServer" } };
        renderMap(host, test.value, component, [second]);
        expect(mocks.tiles).toHaveLength(2); expect(mocks.tiles[0].removed).toBe(true);
        renderMap(host, test.value, component, [{ ...second, tile: { ...second.tile!, attribution: "B" } }]);
        renderMap(host, test.value, component, [{ ...second, tile: { ...second.tile!, attribution: "B", minZoom: 4, maxZoom: 12 } }]);
        expect(mocks.tiles).toHaveLength(4);
        expect(mocks.tiles.at(-1)?.options).toMatchObject({ attribution: "B", minZoom: 4, maxZoom: 12 });
        expect(runtime.center).toEqual([30, 40]); expect(runtime.zoom).toBe(9);
        expect([...runtime.layers].filter(item => item instanceof mocks.Tile)).toHaveLength(1);
    });

    it("replaces every dynamic instance-defining edit and rejects stale callbacks", () => {
        const host = document.createElement("div"); const test = testContext(); const runtimeState = vi.fn();
        const component: MapComponent = { type: "map", id: "map", basemap: { type: "none" }, view: { fitMode: "none" } };
        let current = layer("dynamic", { sourceType: "arcgisDynamic", features: [], dynamic: { url: "https://services.arcgis.com/a/MapServer", layerIds: [1], layerDefinitions: { 1: "A=1" }, format: "png", transparent: true, debounceMs: 100 } });
        renderMap(host, test.value, component, [current], { onLayerRuntimeStateChange: runtimeState });
        const old = mocks.dynamicLayers[0] as unknown as { emitState(value: { loading: boolean; error?: string }): void };
        const edits = [
            { url: "https://services.arcgis.com/b/MapServer" },
            { layerIds: [2] },
            { layerDefinitions: { 2: "B=2" } },
            { format: "jpg" as const, transparent: false },
            { debounceMs: 450 },
        ];
        for (const edit of edits) {
            current = { ...current, dynamic: { ...current.dynamic!, ...edit } };
            renderMap(host, test.value, component, [current], { onLayerRuntimeStateChange: runtimeState });
        }
        expect(mocks.dynamicLayers).toHaveLength(6);
        expect(mocks.dynamicLayers.slice(0, -1).every(item => item.removed)).toBe(true);
        runtimeState.mockClear(); old.emitState({ loading: false, error: "stale" });
        expect(runtimeState).not.toHaveBeenCalled();
        expect([...mocks.maps[0].layers].filter(item => mocks.dynamicLayers.includes(item as never))).toHaveLength(1);
    });

    it("removes denied external content and restores only the newest definition", () => {
        const host = document.createElement("div"); const test = testContext(); const runtimeState = vi.fn();
        const component: MapComponent = { type: "map", id: "map", basemap: { type: "none" }, view: { fitMode: "none" } };
        const original = layer("tile", { sourceType: "arcgisTile", features: [], tile: { url: "https://tiles.arcgisonline.com/a/MapServer" } });
        renderMap(host, test.value, component, [original], { onLayerRuntimeStateChange: runtimeState });
        mocks.externalAccess.allowed = false;
        const newest = { ...original, tile: { ...original.tile!, url: "https://tiles.arcgisonline.com/new/MapServer" } };
        renderMap(host, test.value, component, [newest], { onLayerRuntimeStateChange: runtimeState });
        expect(mocks.tiles[0].removed).toBe(true); expect(mocks.maps[0].layers.has(mocks.tiles[0])).toBe(false);
        const warnings = runtimeState.mock.calls.filter(call => String(call[1]?.warning).includes("Access denied"));
        expect(warnings).toHaveLength(1);
        mocks.externalAccess.allowed = true;
        renderMap(host, test.value, component, [newest], { onLayerRuntimeStateChange: runtimeState });
        expect(mocks.tiles).toHaveLength(2); expect(mocks.tiles[1].url).toContain("/new/");
    });
    it("reactively replaces and removes basemaps without remounting operational overlays", () => {
        const host = document.createElement("div"); const test = testContext();
        const base = { type: "map", id: "map", view: { fitMode: "none" as const }, layers: [{ id: "features", name: "Features", source: { type: "powerbi" as const, bindings: {} } }] };
        renderMap(host, test.value, { ...base, basemap: { type: "osm" } }, [layer("features")]);
        expect(mocks.maps).toHaveLength(1); expect(mocks.tiles).toHaveLength(1);
        renderMap(host, test.value, { ...base, basemap: { type: "none" } }, [layer("features")]);
        expect(mocks.maps).toHaveLength(1); expect(mocks.tiles[0].removed).toBe(true);
        renderMap(host, test.value, { ...base, basemap: { type: "customTile", url: "https://tiles.arcgis.com/a/{z}/{x}/{y}.png", attribution: "A" } }, [layer("features")]);
        renderMap(host, test.value, { ...base, basemap: { type: "customTile", url: "https://tiles.arcgis.com/b/{z}/{x}/{y}.png", attribution: "B" } }, [layer("features")]);
        expect(mocks.tiles.at(-1)?.url).toContain("/b/"); expect(mocks.tiles.at(-2)?.removed).toBe(true);
        expect([...mocks.maps[0].layers].filter(item => item instanceof mocks.Layer && (item as { url?: string }).url)).toHaveLength(1);
    });

    it("reactively updates authored constraints while unrelated layer edits preserve a user view and resize invalidates", () => {
        const host = document.createElement("div"); const test = testContext();
        const component = { type: "map", id: "map", basemap: { type: "none" as const }, view: { center: [10, 20] as [number, number], zoom: 5, minZoom: 2, maxZoom: 16, fitMode: "none" as const }, layers: [{ id: "features", name: "Features", source: { type: "powerbi" as const, bindings: {} } }] };
        renderMap(host, test.value, component, [layer("features")]); const runtime = mocks.maps[0];
        expect(runtime.minZoomCalls.at(-1)).toBe(2); expect(runtime.maxZoomCalls.at(-1)).toBe(16);
        runtime.setView([30, 40], 9);
        renderMap(host, test.value, { ...component, layers: [{ ...component.layers[0], name: "Renamed" }] }, [layer("features", { name: "Renamed" })]);
        expect(runtime.center).toEqual([30, 40]); expect(runtime.zoom).toBe(9);
        renderMap(host, test.value, { ...component, view: { ...component.view, center: [11, 22], zoom: 7, minZoom: 3, maxZoom: 15 } }, [layer("features")]);
        expect(runtime.center).toEqual([11, 22]); expect(runtime.zoom).toBe(7); expect(runtime.minZoomCalls.at(-1)).toBe(3); expect(runtime.maxZoomCalls.at(-1)).toBe(15);
        resizeCallbacks[0](); expect(runtime.invalidateSizeCalls).toBeGreaterThan(0);
    });
    it("renders a basemap with two tile overlays without duplicate layers", () => {
        const host = document.createElement("div"); const test = testContext();
        const tiles = [layer("tile-a", { sourceType: "arcgisTile", features: [], tile: { url: "https://tiles.arcgisonline.com/a/MapServer" } }), layer("tile-b", { sourceType: "arcgisTile", features: [], tile: { url: "https://tiles.arcgisonline.com/b/MapServer" } })];
        const component: MapComponent = { type: "map", id: "map", basemap: { type: "arcgisTile", url: "https://tiles.arcgisonline.com/base/{z}/{x}/{y}.png" }, view: { fitMode: "none" } };
        renderMap(host, test.value, component, tiles);
        expect(mocks.tiles).toHaveLength(3);
        renderMap(host, test.value, component, tiles);
        expect(mocks.tiles).toHaveLength(3);
    });

    it("hides, shows, and updates opacity for tile overlays", () => {
        const host = document.createElement("div"); const test = testContext(); const tile = layer("tile", { sourceType: "arcgisTile", features: [], tile: { url: "https://tiles.arcgisonline.com/a/MapServer" } });
        renderMap(host, test.value, { type: "map", id: "map", basemap: { type: "none" }, view: { fitMode: "none" } }, [tile]);
        expect(mocks.tiles).toHaveLength(1);
        test.value.state.mapLayerState.map = { opacity: { tile: .25 } };
        renderMap(host, test.value, { type: "map", id: "map", basemap: { type: "none" }, view: { fitMode: "none" } }, [tile]);
        expect(mocks.tiles[0].opacity).toBe(.25);
        test.value.state.mapLayerState.map = { visibility: { tile: false } };
        renderMap(host, test.value, { type: "map", id: "map", basemap: { type: "none" }, view: { fitMode: "none" } }, [tile]);
        expect(mocks.tiles[0].removed).toBe(true);
        test.value.state.mapLayerState.map = { visibility: { tile: true } };
        renderMap(host, test.value, { type: "map", id: "map", basemap: { type: "none" }, view: { fitMode: "none" } }, [tile]);
        expect(mocks.tiles).toHaveLength(1);
        expect(mocks.maps[0].layers.has(mocks.tiles[0])).toBe(true);
    });

    it("hides, shows, updates opacity, and assigns a deterministic pane for dynamic overlays", () => {
        const host = document.createElement("div"); const test = testContext(); const runtimeState = vi.fn(); const dynamic = layer("dynamic", { sourceType: "arcgisDynamic", features: [], dynamic: { url: "https://services.arcgis.com/a/MapServer", debounceMs: 77 } });
        const component: MapComponent = { type: "map", id: "map", basemap: { type: "none" }, view: { fitMode: "none" } };
        renderMap(host, test.value, component, [dynamic], { onLayerRuntimeStateChange: runtimeState });
        expect(mocks.createDynamic).toHaveBeenCalledWith(expect.objectContaining({ pane: "hp-map-dynamic", debounceMs: 77 }), expect.any(Function));
        test.value.state.mapLayerState.map = { opacity: { dynamic: .4 } };
        renderMap(host, test.value, component, [dynamic], { onLayerRuntimeStateChange: runtimeState });
        expect(mocks.dynamicLayers[0].opacity).toBe(.4);
        test.value.state.mapLayerState.map = { visibility: { dynamic: false } };
        renderMap(host, test.value, component, [dynamic], { onLayerRuntimeStateChange: runtimeState });
        expect(mocks.dynamicLayers[0].removed).toBe(true);
        test.value.state.mapLayerState.map = { visibility: { dynamic: true } };
        renderMap(host, test.value, component, [dynamic], { onLayerRuntimeStateChange: runtimeState });
        expect(mocks.dynamicLayers).toHaveLength(1);
        expect(mocks.maps[0].layers.has(mocks.dynamicLayers[0])).toBe(true);
    });
});

describe("LeafletMap rendering safety", () => {
    it("applies the component height with a safe minimum", () => {
        const host = document.createElement("div"); const test = testContext();
        renderMap(host, test.value, { type: "map", id: "map", height: 180, basemap: { type: "none" }, view: { fitMode: "none" } }, []);
        const container = host.querySelector<HTMLElement>(".hp-leaflet-container")!;
        expect(container.style.height).toBe("");
        expect(container.style.width).toBe("");
    });

    it("multiplies point and GeoJSON stroke and fill opacity by layer opacity", () => {
        const host = document.createElement("div"); const test = testContext();
        const renderer = { type: "simple" as const, symbol: { opacity: .8, fillOpacity: .4, color: "#111", fillColor: "#222" } };
        const points = layer("points", { opacity: .5, renderer });
        const polygons = layer("polygons", { opacity: .5, renderer, features: [feature("polygon", { layerId: "polygons", lat: null, lon: null, geometryType: "polygon", geometry: { type: "Polygon", coordinates: [[[-96, 29], [-94, 29], [-94, 31], [-96, 29]]] } })] });
        renderMap(host, test.value, { type: "map", id: "map", basemap: { type: "none" }, view: { fitMode: "none" } }, [points, polygons]);
        expect(mocks.circles[0].options).toMatchObject({ opacity: .4, fillOpacity: .2 });
        const style = (mocks.geoLayers[0].options.style as () => Record<string, number>)();
        expect(style).toMatchObject({ opacity: .4, fillOpacity: .2 });
    });

    it("uses configured cluster radius, coverage, and disable zoom", () => {
        const host = document.createElement("div"); const test = testContext();
        renderMap(host, test.value, { type: "map", id: "map", settings: { clusterPoints: true }, basemap: { type: "none" }, view: { fitMode: "none" } }, [layer("clusters", { renderer: { type: "cluster", clusterRadius: 60, disableAtZoom: 15, showCoverageOnHover: true } })]);
        expect(mocks.markerClusterGroup).toHaveBeenCalledWith(expect.objectContaining({ showCoverageOnHover: true, maxClusterRadius: 60, disableClusteringAtZoom: 15, iconCreateFunction: expect.any(Function) }));
    });

    it("makes an explicit cluster authoritative and formats count and sum icons", () => {
        const host = document.createElement("div"); const test = testContext();
        const features = [feature("a", { layerId: "clusters", powerBiAttributes: { amount: 10 } }), feature("b", { layerId: "clusters", powerBiAttributes: { amount: 20 } })];
        const definition = { id: "clusters", name: "Clusters", source: { type: "powerbi" as const, bindings: {} }, renderer: { type: "cluster" as const, clusterLabel: "sum" as const, aggregateField: "amount", fieldSource: "powerbi" as const } };
        renderMap(host, test.value, { type: "map", id: "map", settings: { clusterPoints: false }, layers: [definition], basemap: { type: "none" }, view: { fitMode: "none" } }, [layer("clusters", { features, renderer: { type: "cluster", clusterLabel: "sum", aggregateField: "amount", fieldSource: "powerbi" } })]);
        expect(mocks.markerClusterGroup).toHaveBeenCalledTimes(1);
        const options = mocks.markerClusterGroup.mock.calls[0][0] as { iconCreateFunction(group: { getAllChildMarkers(): unknown[] }): unknown };
        const markers = features.map(item => ({ __hpFeature: item }));
        options.iconCreateFunction({ getAllChildMarkers: () => markers });
        expect(mocks.divIcon).toHaveBeenLastCalledWith(expect.objectContaining({ html: expect.stringContaining("30") }));
    });
});

describe("LeafletMap search result controller", () => {
    it("fits valid bounds, falls back to configured zoom, replaces and clears a noninteractive marker", async () => {
        const host = document.createElement("div"); const test = testContext(); let controller: LeafletMapController | undefined;
        renderMap(host, test.value, { type: "map", id: "map", search: { zoom: 15 }, basemap: { type: "none" }, view: { fitMode: "none" } }, [], { onControllerReady: value => { controller = value; } });
        await vi.runAllTimersAsync();
        controller!.showSearchResult({ latitude: 29.76, longitude: -95.37, label: "Houston", bounds: [-95.8, 29.5, -94.9, 30.1], provider: "nominatim" });
        expect(mocks.maps[0].fitBoundsCalls).toHaveLength(1);
        const firstMarker = mocks.circles[0];
        expect(firstMarker.options).toMatchObject({ interactive: false, pane: "hp-map-search-result" });
        expect(firstMarker.tooltip).toBe("Houston");
        firstMarker.fire("click", { originalEvent: {} });
        expect(test.dispatchSpy).not.toHaveBeenCalled();

        controller!.showSearchResult({ latitude: 32.78, longitude: -96.8, label: "Dallas", provider: "nominatim" });
        expect(firstMarker.removed).toBe(true);
        expect(mocks.maps[0].setViewCalls.at(-1)).toEqual({ center: [32.78, -96.8], zoom: 15 });
        const secondMarker = mocks.circles[1];
        controller!.clearSearchResult();
        expect(secondMarker.removed).toBe(true);
    });
});

describe("LeafletMap feature interactions, popups, and labels", () => {
    it("patches renderer, opacity, and details content without recreating geometry", () => {
        const host = document.createElement("div"); const test = testContext();
        const component: MapComponent = { type: "map", id: "map", basemap: { type: "none" }, view: { fitMode: "none" } };
        const initial = layer("stable", { popup: { enabled: true, title: "{{NAME}}", fields: [], actions: [] } });
        renderMap(host, test.value, component, [initial]);
        const marker = mocks.circles.at(-1)!;
        const created = mocks.circles.length;
        renderMap(host, test.value, component, [{
            ...initial,
            opacity: 0.45,
            renderer: { type: "simple", symbol: { color: "#d63939", fillColor: "#f8b4b4" } },
            popup: { ...initial.popup!, title: "Feature {{NAME}}" },
        }]);
        expect(mocks.circles).toHaveLength(created);
        expect(mocks.circles.at(-1)).toBe(marker);
        expect(marker.options.color).toBe("#d63939");
    });

    it("applies local selection styling and reference replace/toggle policies", () => {
        const host = document.createElement("div"); const test = testContext(); const component: MapComponent = { type: "map", id: "map", basemap: { type: "none" }, view: { fitMode: "none" } };
        const reference = layer("reference", { sourceType: "arcgisFeature", features: [feature("ref", { layerId: "reference" })] });
        renderMap(host, test.value, component, [reference]);
        mocks.circles.at(-1)!.fire("click", { originalEvent: { stopPropagation: vi.fn() } });
        expect(test.dispatchSpy).toHaveBeenCalledWith(expect.objectContaining({ type: "activateMapFeature", mapId: "map", multiSelect: false }));
        test.value.state.mapSelectedFeatureIds.map = ["ref"];
        renderMap(host, test.value, component, [reference]);
        expect(Number(mocks.circles.at(-1)!.options.weight)).toBeGreaterThanOrEqual(4);
        mocks.circles.at(-1)!.fire("click", { originalEvent: { stopPropagation: vi.fn() } });
        expect(test.dispatchSpy).toHaveBeenLastCalledWith(expect.objectContaining({ type: "activateMapFeature", mapId: "map", multiSelect: false }));
        mocks.circles.at(-1)!.fire("click", { originalEvent: { ctrlKey: true, stopPropagation: vi.fn() } });
        expect(test.dispatchSpy).toHaveBeenLastCalledWith(expect.objectContaining({ type: "activateMapFeature", mapId: "map", multiSelect: true }));
    });

    it("uses original joined row indices/keys and a layer-specific interaction policy", () => {
        const host = document.createElement("div"); const test = testContext(); const component: MapComponent = { type: "map", id: "map", basemap: { type: "none" }, view: { fitMode: "none" } };
        const joinedFeature = feature("joined", { layerId: "joined-layer", powerBiRowIndices: [1], powerBiRowKeys: ["row-1"], powerBiAttributes: { id: "B" } });
        const joined = layer("joined-layer", { sourceType: "arcgisFeature", features: [joinedFeature], interaction: { enabled: true, trigger: "click", internalMode: "highlight", externalMode: "selection", field: "id" } });
        renderMap(host, test.value, component, [joined]);
        mocks.circles.at(-1)!.fire("click", { originalEvent: { stopPropagation: vi.fn() } });
        expect(test.selectExternal).toHaveBeenCalledWith([1], false, expect.objectContaining({ componentId: "map" }));

        test.selectExternal.mockClear();
        renderMap(host, test.value, component, [{ ...joined, interaction: { enabled: false } }]);
        mocks.circles.at(-1)!.fire("click", { originalEvent: { stopPropagation: vi.fn() } });
        expect(test.selectExternal).not.toHaveBeenCalled();
    });

    it("recreates popup action content after close and reopen", () => {
        const host = document.createElement("div"); const test = testContext();
        const popupLayer = layer("popup", { popup: { enabled: true, title: "{{NAME}}", fields: [], actions: [{ id: "open", label: "Open", uiAction: { action: "showToast", message: "Opened" } }] } });
        renderMap(host, test.value, { type: "map", id: "map", basemap: { type: "none" }, view: { fitMode: "none" }, featureDetails: { mode: "legacyPopup" } }, [popupLayer]);
        const marker = mocks.circles.at(-1)!;
        const contentFactory = marker.popup as () => HTMLElement;
        contentFactory().querySelector("button")!.click();
        marker.fire("popupclose");
        contentFactory().querySelector("button")!.click();
        expect(test.executeUiAction).toHaveBeenCalledTimes(2);
    });

    it("integrates and cleans the dedicated label runtime without duplicate vector groups", () => {
        const host = document.createElement("div"); const test = testContext(); const runtimeState = vi.fn();
        const labeled = layer("labels", { labels: { enabled: true, field: "NAME", fieldSource: "service", placement: "center", color: "#333", size: 12, weight: "normal", collision: "none" } });
        const component: MapComponent = { type: "map", id: "map", basemap: { type: "none" }, view: { fitMode: "none" } };
        renderMap(host, test.value, component, [labeled], { onLayerRuntimeStateChange: runtimeState });
        expect(mocks.createLabels).toHaveBeenCalledTimes(1);
        expect(runtimeState).toHaveBeenCalledWith("labels", { warning: "label warning" });
        renderMap(host, test.value, component, [labeled], { onLayerRuntimeStateChange: runtimeState });
        expect(mocks.labelCleanups[0]).not.toHaveBeenCalled();
        expect(mocks.featureGroup).toHaveBeenCalledTimes(1);
        act(() => render(null, host));
        expect(mocks.labelCleanups[0]).toHaveBeenCalledTimes(1);
    });
});

describe("LeafletMap large local layer viewport rendering", () => {
    it("mounts only indexed features near the current viewport", async () => {
        const host = document.createElement("div");
        const test = testContext();
        const features = Array.from({ length: 2_000 }, (_value, index) =>
            feature(`large-${index}`, {
                layerId: "large",
                lat: index < 20 ? 30 + index / 1_000 : 45 + index / 10_000,
                lon: index < 20 ? -95 + index / 1_000 : -120 + index / 10_000,
            }),
        );
        renderMap(
            host,
            test.value,
            { type: "map", id: "map", basemap: { type: "none" }, view: { fitMode: "none" } },
            [layer("large", { features })],
        );
        await act(async () => { await vi.runAllTimersAsync(); });
        expect(mocks.circles.length).toBeGreaterThan(0);
        expect(mocks.circles.length).toBeLessThan(100);
        act(() => render(null, host));
    });
});
