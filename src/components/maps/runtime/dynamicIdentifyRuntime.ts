import type { MapGeometryType, MapLayerDefinition } from "../../../schema/mapSchema";
import type { Point } from "geojson";
import type { ArcGisDynamicIdentifyResult } from "../../../maps/arcgis/arcGisDynamicIdentify";
import { createMapFeatureKey } from "../../../maps/model/mapFeatureIdentity";
import { resolveMapLayerCapabilities } from "../../../maps/model/mapLayerCapabilities";
import type {
  ResolvedMapFeature,
  ResolvedMapLayer,
  ResolvedMapPopup,
} from "../../../maps/model/resolvedMapTypes";

export interface DynamicIdentifyChoice {
  featureKey: string;
  layerId: string;
  label: string;
}

export interface DynamicIdentifyPresentation {
  layer: ResolvedMapLayer;
  choices: DynamicIdentifyChoice[];
}

/** Adapts temporary identify responses to the same read-only details view model as features. */
export function createDynamicIdentifyPresentation(
  mapId: string,
  definition: MapLayerDefinition,
  results: readonly ArcGisDynamicIdentifyResult[],
): DynamicIdentifyPresentation {
  const source = definition.source;
  if (source.type !== "arcgisDynamic")
    throw new Error("Dynamic identify presentation requires an ArcGIS Dynamic layer.");
  const layerId = `${definition.id}::identify`;
  const features = results.map((result): ResolvedMapFeature => {
    const sourceIdentity = `arcgis-dynamic-identify:${source.url}:${result.layerId}`;
    const featureKey = createMapFeatureKey(
      mapId,
      layerId,
      sourceIdentity,
      result.resultId,
    );
    return {
      featureKey,
      sourceIdentity,
      id: result.resultId,
      layerId,
      geometryType: identifyGeometryType(result.geometry),
      geometry: result.geometry,
      lat:
        result.geometry?.type === "Point"
          ? Number((result.geometry as Point).coordinates[1])
          : null,
      lon:
        result.geometry?.type === "Point"
          ? Number((result.geometry as Point).coordinates[0])
          : null,
      serviceAttributes: {
        ...result.attributes,
        __hp_identify_title: result.label,
        __hp_identify_layer: result.layerName,
      },
      powerBiAttributes: {},
      powerBiRowIndices: [],
      powerBiRowKeys: [],
      joinedAttributes: {},
      selected: false,
      labelValue: result.label,
    };
  });
  const popup = resolveIdentifyPopup(definition, results);
  return {
    layer: {
      id: layerId,
      name: definition.name,
      sourceType: "arcgisDynamic",
      sourceIdentity: `arcgis-dynamic-identify:${source.url}`,
      capabilities: resolveMapLayerCapabilities("arcgisDynamic"),
      geometryType: features.length === 1 ? features[0].geometryType : "mixed",
      visible: true,
      opacity: 1,
      order: definition.order ?? 0,
      features,
      renderer: { type: "simple", symbol: {} },
      popup,
      diagnostics: {
        featureCount: features.length,
        requestCount: 1,
        loading: false,
        sourceUrl: source.url,
        sourceType: "arcgisDynamic",
        geometryType: features.length === 1 ? features[0].geometryType : "mixed",
        usedServiceSymbology: false,
        usedServiceLabels: false,
        warnings: [],
      },
      loading: false,
    },
    choices: features.map((feature, index) => ({
      featureKey: feature.featureKey!,
      layerId,
      label: `${results[index].layerName}: ${results[index].label}`,
    })),
  };
}

function resolveIdentifyPopup(
  definition: MapLayerDefinition,
  results: readonly ArcGisDynamicIdentifyResult[],
): ResolvedMapPopup {
  const authored = definition.popup;
  if (authored)
    return {
      enabled: authored.enabled ?? true,
      title: authored.title,
      fields: (authored.fields ?? []).map((field) => ({
        ...field,
        fieldSource: "service",
        display: field.display ?? "text",
      })),
      actions: (authored.actions ?? []).map((action) => ({ ...action })),
      html: authored.html,
      defaultFieldSource: "service",
    };
  const fieldNames = uniqueFieldNames(results).slice(0, 6);
  return {
    enabled: true,
    title: "{{__hp_identify_title}}",
    defaultFieldSource: "service",
    fields: [
      {
        field: "__hp_identify_layer",
        fieldSource: "service",
        label: "Sublayer",
        display: "text",
      },
      ...fieldNames.map((field) => ({
        field,
        fieldSource: "service" as const,
        label: field,
        display: "text" as const,
      })),
    ],
    actions: [],
  };
}

function uniqueFieldNames(
  results: readonly ArcGisDynamicIdentifyResult[],
): string[] {
  const names = new Set<string>();
  for (const result of results)
    for (const field of Object.keys(result.attributes)) names.add(field);
  return [...names];
}

function identifyGeometryType(
  geometry: GeoJSON.GeoJsonObject | null,
): MapGeometryType {
  if (!geometry) return "unknown";
  if (geometry.type === "Point") return "point";
  if (geometry.type === "MultiPoint") return "multipoint";
  if (geometry.type === "LineString" || geometry.type === "MultiLineString")
    return "polyline";
  if (geometry.type === "Polygon" || geometry.type === "MultiPolygon")
    return "polygon";
  return "unknown";
}
