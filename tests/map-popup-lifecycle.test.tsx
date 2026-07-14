import { h, render } from "preact";
import { act } from "preact/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const leaflet = vi.hoisted(() => {
  type Handler = (event?: unknown) => void;

  class Bounds {
    private points: Array<[number, number]> = [];
    extend(value: unknown) {
      if (value instanceof Bounds) this.points.push(...value.points);
      else if (Array.isArray(value) && typeof value[0] === "number")
        this.points.push(value as [number, number]);
      return this;
    }
    isValid() {
      return this.points.length > 0;
    }
    pad() {
      return this;
    }
    getCenter() {
      const [lat, lng] = this.points[0] ?? [0, 0];
      return { lat, lng };
    }
    getSouthWest() {
      const [lat, lng] = this.points[0] ?? [0, 0];
      return {
        lat,
        lng,
        equals: (other: { lat: number; lng: number }) =>
          lat === other.lat && lng === other.lng,
      };
    }
    getNorthEast() {
      const [lat, lng] = this.points.at(-1) ?? [0, 0];
      return { lat, lng };
    }
    getWest() {
      return -96;
    }
    getSouth() {
      return 29;
    }
    getEast() {
      return -94;
    }
    getNorth() {
      return 31;
    }
  }

  class MapRuntime {
    readonly listeners = new Map<string, Set<Handler>>();
    readonly layers = new Set<Layer>();
    readonly panes = new Map<string, HTMLElement>();
    center: [number, number] = [30, -95];
    zoom = 8;

    constructor(readonly host: HTMLElement) {}
    setView(center: [number, number], zoom: number) {
      this.center = center;
      this.zoom = zoom;
      return this;
    }
    fitBounds() {
      return this;
    }
    getCenter() {
      const [lat, lng] = this.center;
      return { lat, lng, equals: (other: { lat: number; lng: number }) => lat === other.lat && lng === other.lng };
    }
    getZoom() {
      return this.zoom;
    }
    setMinZoom() {
      return this;
    }
    setMaxZoom() {
      return this;
    }
    getBounds() {
      return new Bounds();
    }
    getSize() {
      return { x: 800, y: 600 };
    }
    on(name: string, handler: Handler) {
      const handlers = this.listeners.get(name) ?? new Set<Handler>();
      handlers.add(handler);
      this.listeners.set(name, handlers);
      return this;
    }
    off(name: string, handler: Handler) {
      this.listeners.get(name)?.delete(handler);
      return this;
    }
    addLayer(layer: Layer) {
      this.layers.add(layer);
      layer.map = this;
      return this;
    }
    removeLayer(layer: Layer) {
      this.layers.delete(layer);
      layer.removeFrom(this);
      return this;
    }
    hasLayer(layer: Layer) {
      return this.layers.has(layer);
    }
    createPane(name: string) {
      const pane = document.createElement("div");
      pane.className = `leaflet-${name}-pane`;
      pane.dataset.pane = name;
      this.host.appendChild(pane);
      this.panes.set(name, pane);
      return pane;
    }
    getPane(name: string) {
      return this.panes.get(name);
    }
    invalidateSize() {
      return this;
    }
    remove() {
      for (const layer of [...this.layers]) this.removeLayer(layer);
      for (const pane of this.panes.values()) pane.remove();
      this.panes.clear();
    }
  }

  class Layer {
    readonly listeners = new Map<string, Set<Handler>>();
    readonly layers: Layer[] = [];
    options: Record<string, unknown>;
    map?: MapRuntime;
    popupFactory?: () => HTMLElement;
    popupOptions?: Record<string, unknown>;
    popupElement?: HTMLElement;
    popupOpen = false;
    tooltip?: unknown;

    constructor(options: Record<string, unknown> = {}) {
      this.options = options;
    }
    addTo(map: MapRuntime) {
      map.addLayer(this);
      return this;
    }
    addLayer(layer: Layer) {
      this.layers.push(layer);
      layer.map = this.map;
      return this;
    }
    removeLayer(layer: Layer) {
      const index = this.layers.indexOf(layer);
      if (index >= 0) this.layers.splice(index, 1);
      layer.removeFrom(this.map);
      return this;
    }
    clearLayers() {
      for (const layer of [...this.layers]) this.removeLayer(layer);
      return this;
    }
    removeFrom(map?: MapRuntime) {
      this.closePopup();
      for (const layer of [...this.layers]) layer.removeFrom(map);
      this.map = undefined;
      return this;
    }
    on(name: string, handler: Handler) {
      const handlers = this.listeners.get(name) ?? new Set<Handler>();
      handlers.add(handler);
      this.listeners.set(name, handlers);
      return this;
    }
    off(name: string, handler?: Handler) {
      if (handler) this.listeners.get(name)?.delete(handler);
      else this.listeners.delete(name);
      return this;
    }
    fire(name: string, event: unknown = {}) {
      for (const handler of this.listeners.get(name) ?? []) handler(event);
      return this;
    }
    bindTooltip(content: unknown) {
      this.tooltip = content;
      return this;
    }
    bindPopup(content: (() => HTMLElement) | HTMLElement, options: Record<string, unknown> = {}) {
      this.popupFactory = typeof content === "function" ? content : () => content;
      this.popupOptions = options;
      this.on("click", () => this.openPopup());
      return this;
    }
    openPopup() {
      if (this.popupOpen || !this.popupFactory || !this.map) return this;
      const paneName = String(this.popupOptions?.pane ?? "popupPane");
      const pane = this.map.getPane(paneName);
      if (!pane) return this;
      const popup = document.createElement("div");
      popup.className = "leaflet-popup";
      popup.appendChild(this.popupFactory());
      pane.appendChild(popup);
      this.popupElement = popup;
      this.popupOpen = true;
      this.fire("popupopen", { popup });
      return this;
    }
    closePopup() {
      if (!this.popupOpen) return this;
      this.popupOpen = false;
      this.popupElement?.remove();
      this.popupElement = undefined;
      this.fire("popupclose", {});
      return this;
    }
    getPopup() {
      return this.popupFactory ? { options: this.popupOptions } : undefined;
    }
    isPopupOpen() {
      return this.popupOpen;
    }
    setStyle(style: Record<string, unknown>) {
      Object.assign(this.options, style);
      return this;
    }
    setRadius(radius: number) {
      this.options.radius = radius;
      return this;
    }
    getBounds() {
      return new Bounds().extend([30, -95]);
    }
  }

  const maps: MapRuntime[] = [];
  const markers: Layer[] = [];
  const popupOpen = vi.fn();
  const popupClose = vi.fn();
  const map = vi.fn((host: HTMLElement) => {
    const runtime = new MapRuntime(host);
    maps.push(runtime);
    return runtime;
  });
  const circleMarker = vi.fn((_position: unknown, options: Record<string, unknown>) => {
    const layer = new Layer(options);
    layer.on("popupopen", popupOpen);
    layer.on("popupclose", popupClose);
    markers.push(layer);
    return layer;
  });
  const featureGroup = vi.fn(() => new Layer());
  const markerClusterGroup = vi.fn(() => new Layer());

  return {
    Bounds,
    Layer,
    MapRuntime,
    maps,
    markers,
    popupOpen,
    popupClose,
    map,
    circleMarker,
    featureGroup,
    markerClusterGroup,
  };
});

