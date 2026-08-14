import type { DataRow, Primitive } from "../../data/normalizeData";
import type { ResolvedDatasetView } from "../../render/RenderContext";
import type {
  GeoLibreComponent,
  GeoLibrePowerBiLayerBinding,
  GeoLibreProjectDocument,
  GeoLibreProjectLayer,
  JsonObject,
  JsonValue,
} from "./types";
import { isPowerBiLayerId, powerBiLayerId } from "./projectBridge";
import { sanitizeGeoLibreJsonValue } from "./securityPolicy";

const MAX_POWERBI_FEATURES = 100_000;
const GEOMETRY_TYPES = new Set([
  "Point",
  "MultiPoint",
  "LineString",
  "MultiLineString",
  "Polygon",
  "MultiPolygon",
  "GeometryCollection",
]);

export interface GeoLibreFeatureIdentity {
  layerId: string;
  featureId: string;
  sourceRowIndices: number[];
  sourceRowKeys: string[];
}

export interface GeoLibrePowerBiBridgeResult {
  document: GeoLibreProjectDocument;
  layerIds: string[];
  identityByLayer: Map<string, Map<string, GeoLibreFeatureIdentity>>;
  featureIdsBySourceRow: Map<number, Map<string, string[]>>;
  warnings: string[];
  signature: string;
}

export type GeoLibreDatasetResolver = (
  name?: string,
  componentId?: string,
) => ResolvedDatasetView | undefined;

const object = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

function cloneDocument(value: GeoLibreProjectDocument): GeoLibreProjectDocument {
  return JSON.parse(JSON.stringify(value)) as GeoLibreProjectDocument;
}

function hash(value: string): string {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return (result >>> 0).toString(36);
}

function featureId(
  componentId: string,
  bindingId: string,
  sourceKeys: string[],
  rowIndex: number,
  used: Set<string>,
): string {
  const seed = `${componentId}\u0000${bindingId}\u0000${sourceKeys.join("\u0000") || rowIndex}`;
  const base = `hpb_${hash(seed)}`;
  let candidate = base;
  let collision = 2;
  while (used.has(candidate)) candidate = `${base}_${collision++}`;
  used.add(candidate);
  return candidate;
}

function jsonProperty(value: Primitive): JsonValue {
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  return value ?? null;
}

function finiteCoordinates(value: unknown): boolean {
  if (!Array.isArray(value) || value.length === 0) return false;
  if (value.every((item) => typeof item === "number")) {
    return value.length >= 2 && value.every((item) => Number.isFinite(item));
  }
  return value.every(finiteCoordinates);
}

function geometryValue(value: unknown): JsonObject | undefined {
  let candidate = value;
  if (typeof candidate === "string") {
    try {
      candidate = JSON.parse(candidate);
    } catch {
      return undefined;
    }
  }
  if (!object(candidate)) return undefined;
  if (candidate.type === "Feature" && object(candidate.geometry)) {
    candidate = candidate.geometry;
  }
  if (!object(candidate) || typeof candidate.type !== "string" || !GEOMETRY_TYPES.has(candidate.type)) {
    return undefined;
  }
  if (candidate.type === "GeometryCollection") {
    if (!Array.isArray(candidate.geometries) || candidate.geometries.some((item) => !geometryValue(item))) {
      return undefined;
    }
  } else if (!finiteCoordinates(candidate.coordinates)) {
    return undefined;
  }
  return JSON.parse(JSON.stringify(candidate)) as JsonObject;
}

function geometryForRow(
  row: DataRow,
  binding: GeoLibrePowerBiLayerBinding,
): JsonObject | undefined {
  if (binding.geometry.type === "geojson") {
    return geometryValue(row[binding.geometry.field]);
  }
  const latitude = Number(row[binding.geometry.latitudeField]);
  const longitude = Number(row[binding.geometry.longitudeField]);
  if (
    !Number.isFinite(latitude) ||
    !Number.isFinite(longitude) ||
    latitude < -90 ||
    latitude > 90 ||
    longitude < -180 ||
    longitude > 180
  ) {
    return undefined;
  }
  return { type: "Point", coordinates: [longitude, latitude] } as JsonObject;
}

function fieldsForBinding(
  binding: GeoLibrePowerBiLayerBinding,
  view: ResolvedDatasetView,
): string[] {
  const requested = binding.fields?.length
    ? binding.fields
    : Object.keys(view.fields);
  return Array.from(new Set(requested));
}

