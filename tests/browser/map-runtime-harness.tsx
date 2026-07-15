import { render } from "preact";
import { useEffect, useMemo, useReducer, useState } from "preact/hooks";
import "leaflet/dist/leaflet.css";
import "../../src/styles/hyperpbi-map.css";
import { LeafletMap } from "../../src/components/maps/LeafletMap";
import { MapFeatureDetails } from "../../src/components/maps/MapFeatureDetails";
import { MapToolbar, mapToolbarPopoverId } from "../../src/components/maps/MapToolbar";
import { MapToolbarPopover } from "../../src/components/maps/MapToolbarPopover";
import { RenderContext, type RenderContextValue } from "../../src/render/RenderContext";
import { dashboardReducer, initialDashboardState } from "../../src/render/stateStore";
import { withCanonicalMapFeatureKeys } from "../../src/maps/model/mapFeatureIdentity";
import type { ResolvedMapFeature, ResolvedMapLayer } from "../../src/maps/model/resolvedMapTypes";
import type { MapComponent } from "../../src/schema/hyperpbiSchema";
import { defaultConfig } from "../../src/config/hyperpbiConfig";
import { toRuntimeSettings, VisualFormattingSettingsModel } from "../../src/settings";

const point = (
  id: string,
  lat: number,
  lon: number,
  name: string,
): ResolvedMapFeature => ({
  id,
  layerId: "points",
  geometryType: "point",
  geometry: null,
  lat,
  lon,
  serviceAttributes: { name },
  powerBiAttributes: {},
  powerBiRowIndices: [],
  powerBiRowKeys: [],
  joinedAttributes: {},
  selected: false,
});

const baseLayers = (): ResolvedMapLayer[] => [
  {
    id: "points",
    name: "Points",
    sourceType: "arcgisFeature",
    geometryType: "point",
    visible: true,
    opacity: 1,
    order: 0,
    features: [
      { ...point("duplicate", 30.05, -95.15, "Point Alpha"), powerBiRowIndices: [1], powerBiRowKeys: ["row-1"], joinedAttributes: { joinedName: "Alpha row" } },
      { ...point("second", 29.95, -94.95, "Point Beta"), powerBiRowIndices: [0], powerBiRowKeys: ["row-0"], joinedAttributes: { joinedName: "Beta row" } },
    ],
    interaction: { enabled: true, trigger: "click", internalMode: "highlight", externalMode: "selection" },
    renderer: { type: "simple", symbol: { color: "#1d4ed8", fillColor: "#60a5fa", radius: 8, weight: 2 } },
    popup: {
      enabled: true,
      title: "{{name}}",
      defaultFieldSource: "service",
      fields: [{ field: "name", fieldSource: "service", label: "Name", display: "text" }],
      actions: [],
    },
    diagnostics: { featureCount: 2, requestCount: 1, loading: false, sourceType: "arcgisFeature", sourceUrl: "https://example.test/FeatureServer/0", geometryType: "point", usedServiceSymbology: false, usedServiceLabels: false, warnings: [] },
    loading: false,
  },
  {
    id: "lines",
    name: "Lines",
    sourceType: "arcgisFeature",
    geometryType: "polyline",
    visible: true,
    opacity: 1,
    order: 1,
    features: [{
      id: "duplicate",
      layerId: "lines",
      geometryType: "polyline",
      geometry: { type: "LineString", coordinates: [[-95.3, 29.9], [-94.8, 30.12]] } as GeoJSON.LineString,
      lat: null,
      lon: null,
      serviceAttributes: { name: "Line Alpha" },
      powerBiAttributes: {},
      powerBiRowIndices: [],
      powerBiRowKeys: [],
      joinedAttributes: {},
      selected: false,
    }],
    renderer: { type: "simple", symbol: { color: "#15803d", weight: 5 } },
    popup: { enabled: true, title: "{{name}}", defaultFieldSource: "service", fields: [], actions: [] },
    diagnostics: { featureCount: 1, requestCount: 1, loading: false, sourceType: "arcgisFeature", sourceUrl: "https://example.test/FeatureServer/1", geometryType: "polyline", usedServiceSymbology: false, usedServiceLabels: false, warnings: [] },
    loading: false,
  },
  {
    id: "polygons",
    name: "Polygons",
    sourceType: "arcgisFeature",
    geometryType: "polygon",
    visible: true,
    opacity: 0.65,
    order: 2,
    features: [{
      id: "polygon",
      layerId: "polygons",
      geometryType: "polygon",
      geometry: { type: "Polygon", coordinates: [[[-95.25, 29.82], [-95.02, 29.82], [-95.02, 29.94], [-95.25, 29.82]]] } as GeoJSON.Polygon,
      lat: null,
      lon: null,
      serviceAttributes: { name: "Polygon Alpha" },
      powerBiAttributes: {},
      powerBiRowIndices: [],
      powerBiRowKeys: [],
      joinedAttributes: {},
      selected: false,
    }],
    renderer: { type: "simple", symbol: { color: "#7e22ce", fillColor: "#d8b4fe", weight: 2, fillOpacity: 0.6 } },
    popup: { enabled: true, title: "{{name}}", defaultFieldSource: "service", fields: [], actions: [] },
    diagnostics: { featureCount: 1, requestCount: 1, loading: false, sourceType: "arcgisFeature", sourceUrl: "https://example.test/FeatureServer/2", geometryType: "polygon", usedServiceSymbology: false, usedServiceLabels: false, warnings: [] },
    loading: false,
  },
];

