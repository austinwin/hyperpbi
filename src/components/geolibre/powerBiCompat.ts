import type { MapComponent } from "../../schema/hyperpbiSchema";
import type {
  MapLayerDefinition,
  MapSymbolDefinition,
  PowerBiMapLayerSource,
} from "../../schema/mapSchema";
import { isPowerBiLayerId, powerBiLayerId } from "./projectBridge";
import type {
  GeoLibreComponent,
  GeoLibrePowerBiLayerBinding,
  GeoLibreProjectDocument,
  GeoLibreProjectLayer,
  JsonObject,
} from "./types";

const stringValue = (value: unknown): string | undefined =>
  typeof value === "string" && value.trim() ? value : undefined;

const finiteNumber = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;

/**
 * Power BI custom visuals already run inside a sandboxed iframe. Power BI's
 * host does not reliably permit another remote iframe inside that sandbox, so
 * the full hosted GeoLibre application cannot be the Power BI rendering path.
 * The visual host class is added by Visual itself and is isolated to one custom
 * visual sandbox, making it a deterministic host-environment marker without
 * relying on browser URL/origin quirks.
 */
export function isPowerBiVisualSandbox(documentValue: Document | undefined =
  typeof document === "undefined" ? undefined : document): boolean {
  return Boolean(documentValue?.querySelector(".hyperpbi-visual-host"));
}

function symbolFromGeoLibreStyle(style: JsonObject | undefined): MapSymbolDefinition {
  const fillColor =
    stringValue(style?.circleColor) ??
    stringValue(style?.fillColor) ??
    stringValue(style?.color) ??
    "#2563eb";
  const outlineColor =
    stringValue(style?.circleStrokeColor) ??
    stringValue(style?.strokeColor) ??
    stringValue(style?.outlineColor) ??
    "#ffffff";
  const radius =
    finiteNumber(style?.circleRadius) ??
    finiteNumber(style?.radius) ??
    finiteNumber(style?.size) ??
    7;
  const outlineWidth =
    finiteNumber(style?.circleStrokeWidth) ??
    finiteNumber(style?.strokeWidth) ??
    finiteNumber(style?.outlineWidth) ??
    finiteNumber(style?.weight) ??
    1.5;
  return {
    color: fillColor,
    fillColor,
    radius,
    fillOpacity:
      finiteNumber(style?.circleOpacity) ??
      finiteNumber(style?.fillOpacity) ??
      0.9,
    opacity: finiteNumber(style?.opacity) ?? 1,
    outlineColor,
    outlineWidth,
  };
}

function sourceForBinding(binding: GeoLibrePowerBiLayerBinding): PowerBiMapLayerSource {
  const details = binding.fields?.length ? [...binding.fields] : [];
  if (binding.geometry.type === "geojson") {
    return {
      type: "powerbi",
      bindings: {
        geometry: binding.geometry.field,
        tooltip: details,
        details,
      },
    };
  }
  return {
    type: "powerbi",
    bindings: {
      latitude: binding.geometry.latitudeField,
      longitude: binding.geometry.longitudeField,
      tooltip: details,
      details,
    },
  };
}

function popupForFields(fields: string[] | undefined): MapLayerDefinition["popup"] {
  if (!fields?.length) return undefined;
  return {
    enabled: true,
    defaultFieldSource: "powerbi",
    fields: fields.map((field) => ({ field, fieldSource: "powerbi" as const })),
  };
}

function powerBiLayer(
  component: GeoLibreComponent,
  binding: GeoLibrePowerBiLayerBinding,
  document: GeoLibreProjectDocument,
): MapLayerDefinition {
  const runtimeId = powerBiLayerId(binding.id);
  const persisted = document.layers.find((layer) => layer.id === runtimeId);
  const style = persisted?.style ?? binding.initialStyle;
  return {
    id: runtimeId,
    name: persisted?.name ?? binding.title ?? binding.id,
    dataset: binding.dataset ?? component.dataset ?? "powerbi",
    visible: persisted?.visible ?? binding.visible ?? true,
    opacity: persisted?.opacity ?? binding.opacity ?? 1,
    source: sourceForBinding(binding),
    renderer: {
      type: "simple",
      symbol: symbolFromGeoLibreStyle(style),
    },
    popup: popupForFields(binding.fields),
    interaction: component.interaction,
    legend: { visible: false },
  };
}

function inlineGeoJsonLayer(layer: GeoLibreProjectLayer): MapLayerDefinition | undefined {
  if (
    isPowerBiLayerId(layer.id) ||
    layer.type !== "geojson" ||
    !layer.geojson ||
    layer.geojson.type !== "FeatureCollection"
  ) {
    return undefined;
  }
  return {
    id: layer.id,
    name: layer.name,
    visible: layer.visible,
    opacity: layer.opacity,
    source: {
      type: "geoJson",
      data: layer.geojson as unknown as GeoJSON.GeoJsonObject,
    },
    renderer: {
      type: "simple",
      symbol: symbolFromGeoLibreStyle(layer.style),
    },
    legend: { visible: false },
  };
}

/**
 * Translate the browser-hosted GeoLibre component into HyperPBI's bundled map
 * runtime for Power BI. This keeps the same dashboard JSON, Power BI dataset
 * bindings, view, styling, layer visibility, and interaction policy while
 * avoiding the nested remote iframe that Power BI blocks.
 */
export function createGeoLibrePowerBiCompatMap(
  component: GeoLibreComponent,
  document: GeoLibreProjectDocument,
): MapComponent {
  const [longitude, latitude] = document.mapView.center;
  const boundLayers = (component.powerBi?.layers ?? []).map((binding) =>
    powerBiLayer(component, binding, document),
  );
  const nativeInlineLayers = document.layers
    .map(inlineGeoJsonLayer)
    .filter((layer): layer is MapLayerDefinition => Boolean(layer));

  return {
    ...component,
    type: "map",
    engine: "leaflet",
    subtitle:
      "Power BI compatibility mode: map, layers, styling, and selection run inside HyperPBI's bundled renderer.",
    view: {
      center: [latitude, longitude],
      zoom: document.mapView.zoom,
      fitMode: "none",
      preserveView: true,
    },
    // GeoLibre project basemaps are MapLibre style documents. In Power BI use
    // HyperPBI's bundled map runtime and its configured OSM tile provider rather
    // than attempting to execute the remote GeoLibre/MapLibre application.
    basemap: {
      type: document.basemapVisible ? "osm" : "none",
      visible: document.basemapVisible,
    },
    layers: [...nativeInlineLayers, ...boundLayers],
    layerPanel: {
      visible: true,
      position: "right",
      defaultOpen: component.runtime?.panels !== "collapsed",
      allowViewerReorder: true,
      allowViewerOpacity: true,
      allowViewerLabels: false,
    },
    legend: { enabled: false },
    toolbar: {
      visible: true,
      home: true,
      layers: true,
      clearSelection: component.powerBi?.selection?.enabled !== false,
      zoomToSelection: component.powerBi?.selection?.enabled !== false,
      zoomIn: true,
      zoomOut: true,
      selectedCount: component.powerBi?.selection?.enabled !== false,
      position: "topleft",
    },
    tools: {
      selection: {
        maxSelectionCount: component.powerBi?.selection?.maxSelectionCount ?? 1000,
        identityLimitBehavior: "truncate",
      },
      coordinateDisplay: { enabled: true, precision: 5 },
    },
    height: component.height ?? 520,
    heightMode: component.heightMode ?? "fixed",
    minHeight: component.minHeight ?? 280,
  };
}
