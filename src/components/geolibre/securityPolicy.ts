import {
  GEOLIBRE_PROJECT_BRIDGE_VERSION,
  GEOLIBRE_PROJECT_FORMAT_VERSION,
  GEOLIBRE_UPSTREAM_REVISION,
  GEOLIBRE_VERSION,
  type GeoLibreComponent,
  type GeoLibreProjectDocument,
  type JsonObject,
  type JsonValue,
  type PersistedGeoLibreProject,
} from "./types";

export const GEOLIBRE_MANAGED_RUNTIME_ORIGIN = "https://hyperpbi.com";
export const GEOLIBRE_MANAGED_RUNTIME_PATH = "/geolibre/";
export const GEOLIBRE_OFFICIAL_RUNTIME_ORIGIN = "https://web.geolibre.app";
export const MAX_GEOLIBRE_PROJECT_BYTES = 12 * 1024 * 1024;
export const MAX_GEOLIBRE_PROJECT_DEPTH = 64;
export const MAX_GEOLIBRE_PROJECT_NODES = 300_000;

const PROJECT_KEYS = new Set([
  "id",
  "version",
  "name",
  "mapView",
  "basemapStyleUrl",
  "basemapVisible",
  "basemapOpacity",
  "layers",
  "selectedLayerId",
  "layerGroups",
  "styles",
  "preferences",
  "plugins",
  "legend",
  "storymap",
  "models",
  "processingHistory",
  "widgets",
  "dashboardColumns",
  "mapLayout",
  "secondaryMapViews",
  "primaryMapLabel",
  "styleLibrary",
  "comments",
  "metadata",
]);

const TRANSIENT_LAYER_KEYS = new Set(["timeFilter", "embedFilter"]);
const EXECUTABLE_KEY = /(?:^|[-_])(?:scripts?|javascript|functions?|callbacks?|modules?|dynamic[-_]?imports?|eval|code)(?:$|[-_])|(?:script|javascript|function|callback|module|dynamicimport|eval|code)(?:url|uri|path|source|body)$/i;
const EVENT_HANDLER_KEY = /^on[a-z0-9_-]+$/i;
const CREDENTIAL_KEY = /(?:authorization|api[-_]?key|access[-_]?token|refresh[-_]?token|password|passwd|secret|credentials?|private[-_]?key|client[-_]?secret|cookie)$|^(?:headers|requestHeaders|httpHeaders)$/i;
const DANGEROUS_HTML = /<(?:script|iframe|object|embed|link|meta)\b|\bon[a-z]+\s*=|javascript\s*:/i;
const DANGEROUS_SCHEME = /^\s*(?:vbscript\s*:|data\s*:\s*(?:text\/html|application\/(?:javascript|ecmascript)|image\/svg\+xml))/i;
const ABSOLUTE_FILE_PATH = /^(?:[a-z]:[\\/]|\\\\|\/[^/])/i;
const FILE_PATH_KEY = /^(?:source|file|input|output|local)(?:path|directory)$/i;
const URL_KEY = /(?:url|uri|href|src|tiles?|image|icon)$/i;
const ALLOWED_CUSTOM_PROTOCOLS = new Set(["pmtiles:", "cog:"]);

const object = (value: unknown): value is Record<string, unknown> =>
  Boolean(value) && typeof value === "object" && !Array.isArray(value);

function containsCredentialMaterial(value: unknown): boolean {
  if (value === null || value === undefined || value === "") return false;
  if (Array.isArray(value)) return value.some(containsCredentialMaterial);
  if (object(value)) return Object.values(value).some(containsCredentialMaterial);
  return true;
}

export class GeoLibreSecurityError extends Error {
  constructor(
    message: string,
    readonly path: string,
  ) {
    super(`${path}: ${message}`);
    this.name = "GeoLibreSecurityError";
  }
}

function pointer(value: string): string {
  return value.replace(/~/g, "~0").replace(/\//g, "~1");
}

function assertSafeUrl(value: string, path: string): void {
  const trimmed = value.trim();
  if (!trimmed || trimmed.startsWith("/") || trimmed.startsWith("./") || trimmed.startsWith("../")) {
    return;
  }
  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    // A plain file name or MapLibre template fragment is not an executable URL.
    if (!/^[a-z][a-z0-9+.-]*:/i.test(trimmed)) return;
    throw new GeoLibreSecurityError("URL is malformed.", path);
  }
  const localHttp =
    // eslint-disable-next-line powerbi-visuals/no-http-string -- Loopback HTTP is allowed only for local development.
    parsed.protocol === "http:" &&
    ["localhost", "127.0.0.1", "[::1]"].includes(parsed.hostname.toLowerCase());
  if (
    parsed.protocol !== "https:" &&
    !localHttp &&
    !ALLOWED_CUSTOM_PROTOCOLS.has(parsed.protocol)
  ) {
    throw new GeoLibreSecurityError(
      `URL scheme “${parsed.protocol}” is not allowed in the embedded profile.`,
      path,
    );
  }
  if (parsed.username || parsed.password) {
    throw new GeoLibreSecurityError("Credentials in URLs are not allowed.", path);
  }
}

