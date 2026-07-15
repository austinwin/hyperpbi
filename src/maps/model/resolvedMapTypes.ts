// ── Resolved Map Types ────────────────────────────────────────────────
// Runtime model for resolved map layers, features, and the full map document.

import type { MapLayerSourceType, MapGeometryType } from "../../schema/mapSchema";
import type { ComponentInteractionDefinition } from "../../interactions/interactionTypes";
import type { DataRow } from "../../data/normalizeData";
import type { UiAction } from "../../schema/uiSchema";
import type { ArcGisQueryStrategy } from "../arcgis/arcGisFeatureQuery";
import type { MapFeatureKey } from "./mapFeatureIdentity";
import type { MapLayerCapabilities } from "./mapLayerCapabilities";

// ── Resolved Feature ──────────────────────────────────────────────────

export interface ResolvedMapFeature {
    /** Canonical map/layer/source/feature identity assigned at the map runtime boundary. */
    featureKey?: MapFeatureKey;
    /** Stable dataset or service identity used to construct featureKey. */
    sourceIdentity?: string;
    id: string;
    layerId: string;
    geometryType: MapGeometryType;
    geometry: GeoJSON.GeoJsonObject | null;
    lat: number | null;
    lon: number | null;
    /** ArcGIS service object ID */
    serviceObjectId?: string | number;
    /** Raw service attributes */
    serviceAttributes: Record<string, unknown>;
    /** Power BI row data */
    powerBiAttributes: Record<string, unknown>;
    /** All Power BI row indices this feature maps to (for joined features) */
    powerBiRowIndices: number[];
    /** All Power BI row keys this feature maps to */
    powerBiRowKeys: string[];
    /** Aggregated/joined attributes */
    joinedAttributes: Record<string, unknown>;
    /** Computed render value */
    renderValue?: unknown;
    /** Computed size value */
    sizeValue?: number;
    /** Computed label text */
    labelValue?: string;
    /** Is this feature currently selected */
    selected: boolean;
    /** Source Power BI row (for single-row features) */
    row?: DataRow;
    /** Source row index (for single-row features) */
    rowIndex?: number;
    /** Source row key (for single-row features) */
    rowKey?: string;
}

// ── Resolved Renderer ─────────────────────────────────────────────────

export type ResolvedMapRendererType =
    | "service"
    | "simple"
    | "uniqueValue"
    | "classBreaks"
    | "continuousColor"
    | "proportionalSize"
    | "heatmap"
    | "cluster"
    | "densityGrid";

export interface ResolvedMapRenderer {
    type: ResolvedMapRendererType;

    // Simple
    symbol?: ResolvedMapSymbol;

    // Unique Value
    field?: string;
    fieldSource?: "powerbi" | "service" | "joined";
    valueMap?: Map<string, ResolvedMapSymbol>;
    valueLabels?: Map<string, string>;
    defaultSymbol?: ResolvedMapSymbol;
    defaultLabel?: string;

    // Class Breaks
    method?: "equalInterval" | "quantile" | "naturalBreaks" | "manual";
    breaks?: ResolvedClassBreak[];
    colorRamp?: string[];
    classBreakResult?: ClassBreakResult;

    // Continuous
    minColor?: string;
    maxColor?: string;
    clamp?: boolean;
    domainMin?: number;
    domainMax?: number;

    // Proportional
    minSize?: number;
    maxSize?: number;
    baseColor?: string;

    // Heatmap
    weightField?: string;
    radius?: number;
    blur?: number;
    minOpacity?: number;
    heatGradient?: Record<number, string>;

    // Cluster
    clusterRadius?: number;
    disableAtZoom?: number;
    showCoverageOnHover?: boolean;
    clusterLabel?: "count" | "sum";
    aggregateField?: string;
    format?: string;
}

export interface ResolvedMapSymbol {
    shape?: "circle" | "square" | "diamond" | "triangle" | "line" | "fill";
    color?: string;
    fillColor?: string;
    size?: number;
    radius?: number;
    width?: number;
    weight?: number;
    opacity?: number;
    fillOpacity?: number;
    outlineColor?: string;
    outlineWidth?: number;
    dashArray?: string;
}

export interface ResolvedClassBreak {
    min: number;
    max: number;
    /** Computed classes use an exclusive upper boundary except for the final class. */
    maxInclusive?: boolean;
    label?: string;
    symbol: ResolvedMapSymbol;
}

