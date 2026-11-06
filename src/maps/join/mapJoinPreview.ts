import type { GeoJsonMapLayerSource } from "../../schema/mapSchema";
import { loadPublicGeoJson } from "../sources/publicGeoJson";
import { resolveGeoJsonLayer } from "../sources/mapGeoJsonSource";
import type { DataRow } from "../../data/normalizeData";
import type {
  ArcGisFeatureLayerSource,
  MapJoinDefinition,
} from "../../schema/mapSchema";
import {
  executeArcGisFeatureQuery,
  type ArcGisFeatureQueryResult,
} from "../arcgis/arcGisFeatureQuery";
import type { MapJoinDiagnostics } from "../model/resolvedMapTypes";
import { executeMapJoin } from "./mapJoinEngine";
import { normalizeJoinKey } from "./mapJoinNormalizer";

export interface MapJoinPreviewResult extends MapJoinDiagnostics {
  outputFeatureCount: number;
  requestCount: number;
  truncated: boolean;
  durationMs: number;
  queryStrategy: string;
  powerBiDuplicatePolicy: string;
  serviceDuplicatePolicy: string;
  unmatchedPolicy: "ignore" | "warn" | "diagnose";
  aggregationAliases: string[];
  normalizationSamples: Array<{ raw: unknown; normalized: string | null }>;
  warnings: string[];
}

export interface MapJoinPreviewInput {
  source: ArcGisFeatureLayerSource | GeoJsonMapLayerSource;
  definition: MapJoinDefinition;
  rows: DataRow[];
  rowKeys: string[];
  sourceRowIndices?: number[][];
  sourceRowKeys?: string[][];
  signal?: AbortSignal;
  maxFeatures?: number;
  query?: typeof executeArcGisFeatureQuery;
}

export async function runMapJoinPreview(
  input: MapJoinPreviewInput,
): Promise<MapJoinPreviewResult> {
  const started = globalThis.performance?.now?.() ?? Date.now();
  const maximum = Math.min(
    500,
    Math.max(1, Math.floor(input.maxFeatures ?? 500)),
  );
  const normalization = input.definition.normalization ?? ["trim", "upper"];
  const joinValues = input.rows.map(
    (row) => row[input.definition.powerBiField],
  );
  const query = input.query ?? executeArcGisFeatureQuery;
  const service = input.source.type === "geoJson" ? await geoJsonPreviewSource(input.source, input.signal, maximum) : await query({
    url: input.source.url,
    layerId: input.source.layerId,
    definitionExpression: input.source.definitionExpression,
    outFields: [input.definition.serviceField],
    maxFeatures: maximum,
    cacheMinutes: 0,
    signal: input.signal,
    joinKeys: {
      field: input.definition.serviceField,
      values: joinValues,
      normalization,
    },
    queryStrategy: input.definition.queryStrategy,
  });
  if (input.signal?.aborted)
    throw new DOMException("Join preview was aborted.", "AbortError");

  const joined = executeMapJoin({
    powerBiRows: input.rows,
    powerBiRowIndices: input.rows.map((_row, index) => index),
    powerBiRowKeys: input.rowKeys,
    powerBiSourceRowIndices: input.sourceRowIndices,
    powerBiSourceRowKeys: input.sourceRowKeys,
    serviceFeatures: service.features,
    definition: input.definition,
    layerId: "join-preview",
  });
  const normalizationSamples = joinValues.slice(0, 10).map((raw) => ({
    raw,
    normalized: normalizeJoinKey(raw, normalization),
  }));
  return {
    ...joined.diagnostics,
    outputFeatureCount: joined.features.length,
    requestCount: service.requestCount,
    truncated: service.truncated || service.features.length >= maximum,
    durationMs: (globalThis.performance?.now?.() ?? Date.now()) - started,
    queryStrategy: service.queryStrategy,
    powerBiDuplicatePolicy:
      input.definition.powerBiDuplicatePolicy ?? "aggregate",
    serviceDuplicatePolicy: input.definition.serviceDuplicatePolicy ?? "first",
    unmatchedPolicy: input.definition.unmatchedPolicy ?? "ignore",
    aggregationAliases: (input.definition.aggregations ?? []).map(
      (item) => item.as,
    ),
    normalizationSamples,
    warnings: [...service.warnings, ...joined.warnings],
  };
}

async function geoJsonPreviewSource(source: GeoJsonMapLayerSource, signal: AbortSignal | undefined, maximum: number) {
    const data = source.data ?? (source.url ? await loadPublicGeoJson(source.url, signal) : undefined);
    if (!data) throw new Error("GeoJSON source has no data or URL.");
    const layer = resolveGeoJsonLayer({ id: "preview", name: "Preview", source, performance: { maxFeatures: maximum } }, data);
    return { features: layer.features.map(feature => ({ objectId: feature.id, attributes: feature.serviceAttributes, geometry: feature.geometry })), requestCount: source.data ? 0 : 1, truncated: layer.diagnostics.warnings.some(warning => warning.includes("Feature limit")), queryStrategy: "geojson", warnings: layer.diagnostics.warnings };
}
