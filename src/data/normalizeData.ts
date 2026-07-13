import type { FieldOrigin, QueryAggregation } from "./fieldMetadata";

export type Primitive = string | number | boolean | Date | null | undefined;
export type DataRow = Record<string, Primitive>;

export interface NormalizedField {
    key: string;
    displayName: string;
    queryName?: string;
    sourceTable?: string;
    sourceColumn?: string;
    qualifiedName?: string;
    type: "measure" | "date" | "latitude" | "longitude" | "geometry" | "schema" | "dimension";
    format?: string;
    roles: string[];
    /** Power BI metadata classification. Kept optional for persisted/test data compatibility. */
    kind?: "column" | "measure" | "unknown";
    /** Primitive metadata type used by the AI-facing semantic manifest. */
    dataType?: "text" | "number" | "boolean" | "date" | "datetime" | "unknown";
    /** Visual-query summarization applied by Power BI to an underlying model column. */
    queryAggregation?: QueryAggregation;
    /** True only when queryAggregation wraps a model column rather than identifying a model measure. */
    isImplicitAggregation?: boolean;
    /** Stable metadata provenance used by validation and external-filter diagnostics. */
    origin?: FieldOrigin;
    /** Direct field dependencies for safe calculated fields; never a Power BI model target. */
    dependencies?: string[];
}

export type MapLocationMode = "geometry" | "latLon" | "xy" | "address" | "none";
export type MapFeatureType = "point" | "line" | "polygon" | "geometry" | "address";

export interface MapBindingKeys {
    layer?: string;
    type?: string;
    latitude?: string;
    longitude?: string;
    x?: string;
    y?: string;
    address?: string;
    city?: string;
    state?: string;
    zip?: string;
    geometry?: string;
    color?: string;
    size?: string;
    tooltip: string[];
    details: string[];
}

export interface NormalizedMapFeature {
    id: string;
    rowIndex: number;
    rowKey: string;
    type: MapFeatureType;
    geometry: GeoJSON.GeoJsonObject | null;
    lat: number | null;
    lon: number | null;
    x: number | null;
    y: number | null;
    address: string | null;
    colorValue: Primitive;
    sizeValue: number | null;
    properties: Record<string, Primitive>;
    row: DataRow;
}

export interface NormalizedMapLayer { name: string; features: NormalizedMapFeature[]; }

export interface NormalizedMapData {
    hasGeometry: boolean;
    hasLatLon: boolean;
    hasXY: boolean;
    hasAddress: boolean;
    mode: MapLocationMode;
    bindings: MapBindingKeys;
    layers: NormalizedMapLayer[];
    warnings: string[];
    invalidFeatureCount: number;
}

export interface Aggregates {
    count: number;
    sum: Record<string, number>;
    avg: Record<string, number>;
    min: Record<string, number>;
    max: Record<string, number>;
    distinctCount: Record<string, number>;
    first: Record<string, Primitive>;
}

export interface NormalizedData {
    fields: Record<string, NormalizedField>;
    rows: DataRow[];
    rowKeys: string[];
    aggregates: Aggregates;
    map: NormalizedMapData;
    schemaFromField?: string;
    calculatedMetrics?: Record<string, Primitive>;
    loadStatus?: { loadedRowCount: number; moreRowsAvailable: boolean; fetchInProgress?: boolean };
}
