import type { ComponentBase } from "../../schema/hyperpbiSchema";

export const GEOLIBRE_VERSION = "2.5.0" as const;
export const GEOLIBRE_PROJECT_FORMAT_VERSION = "0.2.0" as const;
export const GEOLIBRE_UPSTREAM_REVISION =
  "65073e7512703b0819062fe896fe44d27a3f6a28" as const;
export const GEOLIBRE_PROJECT_BRIDGE_VERSION = 1 as const;

export type JsonPrimitive = string | number | boolean | null;
export type JsonValue = JsonPrimitive | JsonObject | JsonValue[];
export interface JsonObject {
  [key: string]: JsonValue | undefined;
}

export interface GeoLibreMapView extends JsonObject {
  center: [number, number];
  zoom: number;
  bearing: number;
  pitch: number;
  bbox?: [number, number, number, number];
}

export interface GeoLibreProjectLayer extends JsonObject {
  id: string;
  name: string;
  type: string;
  source: JsonObject;
  visible: boolean;
  opacity: number;
  style: JsonObject;
  metadata: JsonObject;
  geojson?: JsonObject;
}

/**
 * The browser-safe portion of GeoLibre's native project document. Unknown
 * nested project fields remain JSON so a new upstream field only requires an
 * adapter/security review rather than types leaking through HyperPBI.
 */
export interface GeoLibreProjectDocument extends JsonObject {
  id?: string;
  version: string;
  name: string;
  mapView: GeoLibreMapView;
  basemapStyleUrl: string;
  basemapVisible: boolean;
  basemapOpacity: number;
  layers: GeoLibreProjectLayer[];
  selectedLayerId?: string | null;
  layerGroups?: JsonObject[];
  styles: JsonObject;
  preferences: JsonObject;
  plugins?: JsonObject;
  legend?: JsonObject;
  storymap?: JsonObject;
  models?: JsonObject[];
  processingHistory?: JsonObject[];
  widgets?: JsonObject[];
  dashboardColumns?: number;
  mapLayout?: JsonObject;
  secondaryMapViews?: JsonObject[];
  primaryMapLabel?: string;
  styleLibrary?: JsonObject[];
  comments?: JsonObject[];
  metadata: JsonObject;
}

/** Versioned HyperPBI envelope around an otherwise native GeoLibre project. */
export interface PersistedGeoLibreProject extends JsonObject {
  bridgeVersion: typeof GEOLIBRE_PROJECT_BRIDGE_VERSION;
  formatVersion: typeof GEOLIBRE_PROJECT_FORMAT_VERSION;
  geolibreVersion: typeof GEOLIBRE_VERSION;
  upstreamRevision: typeof GEOLIBRE_UPSTREAM_REVISION;
  document: GeoLibreProjectDocument;
}

export interface GeoLibreCoordinateGeometryBinding extends JsonObject {
  type?: "coordinates";
  latitudeField: string;
  longitudeField: string;
}

export interface GeoLibreFieldGeometryBinding extends JsonObject {
  type: "geojson";
  field: string;
}

export type GeoLibreGeometryBinding =
  | GeoLibreCoordinateGeometryBinding
  | GeoLibreFieldGeometryBinding;

export interface GeoLibrePowerBiLayerBinding extends JsonObject {
  /** Stable binding id. The runtime layer id is derived from this value. */
  id: string;
  title?: string;
  /** Logical HyperPBI dataset; defaults to the component dataset or powerbi. */
  dataset?: string;
  geometry: GeoLibreGeometryBinding;
  /** Attribute aliases exposed to GeoLibre. Omit to expose the dataset fields. */
  fields?: string[];
  /** Initial style only; subsequent edits persist in the native project layer. */
  initialStyle?: JsonObject;
  visible?: boolean;
  opacity?: number;
}

export interface GeoLibreSelectionDefinition extends JsonObject {
  enabled?: boolean;
  externalHighlight?: boolean;
  maxSelectionCount?: number;
}

export interface GeoLibrePowerBiDefinition extends JsonObject {
  layers: GeoLibrePowerBiLayerBinding[];
  selection?: GeoLibreSelectionDefinition;
}

export interface GeoLibreRuntimeDefinition extends JsonObject {
  /** Managed is the locked HyperPBI deployment; official is an explicit fallback. */
  channel?: "managed" | "official";
  theme?: "light" | "dark" | "system";
  panels?: "open" | "collapsed";
}

export interface GeoLibreComponent extends ComponentBase {
  type: "geolibre";
  project?: PersistedGeoLibreProject;
  powerBi?: GeoLibrePowerBiDefinition;
  runtime?: GeoLibreRuntimeDefinition;
  capabilityProfile?: "powerbi-embedded" | "viewer";
  /** Fixed height when heightMode is fixed or omitted. */
  height?: number;
}

export type GeoLibreSaveState =
  | "initializing"
  | "clean"
  | "dirty"
  | "saving"
  | "saved"
  | "error";

export interface GeoLibreSelectionEvent {
  layerId: string | null;
  featureIds: string[];
}

export interface GeoLibreRuntimeStatus {
  state: GeoLibreSaveState;
  message?: string;
  runtimeVersion?: string;
  enhancedApiAvailable?: boolean;
}