export interface ClassBreakResult {
    breaks: ResolvedClassBreak[];
    requestedClassCount: number;
    effectiveClassCount: number;
    validValueCount: number;
    distinctValueCount: number;
    warnings: string[];
}

// ── Resolved Labels ───────────────────────────────────────────────────

export interface ResolvedMapLabels {
    enabled: boolean;
    field?: string;
    fieldSource?: "powerbi" | "service" | "joined";
    template?: string;
    placement: "center" | "above" | "below" | "left" | "right" | "lineCenter";
    minZoom?: number;
    maxZoom?: number;
    color: string;
    size: number;
    weight: number | string;
    haloColor?: string;
    haloSize?: number;
    backgroundColor?: string;
    padding?: number;
    collision: "none" | "hideOverlaps";
    maxLabels?: number;
}

// ── Resolved Popup ────────────────────────────────────────────────────

export interface ResolvedMapPopup {
    enabled: boolean;
    title?: string;
    fields: ResolvedMapPopupField[];
    actions: ResolvedMapPopupAction[];
    html?: string;
    defaultFieldSource?: "powerbi" | "service" | "joined";
}

export interface ResolvedMapPopupField {
    field: string;
    fieldSource: "powerbi" | "service" | "joined";
    label?: string;
    format?: string;
    display: "text" | "badge" | "number" | "date";
}

export interface ResolvedMapPopupAction {
    id: string;
    label: string;
    icon?: string;
    uiAction?: UiAction;
}

// ── Map Layer Diagnostics ─────────────────────────────────────────────

export interface MapLayerDiagnostics {
    /** Number of source features loaded */
    featureCount: number;
    /** Number of requests made */
    requestCount: number;
    /** Whether the layer is loading */
    loading: boolean;
    /** Error message if failed */
    error?: string;
    /** Source URL for ArcGIS layers */
    sourceUrl?: string;
    /** Source type */
    sourceType: MapLayerSourceType;
    /** Geometry type of the layer */
    geometryType: MapGeometryType;
    /** Service-provided object ID field */
    objectIdField?: string;
    /** Join field used */
    joinField?: string;
    /** For joined layers, the match statistics */
    joinDiagnostics?: MapJoinDiagnostics;
    /** Whether service symbology was used */
    usedServiceSymbology: boolean;
    /** Whether service labels were used */
    usedServiceLabels: boolean;
    /** Whether the result was served from cache */
    cacheUsed?: boolean;
    /** Query strategy used */
    queryStrategy?: string;
    /** Warning messages */
    warnings: string[];
    /** Structured author/runtime issues with stable codes. */
    issues?: MapLayerDiagnosticIssue[];
    effectiveDataset?: string;
    resolvedLocationMode?: "geometry" | "latLon" | "xy" | "address" | "none";
    resolvedBindings?: Record<string, string | string[] | undefined>;
    geometryTypeCounts?: Partial<Record<MapGeometryType, number>>;
    totalInputRows?: number;
    filteredRowCount?: number;
    validFeatureCount?: number;
    incompletePairCount?: number;
    nonNumericCount?: number;
    outOfRangeCount?: number;
    geometryParseFailureCount?: number;
    layerValueRequested?: string;
    layerValueMatched?: boolean;
    rendererFieldSource?: string;
    labelFieldSource?: string;
    sourceResolutionMs?: number;
    rendererCalculationMs?: number;
    layerRenderMs?: number;
    featureObjectsCreated?: number;
    featureObjectsPatched?: number;
    fullLayerRebuilds?: number;
    requestMs?: number;
    joinMs?: number;
}

export interface MapLayerDiagnosticIssue {
    code:
        | "MAP_LAYER_DATASET_NOT_FOUND"
        | "MAP_LAYER_FIELD_NOT_FOUND"
        | "MAP_LAYER_BINDING_INCOMPLETE"
        | "MAP_LAYER_NUMERIC_FIELD_REQUIRED"
        | "MAP_LAYER_EXTERNAL_FILTER_UNSUPPORTED"
        | "MAP_LAYER_VALUE_NOT_FOUND"
        | "MAP_LAYER_MIXED_GEOMETRY"
        | "MAP_LAYER_FEATURE_LIMIT"
        | "MAP_GLOBAL_FEATURE_LIMIT"
        | "MAP_FIELD_SOURCE_UNAVAILABLE"
        | "MAP_SERVICE_FIELD_NOT_FOUND"
        | "MAP_JOINED_FIELD_NOT_FOUND"
        | "MAP_FILTER_SOURCE_INVALID"
        | "MAP_VISIBILITY_SOURCE_INVALID"
        | "MAP_JOIN_CARDINALITY_POWERBI_VIOLATION"
        | "MAP_JOIN_CARDINALITY_SERVICE_VIOLATION"
        | "MAP_JOIN_UNMATCHED"
        | "MAP_JOIN_AGGREGATION_VALUES_DISCARDED"
        | "MAP_CAPABILITY_LIMITATION";
    severity: "info" | "warning" | "error";
    message: string;
    path?: string;
    details?: Record<string, unknown>;
}