vi.mock("leaflet", () => ({
  map: leaflet.map,
  tileLayer: () => new leaflet.Layer(),
  circleMarker: leaflet.circleMarker,
  marker: (_position: unknown, options: Record<string, unknown>) => new leaflet.Layer(options),
  geoJSON: () => new leaflet.Layer(),
  featureGroup: leaflet.featureGroup,
  layerGroup: () => new leaflet.Layer(),
  markerClusterGroup: leaflet.markerClusterGroup,
  divIcon: (options: unknown) => options,
  latLngBounds: () => new leaflet.Bounds(),
}));
vi.mock("leaflet.markercluster", () => ({}));
vi.mock("../src/providers/providerPolicy", () => ({
  resolveProviderPolicy: () => ({ tilesAllowed: true }),
  externalServiceAccess: () => ({ allowed: true }),
}));
vi.mock("../src/components/maps/ResolvedMapLabels", () => ({
  createResolvedMapLabels: () => ({ group: new leaflet.Layer(), cleanup: vi.fn(), warnings: [] }),
}));

import { LeafletMap } from "../src/components/maps/LeafletMap";
import { defaultConfig } from "../src/config/hyperpbiConfig";
import { calculateAggregates } from "../src/data/aggregations";
import { normalizeMapBindings } from "../src/data/normalizeMapBindings";
import type { NormalizedData } from "../src/data/normalizeData";
import type { ResolvedMapFeature, ResolvedMapLayer } from "../src/maps/model/resolvedMapTypes";
import { RenderContext, type RenderContextValue } from "../src/render/RenderContext";
import { dashboardReducer, initialDashboardState } from "../src/render/stateStore";
import type { MapComponent } from "../src/schema/hyperpbiSchema";
import { toRuntimeSettings, VisualFormattingSettingsModel } from "../src/settings";

const rows = [{ id: "pb-1" }];
const fields: NormalizedData["fields"] = {
  id: { key: "id", displayName: "ID", type: "dimension", roles: ["values"] },
};
const data: NormalizedData = {
  rows,
  rowKeys: ["row-0"],
  fields,
  aggregates: calculateAggregates(rows),
  map: normalizeMapBindings(rows, fields),
};

function arcGisFeature(): ResolvedMapFeature {
  return {
    id: "facilities_7",
    layerId: "facilities",
    geometryType: "point",
    geometry: null,
    lat: 30,
    lon: -95,
    serviceObjectId: 7,
    serviceAttributes: { OBJECTID: 7, facilityName: "North Clinic" },
    powerBiAttributes: {},
    powerBiRowIndices: [],
    powerBiRowKeys: [],
    joinedAttributes: {},
    selected: false,
  };
}

