// ── Map Layer Schema ──────────────────────────────────────────────────
// Defines the full declarative map layer model for HyperPBI.
// Imported by hyperpbiSchema.ts for the MapComponent.layers[] property.

import type { ComponentInteractionDefinition } from "../interactions/interactionTypes";
import type { MapBindingKeys } from "../data/normalizeData";
import type { UiAction } from "./uiSchema";

// ── Source Types ──────────────────────────────────────────────────────

export type MapLayerSourceType =
    | "powerbi"
    | "arcgisFeature"
    | "arcgisTile"
    | "arcgisDynamic";

export type MapGeometryType =
    | "point"
    | "multipoint"
    | "polyline"
    | "polygon"
    | "mixed"
    | "unknown";

// ── View & Basemap ────────────────────────────────────────────────────

export interface MapViewDefinition {
    /** Leaflet center order: [latitude, longitude]. */
    center?: [number, number];
    zoom?: number;
    minZoom?: number;
    maxZoom?: number;
    fitMode?: "data" | "allVisibleLayers" | "firstLayer" | "none";
    fitPadding?: number;
    preserveView?: boolean;
}

export interface MapBasemapDefinition {
    type?: "none" | "osm" | "customTile" | "arcgisTile";
    url?: string;
    attribution?: string;
    maxZoom?: number;
    visible?: boolean;
}

export interface MapSearchDefinition {
    enabled?: boolean;
    placeholder?: string;
    zoom?: number;
    showResultMarker?: boolean;
    clearMarkerOnClose?: boolean;
    /** Apply the first result automatically; defaults to true. */
    autoSelectFirst?: boolean;
}

export interface MapLegendDefinition {
    defaultOpen?: boolean;
}

export interface MapFeatureDetailsDefinition {
    /** auto anchors on roomy maps and becomes a panel/sheet in small containers. */
    mode?: "auto" | "anchored" | "panel";
    clearSelectionOnBackgroundClick?: boolean;
    clearSelectionOnClose?: boolean;
}

export interface MapViewBookmarkDefinition {
    id: string;
    label: string;
    /** Leaflet center order: [latitude, longitude]. */
    center: [number, number];
    zoom: number;
}

export interface MapLayerGroupDefinition {
    id: string;
    name: string;
    visible?: boolean;
    collapsed?: boolean;
    opacity?: number;
    order?: number;
}

// ── Layer Definition ──────────────────────────────────────────────────

export interface MapLayerDefinition {
    id: string;
    name: string;
    /** Logical row view for this layer. Falls back to the map component dataset, then powerbi. */
    dataset?: string;
    /** Optional canonical group membership. */
    groupId?: string;

    visible?: boolean;
    opacity?: number;
    order?: number;

    source: MapLayerSourceDefinition;

    join?: MapJoinDefinition;
    renderer?: MapRendererDefinition;
    labels?: MapLabelDefinition;
    popup?: MapPopupDefinition;
    tooltip?: MapTooltipDefinition;
    visibility?: MapVisibilityDefinition;
    performance?: MapPerformanceDefinition;
    filter?: MapLayerFilterDefinition | MapLayerFilterDefinition[];

    interaction?: ComponentInteractionDefinition;

    legend?: {
        visible?: boolean;
        title?: string;
        collapsed?: boolean;
    };
}

export interface MapLayerFilterDefinition {
    field: string;
    fieldSource?: "powerbi" | "service" | "joined";
    operator: "=" | "!=" | ">" | ">=" | "<" | "<=" | "contains" | "in" | "between";
    value: unknown;
}

// ── Source Definitions ────────────────────────────────────────────────

export type MapLayerSourceDefinition =
    | PowerBiMapLayerSource
    | ArcGisFeatureLayerSource
    | ArcGisTileLayerSource
    | ArcGisDynamicLayerSource;

export interface PowerBiMapLayerSource {
    type: "powerbi";
    bindings?: Partial<MapBindingKeys>;
    layerValue?: string;
}

export interface ArcGisFeatureLayerSource {
    type: "arcgisFeature";
    url: string;
    layerId?: number;
    useServiceRenderer?: boolean;
    useServiceLabels?: boolean;
    definitionExpression?: string;
    outFields?: string[];
    mode?: "reference" | "join";
    refreshIntervalMinutes?: number;
}

export interface ArcGisTileLayerSource {
    type: "arcgisTile";
    url: string;
    attribution?: string;
    minZoom?: number;
    maxZoom?: number;
}

export interface ArcGisDynamicLayerSource {
    type: "arcgisDynamic";
    url: string;
    layerIds?: number[];
    layerDefinitions?: Record<number, string>;
    format?: "png" | "png24" | "png32" | "jpg";
    transparent?: boolean;
    minZoom?: number;
    maxZoom?: number;
    attribution?: string;
    debounceMs?: number;
    /** Read-only click identify. Results are temporary and never participate in joins or selection. */
    identify?: ArcGisDynamicIdentifyDefinition;
}

export interface ArcGisDynamicIdentifyDefinition {
    enabled?: boolean;
    tolerance?: number;
    layerOption?: "visible" | "all" | "top";
    maxResults?: number;
}

// ── Join ──────────────────────────────────────────────────────────────

export type MapJoinNormalization =
    | "trim"
    | "upper"
    | "lower"
    | "removeNonAlphanumeric"
    | "numberString";