export interface MapJoinDiagnostics {
    cardinality: "oneToOne" | "manyToOne";
    cardinalityValid: boolean;
    powerBiCardinalityViolationCount: number;
    serviceCardinalityViolationCount: number;
    samplePowerBiCardinalityViolations: string[];
    sampleServiceCardinalityViolations: string[];
    unmatchedPolicy: "ignore" | "warn" | "diagnose";
    detailedDiagnosticsRequested: boolean;
    powerBiRowCount: number;
    powerBiDistinctKeyCount: number;
    serviceFeatureCount: number;
    serviceDistinctKeyCount: number;
    matchedPowerBiRowCount: number;
    matchedServiceFeatureCount: number;
    unmatchedPowerBiKeyCount: number;
    unmatchedServiceFeatureCount: number;
    blankPowerBiKeyCount: number;
    blankServiceKeyCount: number;
    duplicatePowerBiKeyCount: number;
    duplicateServiceKeyCount: number;
    /** Count of service features suppressed due to duplicate policy */
    suppressedDuplicateServiceCount?: number;
    matchRate: number;
    sampleUnmatchedPowerBiKeys: string[];
    sampleUnmatchedServiceKeys: string[];
    sampleDuplicatePowerBiKeys: string[];
    sampleDuplicateServiceKeys: string[];
    aggregationDiagnostics: MapJoinAggregationDiagnostic[];
}

export interface MapJoinAggregationDiagnostic {
    alias: string;
    field: string;
    aggregation: string;
    inputCount: number;
    validCount: number;
    blankCount: number;
    discardedCount: number;
}

// ── Resolved Tile Configuration ───────────────────────────────────────

export interface ResolvedTileConfig {
    url: string;
    attribution?: string;
    minZoom?: number;
    maxZoom?: number;
}

// ── Resolved Dynamic Configuration ────────────────────────────────────

export interface ResolvedDynamicConfig {
    url: string;
    layerIds?: number[];
    layerDefinitions?: Record<number, string>;
    format?: "png" | "png24" | "png32" | "jpg";
    transparent?: boolean;
    minZoom?: number;
    maxZoom?: number;
    attribution?: string;
    debounceMs?: number;
}

// ── Resolved Tooltip ──────────────────────────────────────────────────

export interface ResolvedMapTooltip {
    enabled: boolean;
    fields?: ResolvedMapPopupField[];
    template?: string;
    defaultFieldSource?: "powerbi" | "service" | "joined";
}

// ── Resolved Layer ────────────────────────────────────────────────────

export interface ResolvedMapLayer {
    id: string;
    name: string;
    sourceType: MapLayerSourceType;
    /** Stable dataset/service identity; layerId remains an independent namespace. */
    sourceIdentity?: string;
    capabilities?: MapLayerCapabilities;
    geometryType: MapGeometryType;
    visible: boolean;
    opacity: number;
    order: number;
    groupId?: string;
    datasetName?: string;
    features: ResolvedMapFeature[];
    renderer: ResolvedMapRenderer;
    labels?: ResolvedMapLabels;
    popup?: ResolvedMapPopup;
    tooltip?: ResolvedMapTooltip;
    interaction?: ComponentInteractionDefinition;
    legend?: {
        visible?: boolean;
        title?: string;
        collapsed?: boolean;
    };
    extent?: GeoJSON.BBox;
    diagnostics: MapLayerDiagnostics;
    loading: boolean;
    error?: string;
    /** Source-specific tile configuration */
    tile?: ResolvedTileConfig;
    /** Source-specific dynamic configuration */
    dynamic?: ResolvedDynamicConfig;
    visibility?: import("../../schema/mapSchema").MapVisibilityDefinition;
}
