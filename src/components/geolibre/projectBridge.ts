import {
  GEOLIBRE_PROJECT_BRIDGE_VERSION,
  GEOLIBRE_PROJECT_FORMAT_VERSION,
  GEOLIBRE_UPSTREAM_REVISION,
  GEOLIBRE_VERSION,
  type GeoLibreProjectDocument,
  type JsonObject,
  type JsonValue,
  type PersistedGeoLibreProject,
} from "./types";
import {
  sanitizeGeoLibreProjectDocument,
  sanitizePersistedGeoLibreProject,
} from "./securityPolicy";

export const POWERBI_LAYER_ID_PREFIX = "hyperpbi-powerbi-";

export function powerBiLayerId(bindingId: string): string {
  return `${POWERBI_LAYER_ID_PREFIX}${bindingId}`;
}

export function isPowerBiLayerId(layerId: string): boolean {
  return layerId.startsWith(POWERBI_LAYER_ID_PREFIX);
}

export function createDefaultGeoLibreProject(
  name = "HyperPBI GeoLibre workspace",
): PersistedGeoLibreProject {
  return wrapGeoLibreProject({
    version: GEOLIBRE_PROJECT_FORMAT_VERSION,
    name,
    mapView: {
      center: [-100, 40],
      zoom: 2,
      bearing: 0,
      pitch: 0,
    },
    basemapStyleUrl: "https://tiles.openfreemap.org/styles/liberty",
    basemapVisible: true,
    basemapOpacity: 1,
    layers: [],
    layerGroups: [],
    styles: {},
    preferences: {},
    legend: {},
    comments: [],
    metadata: {},
  });
}

export function wrapGeoLibreProject(
  document: GeoLibreProjectDocument,
): PersistedGeoLibreProject {
  return sanitizePersistedGeoLibreProject({
    bridgeVersion: GEOLIBRE_PROJECT_BRIDGE_VERSION,
    formatVersion: GEOLIBRE_PROJECT_FORMAT_VERSION,
    geolibreVersion: GEOLIBRE_VERSION,
    upstreamRevision: GEOLIBRE_UPSTREAM_REVISION,
    document,
  });
}

function cloneJson<T extends JsonValue>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

/**
 * Remove live Power BI feature payloads before the native project enters the
 * HyperPBI specification. Presentation authored in GeoLibre stays on the
 * ordinary layer; the semantic-model data and identities are rebuilt at run
 * time from the Field Manifest bindings.
 */
export function dehydratePowerBiLayers(
  input: GeoLibreProjectDocument,
): GeoLibreProjectDocument {
  // Strip the potentially very large live feature collections before cloning;
  // a 100k-feature layer must not be serialized merely to throw it away.
  const withoutTransientPayloads = {
    ...input,
    layers: input.layers.map((layer) => {
      const persistent = { ...layer } as typeof layer &
        Record<string, JsonValue | undefined>;
      delete persistent.timeFilter;
      delete persistent.embedFilter;
      if (isPowerBiLayerId(layer.id)) {
        delete persistent.geojson;
        delete persistent.sourcePath;
        persistent.source = { type: "geojson" } as JsonObject;
      }
      return persistent;
    }),
  } as GeoLibreProjectDocument & Record<string, JsonValue | undefined>;
  // The pinned browser runtime always reports its built-in map controls in the
  // native `plugins` field, even when plugin management is hidden by the locked
  // profile. Plugin activation is runtime/deployment state rather than authored
  // dashboard state, so it must not cross into the HyperPBI specification.
  // A plugin field supplied directly in persisted JSON still reaches the strict
  // sanitizer and is rejected unless it is materially empty.
  delete withoutTransientPayloads.plugins;
  return cloneJson(withoutTransientPayloads);
}

export function persistGeoLibreRuntimeProject(
  input: unknown,
): PersistedGeoLibreProject {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    return wrapGeoLibreProject(input as GeoLibreProjectDocument);
  }
  // The runtime is pinned and isolated. Drop only the exact reserved transient
  // feature collections before applying the strict project sanitizer and size
  // limit; every persistent field still crosses the sanitizer.
  const document = dehydratePowerBiLayers(input as GeoLibreProjectDocument);
  return wrapGeoLibreProject(sanitizeGeoLibreProjectDocument(document));
}

export function serializeGeoLibreProject(
  project: PersistedGeoLibreProject,
): string {
  return JSON.stringify(sanitizePersistedGeoLibreProject(project), null, 2);
}

export function deserializeGeoLibreProject(
  value: string | unknown,
): PersistedGeoLibreProject {
  const parsed = typeof value === "string" ? JSON.parse(value) : value;
  return sanitizePersistedGeoLibreProject(parsed);
}

function canonical(value: JsonValue): JsonValue {
  if (Array.isArray(value)) return value.map(canonical);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(
    Object.keys(value)
      .sort()
      .filter((key) => value[key] !== undefined)
      .map((key) => [key, canonical(value[key]!)]),
  ) as JsonObject;
}

export function geoLibreProjectFingerprint(
  project: PersistedGeoLibreProject | GeoLibreProjectDocument,
): string {
  return JSON.stringify(canonical(project as JsonValue));
}
