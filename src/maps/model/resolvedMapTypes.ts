// ── Resolved Map Types ────────────────────────────────────────────────
// Runtime model for resolved map layers, features, and the full map document.

import type { MapLayerSourceType, MapGeometryType } from "../../schema/mapSchema";
import type { ComponentInteractionDefinition } from "../../interactions/interactionTypes";
import type { DataRow } from "../../data/normalizeData";

// ── Resolved Feature ──────────────────────────────────────────────────

export interface ResolvedMapFeature {
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
    defaultSymbol?: ResolvedMapSymbol;
    defaultLabel?: string;

    // Class Breaks
    method?: "equalInterval" | "quantile" | "naturalBreaks" | "manual";
    breaks?: ResolvedClassBreak[];
    colorRamp?: string[];

    // Continuous
    minColor?: string;
    maxColor?: string;
    clamp?: boolean;

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
    clusterLabel?: "count" | "sum";
    aggregateField?: string;
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
    label?: string;
    symbol: ResolvedMapSymbol;
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
    uiAction?: any;
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
    /** Warning messages */
    warnings: string[];
}

export interface MapJoinDiagnostics {
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
    matchRate: number;
    sampleUnmatchedPowerBiKeys: string[];
    sampleDuplicatePowerBiKeys: string[];
    sampleDuplicateServiceKeys: string[];
}

// ── Resolved Layer ────────────────────────────────────────────────────

export interface ResolvedMapLayer {
    id: string;
    name: string;
    sourceType: MapLayerSourceType;
    geometryType: MapGeometryType;
    visible: boolean;
    opacity: number;
    order: number;
    features: ResolvedMapFeature[];
    renderer: ResolvedMapRenderer;
    labels?: ResolvedMapLabels;
    popup?: ResolvedMapPopup;
    interaction?: ComponentInteractionDefinition;
    extent?: GeoJSON.BBox;
    diagnostics: MapLayerDiagnostics;
    loading: boolean;
    error?: string;
}

// ── Resolved Map Document ─────────────────────────────────────────────

export interface ResolvedMapDocument {
    layers: ResolvedMapLayer[];
    warnings: string[];
    errors: string[];
}