function arcGisLayer(feature = arcGisFeature()): ResolvedMapLayer {
  return {
    id: "facilities",
    name: "Facilities",
    sourceType: "arcgisFeature",
    geometryType: "point",
    visible: true,
    opacity: 1,
    order: 1,
    features: [feature],
    renderer: { type: "simple", symbol: { color: "#206bc4", fillColor: "#74c0fc" } },
    popup: {
      enabled: true,
      title: "Facility {{OBJECTID}}",
      defaultFieldSource: "service",
      fields: [
        { field: "facilityName", fieldSource: "service", label: "Facility", display: "text" },
      ],
      actions: [
        { id: "inspect", label: "Inspect", uiAction: { action: "showToast", message: "Opened" } },
      ],
    },
    tooltip: {
      enabled: true,
      template: "{{facilityName}}",
      defaultFieldSource: "service",
    },
    interaction: { enabled: true, trigger: "click", internalMode: "highlight", externalMode: "none", field: "OBJECTID", fieldSource: "service" },
    diagnostics: {
      featureCount: 1,
      requestCount: 1,
      loading: false,
      sourceType: "arcgisFeature",
      geometryType: "point",
      usedServiceSymbology: false,
      usedServiceLabels: false,
      warnings: [],
    },
    loading: false,
  };
}

function context() {
  const dispatch = vi.fn();
  const executeUiAction = vi.fn(() => ({ success: true as const }));
  const value = {
    data,
    rows,
    sourceRows: rows,
    sourceRowKeys: data.rowKeys,
    getRowsForComponent: () => rows,
    componentRows: () => [],
    schema: { version: "2.0", components: [] },
    settings: toRuntimeSettings(new VisualFormattingSettingsModel()),
    state: initialDashboardState(),
    dispatch: (action: Parameters<typeof dashboardReducer>[1]) => {
      dispatch(action);
      value.state = dashboardReducer(value.state, action);
    },
    warnings: [],
    config: defaultConfig,
    webAccessAvailable: true,
    executeUiAction,
    selectExternal: vi.fn(() => ({ sent: true as const })),
    clearExternal: vi.fn(() => ({ sent: true as const })),
    applyExternalFilter: vi.fn(() => ({ sent: true as const })),
    clearExternalFilter: vi.fn(() => ({ sent: true as const })),
    reportInteraction: vi.fn(),
    isOverlayOpen: () => false,
  } as unknown as RenderContextValue;
  return { value, dispatch, executeUiAction };
}

const component: MapComponent = {
  type: "map",
  id: "map",
  basemap: { type: "none" },
  view: { fitMode: "none" },
};

function renderMap(host: HTMLElement, value: RenderContextValue, layer: ResolvedMapLayer) {
  act(() =>
    render(
      h(RenderContext.Provider, { value }, h(LeafletMap, { component, resolvedLayers: [layer] })),
      host,
    ),
  );
}

beforeEach(() => {
  vi.useFakeTimers();
  leaflet.maps.length = 0;
  leaflet.markers.length = 0;
  leaflet.popupOpen.mockClear();
  leaflet.popupClose.mockClear();
  leaflet.map.mockClear();
  leaflet.circleMarker.mockClear();
  vi.stubGlobal("ResizeObserver", class {
    observe() {}
    disconnect() {}
  });
});

afterEach(() => {
  vi.useRealTimers();
  document.body.replaceChildren();
});

describe("map popup lifecycle", () => {
  it("opens an ArcGIS service popup on one click and preserves it through selection styling", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const test = context();
    const layer = arcGisLayer();
    renderMap(host, test.value, layer);

    const mountedFeature = leaflet.markers[0];
    mountedFeature.fire("click", { originalEvent: {} });

    expect(leaflet.popupOpen).toHaveBeenCalledTimes(1);
    expect(leaflet.popupClose).not.toHaveBeenCalled();
    expect(host.querySelectorAll(".leaflet-popup")).toHaveLength(1);
    const popup = host.querySelector<HTMLElement>(".leaflet-popup")!;
    expect(popup.isConnected).toBe(true);
    expect(popup.textContent).toContain("Facility 7");
    expect(popup.textContent).toContain("North Clinic");
    expect(test.dispatch).toHaveBeenCalledWith({
      type: "selectMapFeatures",
      mapId: "map",
      featureIds: ["facilities_7"],
      selectionMode: "replace",
    });

    renderMap(host, test.value, layer);

    expect(leaflet.circleMarker).toHaveBeenCalledTimes(1);
    expect(leaflet.popupOpen).toHaveBeenCalledTimes(1);
    expect(leaflet.popupClose).not.toHaveBeenCalled();
    expect(popup.isConnected).toBe(true);
    expect(host.querySelectorAll(".leaflet-popup")).toHaveLength(1);

    const action = popup.querySelector<HTMLButtonElement>("button")!;
    action.click();
    expect(test.executeUiAction).toHaveBeenCalledTimes(1);

    mountedFeature.closePopup();
    mountedFeature.closePopup();
    expect(leaflet.popupClose).toHaveBeenCalledTimes(1);
    expect(popup.isConnected).toBe(false);
    action.click();
    expect(test.executeUiAction).toHaveBeenCalledTimes(1);
  });
});