export interface MapJoinDefinition {
    enabled: boolean;
    powerBiField: string;
    serviceField: string;
    cardinality?: "oneToOne" | "manyToOne";
    keyType?: "auto" | "string" | "number";
    normalization?: MapJoinNormalization[];
    powerBiDuplicatePolicy?: "aggregate" | "first" | "error";
    serviceDuplicatePolicy?: "first" | "all" | "error";
    unmatchedPolicy?: "ignore" | "warn" | "diagnose";
    aggregations?: MapJoinAggregation[];
    queryStrategy?: "auto" | "keyBatches";
}

export interface MapJoinAggregation {
    field: string;
    aggregation: "count" | "distinctCount" | "sum" | "avg" | "min" | "max" | "first" | "last";
    as: string;
}

// ── Renderers ─────────────────────────────────────────────────────────

export type MapRendererDefinition =
    | ServiceMapRenderer
    | SimpleMapRenderer
    | UniqueValueMapRenderer
    | ClassBreaksMapRenderer
    | ContinuousColorMapRenderer
    | ProportionalSizeMapRenderer
    | HeatmapMapRenderer
    | ClusterMapRenderer
    | DensityGridMapRenderer;

export interface ServiceMapRenderer {
    type: "service";
}

export interface SimpleMapRenderer {
    type: "simple";
    symbol: MapSymbolDefinition;
}

export interface UniqueValueMapRenderer {
    type: "uniqueValue";
    field: string;
    fieldSource?: "powerbi" | "service" | "joined";
    values?: Array<{
        value: unknown;
        label?: string;
        symbol: MapSymbolDefinition;
    }>;
    defaultSymbol?: MapSymbolDefinition;
    defaultLabel?: string;
}

export interface ClassBreaksMapRenderer {
    type: "classBreaks";
    field: string;
    fieldSource?: "powerbi" | "service" | "joined";
    method?: "equalInterval" | "quantile" | "manual";
    classes?: number;
    breaks?: Array<{
        min: number;
        max: number;
        label?: string;
        symbol: MapSymbolDefinition;
    }>;
    colorRamp?: string[];
}

export interface ContinuousColorMapRenderer {
    type: "continuousColor";
    field: string;
    fieldSource?: "powerbi" | "service" | "joined";
    minColor: string;
    maxColor: string;
    clamp?: boolean;
}

export interface ProportionalSizeMapRenderer {
    type: "proportionalSize";
    field: string;
    fieldSource?: "powerbi" | "service" | "joined";
    minSize?: number;
    maxSize?: number;
    color?: string;
}

export interface HeatmapMapRenderer {
    type: "heatmap";
    weightField?: string;
    fieldSource?: "powerbi" | "service" | "joined";
    radius?: number;
    blur?: number;
    minOpacity?: number;
    gradient?: Record<number, string>;
}

export interface ClusterMapRenderer {
    type: "cluster";
    radius?: number;
    disableAtZoom?: number;
    showCoverageOnHover?: boolean;
    clusterLabel?: "count" | "sum";
    aggregateField?: string;
    fieldSource?: "powerbi" | "service" | "joined";
    format?: string;
}

export interface DensityGridMapRenderer {
    type: "densityGrid";
    statistic?: "count" | "sum" | "avg";
    field?: string;
    fieldSource?: "powerbi" | "service" | "joined";
    cellSizePixels?: number;
    classes?: number;
    colorRamp?: string[];
}

// ── Symbol ────────────────────────────────────────────────────────────

export interface MapSymbolDefinition {
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

// ── Labels ────────────────────────────────────────────────────────────

export interface MapLabelDefinition {
    enabled?: boolean;
    field?: string;
    fieldSource?: "powerbi" | "service" | "joined";
    template?: string;
    placement?: "center" | "above" | "below" | "left" | "right" | "lineCenter";
    minZoom?: number;
    maxZoom?: number;
    color?: string;
    size?: number;
    weight?: number | string;
    haloColor?: string;
    haloSize?: number;
    backgroundColor?: string;
    padding?: number;
    collision?: "none" | "hideOverlaps";
    maxLabels?: number;
}

// ── Popup ─────────────────────────────────────────────────────────────

export interface MapPopupDefinition {
    enabled?: boolean;
    /** Namespace used by title and safe HTML template tokens. */
    defaultFieldSource?: "powerbi" | "service" | "joined";
    title?: string;
    fields?: Array<{
        field: string;
        fieldSource?: "powerbi" | "service" | "joined";
        label?: string;
        format?: string;
        display?: "text" | "badge" | "number" | "date";
    }>;
    actions?: Array<{
        id: string;
        label: string;
        icon?: string;
        uiAction?: UiAction;
    }>;
    html?: string;
}

// ── Tooltip ────────────────────────────────────────────────────────────

export interface MapTooltipFieldDefinition {
    field: string;
    fieldSource?: "powerbi" | "service" | "joined";
    label?: string;
    format?: string;
}

export interface MapTooltipDefinition {
    enabled?: boolean;
    /** Namespace used by tooltip template tokens. */
    defaultFieldSource?: "powerbi" | "service" | "joined";
    fields?: MapTooltipFieldDefinition[];
    template?: string;
}

// ── Visibility ────────────────────────────────────────────────────────

export interface MapVisibilityDefinition {
    minZoom?: number;
    maxZoom?: number;
    scaleDependent?: boolean;
    conditionField?: string;
    conditionFieldSource?: "powerbi" | "service" | "joined";
    conditionValues?: unknown[];
}

// ── Performance ───────────────────────────────────────────────────────

export interface MapPerformanceDefinition {
    maxFeatures?: number;
    cacheMinutes?: number;
    viewportQuery?: boolean;
    requestBatchSize?: number;
}