function validateCredentialContainers(project: Record<string, unknown>): void {
  const preferences = object(project.preferences) ? project.preferences : undefined;
  if (preferences && Array.isArray(preferences.environmentVariables)) {
    for (let index = 0; index < preferences.environmentVariables.length; index += 1) {
      const variable = preferences.environmentVariables[index];
      if (object(variable) && typeof variable.value === "string" && variable.value.length > 0) {
        throw new GeoLibreSecurityError(
          "Runtime environment variable values cannot be stored in HyperPBI.",
          `/preferences/environmentVariables/${index}/value`,
        );
      }
    }
  }
  const geocoding = preferences && object(preferences.geocoding) ? preferences.geocoding : undefined;
  if (geocoding && object(geocoding.apiKeys) && Object.keys(geocoding.apiKeys).length > 0) {
    throw new GeoLibreSecurityError(
      "Geocoding API keys cannot be stored in HyperPBI.",
      "/preferences/geocoding/apiKeys",
    );
  }
  const plugins = object(project.plugins) ? project.plugins : undefined;
  const pluginConfigurationPresent = plugins && containsCredentialMaterial(plugins);
  if (pluginConfigurationPresent) {
    throw new GeoLibreSecurityError(
      "Project plugin activation and settings are disabled in the Power BI profile.",
      "/plugins",
    );
  }
}

function cloneSafeJson(input: unknown): JsonValue {
  let nodes = 0;
  const ancestors = new Set<object>();

  const visit = (
    value: unknown,
    path: string,
    depth: number,
    urlContext = false,
  ): JsonValue => {
    nodes += 1;
    if (nodes > MAX_GEOLIBRE_PROJECT_NODES) {
      throw new GeoLibreSecurityError("Project contains too many values.", path);
    }
    if (depth > MAX_GEOLIBRE_PROJECT_DEPTH) {
      throw new GeoLibreSecurityError("Project nesting is too deep.", path);
    }
    if (value === null || typeof value === "string" || typeof value === "boolean") {
      if (typeof value === "string") {
        if (DANGEROUS_HTML.test(value)) {
          throw new GeoLibreSecurityError("Executable or unsafe HTML is not allowed.", path);
        }
        if (DANGEROUS_SCHEME.test(value)) {
          throw new GeoLibreSecurityError("Executable data URL schemes are not allowed.", path);
        }
        if (urlContext) assertSafeUrl(value, path);
      }
      return value;
    }
    if (typeof value === "number") {
      if (!Number.isFinite(value)) {
        throw new GeoLibreSecurityError("Numbers must be finite.", path);
      }
      return value;
    }
    if (typeof value !== "object" || value === undefined) {
      throw new GeoLibreSecurityError("Only JSON values are allowed.", path);
    }
    if (ancestors.has(value)) {
      throw new GeoLibreSecurityError("Cyclic project values are not allowed.", path);
    }
    ancestors.add(value);
    try {
      if (Array.isArray(value)) {
        return value.map((item, index) => visit(item, `${path}/${index}`, depth + 1, urlContext));
      }
      const prototype = Object.getPrototypeOf(value);
      if (prototype !== Object.prototype && prototype !== null) {
        throw new GeoLibreSecurityError("Only plain JSON objects are allowed.", path);
      }
      const result: JsonObject = {};
      for (const [key, child] of Object.entries(value)) {
        const childPath = `${path}/${pointer(key)}`;
        if (["__proto__", "prototype", "constructor"].includes(key)) {
          throw new GeoLibreSecurityError("Prototype mutation keys are not allowed.", childPath);
        }
        if (EXECUTABLE_KEY.test(key) || EVENT_HANDLER_KEY.test(key)) {
          throw new GeoLibreSecurityError("Executable callbacks or modules are not allowed.", childPath);
        }
        if (CREDENTIAL_KEY.test(key) && containsCredentialMaterial(child)) {
          throw new GeoLibreSecurityError("Credential-bearing fields are not allowed.", childPath);
        }
        if (FILE_PATH_KEY.test(key) && typeof child === "string" && ABSOLUTE_FILE_PATH.test(child)) {
          throw new GeoLibreSecurityError("Absolute filesystem paths are not allowed.", childPath);
        }
        result[key] = visit(child, childPath, depth + 1, URL_KEY.test(key));
      }
      return result;
    } finally {
      ancestors.delete(value);
    }
  };

  return visit(input, "", 0);
}