const component: MapComponent = {
  type: "map",
  id: "browser-map",
  view: { center: [30, -95.05], zoom: 9, fitMode: "none" },
  basemap: { type: "none" },
  heightMode: "fill",
  featureDetails: { clearSelectionOnBackgroundClick: true },
  layers: [
    { id: "points", name: "Points", source: { type: "arcgisFeature", url: "https://example.test/FeatureServer/0" } },
    { id: "lines", name: "Lines", source: { type: "arcgisFeature", url: "https://example.test/FeatureServer/1" } },
    { id: "polygons", name: "Polygons", source: { type: "arcgisFeature", url: "https://example.test/FeatureServer/2" } },
  ],
};

declare global {
  interface Window {
    hpMapHarness: {
      updateRenderer(): void;
      updateDetails(): void;
      updateOpacity(): void;
      refreshSameFeatures(): void;
      removeActiveFeature(): void;
      enableCluster(): void;
      toggleDark(): void;
      selectedRows: number[];
      selectedMulti: boolean;
      selectionCalls: number;
    };
  }
}

function Harness() {
  const [state, dispatch] = useReducer(dashboardReducer, initialDashboardState());
  const [layers, setLayers] = useState(baseLayers);
  const [dark, setDark] = useState(false);
  const runtimeLayers = useMemo(
    () => withCanonicalMapFeatureKeys("browser-map", layers),
    [layers],
  );
  useEffect(() => {
    dispatch({
      type: "reconcileMapFeatures",
      mapId: "browser-map",
      availableFeatureKeys: runtimeLayers.flatMap((layer) =>
        layer.features.flatMap((feature) => feature.featureKey ? [feature.featureKey] : []),
      ),
    });
  }, [runtimeLayers]);
  useEffect(() => {
    window.hpMapHarness = {
      selectedRows: [],
      selectedMulti: false,
      selectionCalls: 0,
      updateRenderer: () => setLayers((current) => current.map((layer) =>
        layer.id === "points"
          ? { ...layer, renderer: { type: "simple", symbol: { color: "#b91c1c", fillColor: "#fca5a5", radius: 11, weight: 3 } } }
          : layer,
      )),
      updateDetails: () => setLayers((current) => current.map((layer) =>
        layer.id === "points"
          ? { ...layer, popup: { ...layer.popup!, title: "Updated {{name}}" } }
          : layer,
      )),
      updateOpacity: () => dispatch({ type: "mapLayerOpacity", mapId: "browser-map", layerId: "points", opacity: 0.35 }),
      refreshSameFeatures: () => setLayers((current) => current.map((layer) => ({ ...layer, features: layer.features.map((feature) => ({ ...feature })) }))),
      removeActiveFeature: () => setLayers((current) => current.map((layer) => layer.id === "points" ? { ...layer, features: layer.features.filter((feature) => feature.id !== "duplicate") } : layer)),
      enableCluster: () => setLayers((current) => current.map((layer) =>
        layer.id === "points"
          ? { ...layer, renderer: { type: "cluster", clusterLabel: "count", clusterRadius: 120, disableAtZoom: 14 } }
          : layer,
      )),
      toggleDark: () => setDark((value) => !value),
    };
  }, []);

  const sourceRows = [{ id: "row-0" }, { id: "row-1" }];
  const data = {
    rows: sourceRows, rowKeys: ["row-0", "row-1"], fields: {}, aggregates: { count: 2, sum: {}, avg: {}, min: {}, max: {}, distinctCount: {}, first: {} },
    map: { hasGeometry: false, hasLatLon: false, hasXY: false, hasAddress: false, mode: "none", bindings: { tooltip: [], details: [] }, layers: [], warnings: [], invalidFeatureCount: 0 },
  };
  const context = {
    data,
    rows: sourceRows,
    sourceRows,
    sourceRowKeys: data.rowKeys,
    getRowsForComponent: () => sourceRows,
    componentRows: () => sourceRows,
    schema: { version: "2.0", components: [] },
    settings: toRuntimeSettings(new VisualFormattingSettingsModel()),
    state,
    dispatch,
    warnings: [],
    config: defaultConfig,
    webAccessAvailable: false,
    executeUiAction: () => ({ success: true as const }),
    selectExternal: (indices: number[], multiSelect: boolean) => {
      window.hpMapHarness.selectedRows = indices;
      window.hpMapHarness.selectedMulti = multiSelect;
      window.hpMapHarness.selectionCalls += 1;
      return { sent: true as const };
    },
    clearExternal: () => ({ sent: false as const }),
    applyExternalFilter: () => ({ sent: false as const }),
    clearExternalFilter: () => ({ sent: false as const }),
    reportInteraction: () => undefined,
    isOverlayOpen: () => false,
  } as unknown as RenderContextValue;
  const popover = state.mapUiState["browser-map"]?.toolbarPopover ?? null;
  const popoverContent = popover === "layers" ? (
    <MapToolbarPopover id={mapToolbarPopoverId("browser-map", "layers")} title="Layers" onClose={() => dispatch({ type: "setMapToolbarPopover", mapId: "browser-map", popover: null })}>
      <p>Real toolbar popover</p>
    </MapToolbarPopover>
  ) : undefined;
  return (
    <RenderContext.Provider value={context}>
      <main class={dark ? "hp-theme-dark" : ""}>
        <div class="hp-map-frame is-fill" style={{ height: "520px", minHeight: "220px" }}>
          <div class="hp-map-viewport-clip">
            <LeafletMap component={component} resolvedLayers={runtimeLayers} />
          </div>
          <div class="hp-map-overlay-root">
            <MapFeatureDetails
              mapId="browser-map"
              component={component}
              layers={runtimeLayers}
              interaction={state.mapInteractionState["browser-map"]}
              onClose={() => dispatch({ type: "closeMapFeatureDetails", mapId: "browser-map" })}
              executeAction={() => undefined}
            />
            <MapToolbar
              mapId="browser-map"
              component={component}
              activePopover={popover}
              layerControlEnabled
              legendEnabled={false}
              searchEnabled={false}
              popoverContent={popoverContent}
              onHome={() => undefined}
              onZoomToSelection={() => undefined}
              onSetPopover={(next) => dispatch({ type: "setMapToolbarPopover", mapId: "browser-map", popover: next })}
              onClearSelection={() => dispatch({ type: "clearMapFeatures", mapId: "browser-map" })}
            />
          </div>
        </div>
      </main>
    </RenderContext.Provider>
  );
}

render(<Harness />, document.getElementById("app")!);