function makeLayer(
  component: GeoLibreComponent,
  binding: GeoLibrePowerBiLayerBinding,
  view: ResolvedDatasetView | undefined,
  existing: GeoLibreProjectLayer | undefined,
  identityByLayer: Map<string, Map<string, GeoLibreFeatureIdentity>>,
  featureIdsBySourceRow: Map<number, Map<string, string[]>>,
  warnings: string[],
  remainingCapacity: { value: number },
): GeoLibreProjectLayer {
  const layerId = powerBiLayerId(binding.id);
  const identities = new Map<string, GeoLibreFeatureIdentity>();
  identityByLayer.set(layerId, identities);
  const features: JsonObject[] = [];
  const usedIds = new Set<string>();
  let invalidGeometry = 0;

  if (!view) {
    warnings.push(`GeoLibre Power BI layer “${binding.id}” could not resolve dataset “${binding.dataset ?? component.dataset ?? "powerbi"}”.`);
  } else {
    const fields = fieldsForBinding(binding, view);
    for (let index = 0; index < view.rows.length; index += 1) {
      if (remainingCapacity.value <= 0) break;
      const geometry = geometryForRow(view.rows[index], binding);
      if (!geometry) {
        invalidGeometry += 1;
        continue;
      }
      const sourceRowIndices = Array.from(new Set(view.sourceRowIndices[index] ?? [])).sort(
        (left, right) => left - right,
      );
      const sourceRowKeys = Array.from(new Set(view.sourceRowKeys[index] ?? []));
      const id = featureId(component.id ?? "geolibre", binding.id, sourceRowKeys, view.rowIndices[index] ?? index, usedIds);
      const properties = Object.fromEntries(
        fields.map((field) => [field, jsonProperty(view.rows[index][field])]),
      ) as JsonObject;
      features.push({ type: "Feature", id, geometry, properties } as JsonObject);
      identities.set(id, { layerId, featureId: id, sourceRowIndices, sourceRowKeys });
      for (const sourceIndex of sourceRowIndices) {
        const layers = featureIdsBySourceRow.get(sourceIndex) ?? new Map<string, string[]>();
        const ids = layers.get(layerId) ?? [];
        ids.push(id);
        layers.set(layerId, ids);
        featureIdsBySourceRow.set(sourceIndex, layers);
      }
      remainingCapacity.value -= 1;
    }
  }

  if (invalidGeometry > 0) {
    warnings.push(
      `GeoLibre Power BI layer “${binding.id}” skipped ${invalidGeometry.toLocaleString()} row${invalidGeometry === 1 ? "" : "s"} with invalid geometry.`,
    );
  }
  if (view && features.length < view.rows.length - invalidGeometry) {
    warnings.push(`GeoLibre Power BI layers reached the ${MAX_POWERBI_FEATURES.toLocaleString()} feature safety limit.`);
  }

  return {
    ...(existing ?? {}),
    id: layerId,
    name: existing?.name ?? binding.title ?? binding.id,
    type: "geojson",
    source: { type: "geojson" },
    visible: existing?.visible ?? binding.visible ?? true,
    opacity: existing?.opacity ?? binding.opacity ?? 1,
    style:
      existing?.style ??
      (binding.initialStyle
        ? (sanitizeGeoLibreJsonValue(binding.initialStyle) as JsonObject)
        : {}),
    metadata: existing?.metadata ?? {},
    geojson: { type: "FeatureCollection", features },
  } as GeoLibreProjectLayer;
}

export function hydratePowerBiLayers(
  component: GeoLibreComponent,
  documentValue: GeoLibreProjectDocument,
  resolveDataset: GeoLibreDatasetResolver | undefined,
): GeoLibrePowerBiBridgeResult {
  const document = cloneDocument(documentValue);
  const bindings = component.powerBi?.layers ?? [];
  const activeLayerIds = new Set(bindings.map((binding) => powerBiLayerId(binding.id)));
  const existingById = new Map(document.layers.map((layer) => [layer.id, layer] as const));
  const identityByLayer = new Map<string, Map<string, GeoLibreFeatureIdentity>>();
  const featureIdsBySourceRow = new Map<number, Map<string, string[]>>();
  const warnings: string[] = [];
  const remainingCapacity = { value: MAX_POWERBI_FEATURES };
  const resolvedLayers = new Map<string, GeoLibreProjectLayer>();

  for (const binding of bindings) {
    const datasetName = binding.dataset ?? component.dataset ?? "powerbi";
    const view = resolveDataset?.(datasetName, component.id);
    const id = powerBiLayerId(binding.id);
    resolvedLayers.set(
      id,
      makeLayer(
        component,
        binding,
        view,
        existingById.get(id),
        identityByLayer,
        featureIdsBySourceRow,
        warnings,
        remainingCapacity,
      ),
    );
  }

  document.layers = document.layers
    .filter((layer) => !isPowerBiLayerId(layer.id) || activeLayerIds.has(layer.id))
    .map((layer) => resolvedLayers.get(layer.id) ?? layer);
  for (const binding of bindings) {
    const id = powerBiLayerId(binding.id);
    if (!document.layers.some((layer) => layer.id === id)) {
      const layer = resolvedLayers.get(id);
      if (layer) document.layers.push(layer);
    }
  }

  const signature = JSON.stringify(
    document.layers
      .filter((layer) => activeLayerIds.has(layer.id))
      .map((layer) => [layer.id, layer.geojson, layer.visible, layer.opacity, layer.style]),
  );
  return {
    document,
    layerIds: [...activeLayerIds],
    identityByLayer,
    featureIdsBySourceRow,
    warnings: Array.from(new Set(warnings)),
    signature,
  };
}

export function featureIdsForSourceRows(
  bridge: GeoLibrePowerBiBridgeResult,
  sourceRowIndices: readonly number[],
): Map<string, string[]> {
  const result = new Map<string, Set<string>>();
  for (const sourceIndex of sourceRowIndices) {
    for (const [layerId, ids] of bridge.featureIdsBySourceRow.get(sourceIndex) ?? []) {
      const selected = result.get(layerId) ?? new Set<string>();
      ids.forEach((id) => selected.add(id));
      result.set(layerId, selected);
    }
  }
  return new Map([...result].map(([layerId, ids]) => [layerId, [...ids]]));
}