export function geoLibreJsonSecurityError(input: unknown): string | undefined {
  try {
    sanitizeGeoLibreJsonValue(input);
    return undefined;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

export function sanitizeGeoLibreJsonValue(input: unknown): JsonValue {
  return cloneSafeJson(input);
}

function requireFinite(value: unknown, path: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new GeoLibreSecurityError("A finite number is required.", path);
  }
  return value;
}

function validateDocumentShape(project: Record<string, unknown>): void {
  for (const key of Object.keys(project)) {
    if (!PROJECT_KEYS.has(key)) {
      throw new GeoLibreSecurityError(
        `Project property “${key}” is not supported by the pinned GeoLibre revision.`,
        `/${pointer(key)}`,
      );
    }
  }
  if (project.version !== GEOLIBRE_PROJECT_FORMAT_VERSION) {
    throw new GeoLibreSecurityError(
      `Expected GeoLibre project format ${GEOLIBRE_PROJECT_FORMAT_VERSION}.`,
      "/version",
    );
  }
  if (typeof project.name !== "string" || project.name.trim().length === 0) {
    throw new GeoLibreSecurityError("Project name is required.", "/name");
  }
  if (!object(project.mapView) || !Array.isArray(project.mapView.center) || project.mapView.center.length !== 2) {
    throw new GeoLibreSecurityError("A two-coordinate map center is required.", "/mapView/center");
  }
  requireFinite(project.mapView.center[0], "/mapView/center/0");
  requireFinite(project.mapView.center[1], "/mapView/center/1");
  for (const property of ["zoom", "bearing", "pitch"] as const) {
    requireFinite(project.mapView[property], `/mapView/${property}`);
  }
  if (typeof project.basemapStyleUrl !== "string") {
    throw new GeoLibreSecurityError("Basemap style URL must be a string.", "/basemapStyleUrl");
  }
  assertSafeUrl(project.basemapStyleUrl, "/basemapStyleUrl");
  if (typeof project.basemapVisible !== "boolean") {
    throw new GeoLibreSecurityError("Basemap visibility must be boolean.", "/basemapVisible");
  }
  const opacity = requireFinite(project.basemapOpacity, "/basemapOpacity");
  if (opacity < 0 || opacity > 1) {
    throw new GeoLibreSecurityError("Basemap opacity must be from 0 through 1.", "/basemapOpacity");
  }
  if (!Array.isArray(project.layers)) {
    throw new GeoLibreSecurityError("Project layers must be an array.", "/layers");
  }
  const ids = new Set<string>();
  project.layers.forEach((layer, index) => {
    const path = `/layers/${index}`;
    if (!object(layer)) throw new GeoLibreSecurityError("Layer must be an object.", path);
    if (typeof layer.id !== "string" || !layer.id) {
      throw new GeoLibreSecurityError("Layer id is required.", `${path}/id`);
    }
    if (ids.has(layer.id)) {
      throw new GeoLibreSecurityError(`Layer id “${layer.id}” is duplicated.`, `${path}/id`);
    }
    ids.add(layer.id);
    if (typeof layer.name !== "string" || typeof layer.type !== "string") {
      throw new GeoLibreSecurityError("Layer name and type are required.", path);
    }
    if (layer.visible !== undefined && typeof layer.visible !== "boolean") {
      throw new GeoLibreSecurityError("Layer visibility must be boolean.", `${path}/visible`);
    }
    if (layer.opacity !== undefined) {
      const layerOpacity = requireFinite(layer.opacity, `${path}/opacity`);
      if (layerOpacity < 0 || layerOpacity > 1) {
        throw new GeoLibreSecurityError("Layer opacity must be from 0 through 1.", `${path}/opacity`);
      }
    }
  });
  if (!object(project.styles)) {
    throw new GeoLibreSecurityError("Project styles must be an object.", "/styles");
  }
  if (!object(project.metadata)) {
    throw new GeoLibreSecurityError("Project metadata must be an object.", "/metadata");
  }
  validateCredentialContainers(project);
}

/** Validate, strip transient layer state, and return an isolated JSON document. */
export function sanitizeGeoLibreProjectDocument(input: unknown): GeoLibreProjectDocument {
  if (!object(input)) {
    throw new GeoLibreSecurityError("GeoLibre project must be an object.", "/project/document");
  }
  validateDocumentShape(input);
  const cloned = cloneSafeJson(input) as GeoLibreProjectDocument;
  cloned.layers = cloned.layers.map((layer) => {
    const persistent = { ...layer } as GeoLibreProjectLayerWithTransient;
    for (const key of TRANSIENT_LAYER_KEYS) delete persistent[key];
    return persistent;
  });
  const bytes = new TextEncoder().encode(JSON.stringify(cloned)).byteLength;
  if (bytes > MAX_GEOLIBRE_PROJECT_BYTES) {
    throw new GeoLibreSecurityError(
      `Project is ${bytes.toLocaleString()} bytes; the embedded limit is ${MAX_GEOLIBRE_PROJECT_BYTES.toLocaleString()} bytes.`,
      "/project/document",
    );
  }
  return cloned;
}

type GeoLibreProjectLayerWithTransient = GeoLibreProjectDocument["layers"][number] &
  Record<string, JsonValue | undefined>;

export function sanitizePersistedGeoLibreProject(input: unknown): PersistedGeoLibreProject {
  if (!object(input)) {
    throw new GeoLibreSecurityError("Persisted GeoLibre project must be an object.", "/project");
  }
  const allowed = new Set([
    "bridgeVersion",
    "formatVersion",
    "geolibreVersion",
    "upstreamRevision",
    "document",
  ]);
  for (const key of Object.keys(input)) {
    if (!allowed.has(key)) {
      throw new GeoLibreSecurityError(`Project envelope property “${key}” is not supported.`, `/project/${pointer(key)}`);
    }
  }
  if (input.bridgeVersion !== GEOLIBRE_PROJECT_BRIDGE_VERSION) {
    throw new GeoLibreSecurityError(
      `Expected project bridge version ${GEOLIBRE_PROJECT_BRIDGE_VERSION}.`,
      "/project/bridgeVersion",
    );
  }
  if (input.formatVersion !== GEOLIBRE_PROJECT_FORMAT_VERSION) {
    throw new GeoLibreSecurityError(
      `Expected project format ${GEOLIBRE_PROJECT_FORMAT_VERSION}.`,
      "/project/formatVersion",
    );
  }
  if (input.geolibreVersion !== GEOLIBRE_VERSION) {
    throw new GeoLibreSecurityError(
      `Expected GeoLibre ${GEOLIBRE_VERSION}.`,
      "/project/geolibreVersion",
    );
  }
  if (input.upstreamRevision !== GEOLIBRE_UPSTREAM_REVISION) {
    throw new GeoLibreSecurityError(
      `Expected upstream revision ${GEOLIBRE_UPSTREAM_REVISION}.`,
      "/project/upstreamRevision",
    );
  }
  const document = sanitizeGeoLibreProjectDocument(input.document);
  if (document.version !== input.formatVersion) {
    throw new GeoLibreSecurityError(
      "Envelope formatVersion must match document.version.",
      "/project/formatVersion",
    );
  }
  return {
    bridgeVersion: GEOLIBRE_PROJECT_BRIDGE_VERSION,
    formatVersion: GEOLIBRE_PROJECT_FORMAT_VERSION,
    geolibreVersion: GEOLIBRE_VERSION,
    upstreamRevision: GEOLIBRE_UPSTREAM_REVISION,
    document,
  };
}

export function geoLibreSecurityError(input: unknown): string | undefined {
  try {
    sanitizePersistedGeoLibreProject(input);
    return undefined;
  } catch (error) {
    return error instanceof Error ? error.message : String(error);
  }
}

export function assertCompatibleGeoLibreRuntimeVersion(version: string): void {
  if (version !== GEOLIBRE_VERSION) {
    throw new GeoLibreSecurityError(
      `Runtime ${version} is incompatible with the pinned GeoLibre ${GEOLIBRE_VERSION} adapter.`,
      "/runtime/version",
    );
  }
}

function localManagedOrigin(locationValue?: Location): string | undefined {
  const location = locationValue ?? (typeof window !== "undefined" ? window.location : undefined);
  if (!location || !["localhost", "127.0.0.1", "[::1]"].includes(location.hostname)) return undefined;
  return location.origin;
}

export interface ResolvedGeoLibreRuntime {
  url: string;
  origin: string;
  channel: "managed" | "official";
}

export function resolveGeoLibreRuntime(
  component: Pick<GeoLibreComponent, "runtime" | "capabilityProfile">,
  locationValue?: Location,
): ResolvedGeoLibreRuntime {
  const channel = component.runtime?.channel ?? "managed";
  const origin =
    channel === "official"
      ? GEOLIBRE_OFFICIAL_RUNTIME_ORIGIN
      : localManagedOrigin(locationValue) ?? GEOLIBRE_MANAGED_RUNTIME_ORIGIN;
  const basePath = channel === "official" ? "/" : GEOLIBRE_MANAGED_RUNTIME_PATH;
  const url = new URL(basePath, origin);
  url.searchParams.set("embed", "1");
  url.searchParams.set("welcome", "0");
  if (component.capabilityProfile === "viewer") url.searchParams.set("layout", "viewer");
  if (component.runtime?.panels === "collapsed") url.searchParams.set("panels", "collapsed");
  if (component.runtime?.theme && component.runtime.theme !== "system") {
    url.searchParams.set("theme", component.runtime.theme);
  }
  return { url: url.toString(), origin: url.origin, channel };
}
