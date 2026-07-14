// ── ArcGIS Service Types ─────────────────────────────────────────────
// Types returned by ArcGIS REST service metadata endpoints.

export interface ArcGisServiceInfo {
  currentVersion: number;
  serviceDescription?: string;
  mapName?: string;
  description?: string;
  layers?: ArcGisLayerInfo[];
  tables?: ArcGisLayerInfo[];
  capabilities?: string;
  spatialReference?: { wkid: number; latestWkid?: number };
}

export interface ArcGisLayerInfo {
  id: number;
  name: string;
  type?: string;
  parentLayerId?: number;
  subLayerIds?: number[];
  defaultVisibility?: boolean;
  minScale?: number;
  maxScale?: number;
}

export interface ArcGisLayerMetadata {
  id: number;
  name: string;
  type?: string;
  description?: string;
  geometryType?: string;
  displayField?: string;
  objectIdField?: string;
  globalIdField?: string;
  fields?: ArcGisFieldInfo[];
  extent?: ArcGisExtent;
  spatialReference?: { wkid: number; latestWkid?: number };
  capabilities?: string;
  maxRecordCount?: number;
  standardMaxRecordCount?: number;
  supportedQueryFormats?: string;
  advancedQueryCapabilities?: {
    supportsPagination?: boolean;
    supportsStatistics?: boolean;
    supportsOrderBy?: boolean;
    supportsDistinct?: boolean;
    supportsReturningQueryExtent?: boolean;
  };
  drawingInfo?: {
    renderer?: ArcGisRendererDef;
    labelingInfo?: ArcGisLabelInfo[];
    transparency?: number;
  };
  minScale?: number;
  maxScale?: number;
  defaultVisibility?: boolean;
}

export interface ArcGisFieldInfo {
  name: string;
  type: string;
  alias?: string;
  length?: number;
  editable?: boolean;
  nullable?: boolean;
  domain?: unknown;
}

export interface ArcGisExtent {
  xmin: number;
  ymin: number;
  xmax: number;
  ymax: number;
  spatialReference?: { wkid: number };
}

// ── Renderer types from service metadata ──────────────────────────────

export interface ArcGisRendererDef {
  type: string;
  symbol?: ArcGisSymbolDef;
  field?: string;
  field1?: string;
  field2?: string;
  field3?: string;
  defaultSymbol?: ArcGisSymbolDef;
  defaultLabel?: string;
  uniqueValueInfos?: ArcGisUniqueValueInfo[];
  classBreakInfos?: ArcGisClassBreakInfo[];
  minValue?: number;
  maxValue?: number;
  classificationMethod?: string;
  normalizationField?: string;
  visualVariables?: Array<{ type?: string; field?: string }>;
  sizeInfo?: { field?: string };
  colorInfo?: { field?: string };
  colorRamp?: ArcGisColorRamp;
  rotationType?: string;
  rotationExpression?: string;
}

export interface ArcGisUniqueValueInfo {
  value: string;
  label?: string;
  description?: string;
  symbol: ArcGisSymbolDef;
}

export interface ArcGisClassBreakInfo {
  classMinValue: number;
  classMaxValue: number;
  label?: string;
  description?: string;
  symbol: ArcGisSymbolDef;
}

export interface ArcGisSymbolDef {
  type: string;
  style?: string;
  color?: number[];
  size?: number;
  width?: number;
  height?: number;
  angle?: number;
  xoffset?: number;
  yoffset?: number;
  outline?: {
    type?: string;
    style?: string;
    color?: number[];
    width?: number;
  };
  imageData?: string;
  contentType?: string;
}

export interface ArcGisColorRamp {
  type: string;
  fromColor?: number[];
  toColor?: number[];
  colorRamps?: ArcGisColorRamp[];
  algorithmicType?: string;
}

// ── Label info ────────────────────────────────────────────────────────

export interface ArcGisLabelInfo {
  labelPlacement?: string;
  labelExpression?: string;
  labelExpressionInfo?: { expression?: string };
  useCodedValues?: boolean;
  symbol?: {
    type: string;
    color?: number[];
    fontSize?: number;
    fontFamily?: string;
    fontWeight?: string;
    haloColor?: number[];
    haloSize?: number;
    backgroundColor?: number[];
    horizontalAlignment?: string;
    verticalAlignment?: string;
  };
  minScale?: number;
  maxScale?: number;
  where?: string;
}

// ── Query response types ──────────────────────────────────────────────

export interface ArcGisQueryResponse {
  objectIdFieldName?: string;
  globalIdFieldName?: string;
  geometryType?: string;
  spatialReference?: { wkid: number };
  fields?: ArcGisFieldInfo[];
  features?: ArcGisFeature[];
  exceededTransferLimit?: boolean;
  error?: { code: number; message: string; details: string[] };
}

export interface ArcGisFeature {
  attributes: Record<string, unknown>;
  geometry?: EsriGeometry;
}

export type EsriGeometry =
  EsriPoint | EsriMultiPoint | EsriPolyline | EsriPolygon;

export interface EsriPoint {
  x: number;
  y: number;
  z?: number;
  m?: number;
}
export interface EsriMultiPoint {
  points: number[][];
  hasZ?: boolean;
  hasM?: boolean;
}
export interface EsriPolyline {
  paths: number[][][];
  hasZ?: boolean;
  hasM?: boolean;
}
export interface EsriPolygon {
  rings: number[][][];
  hasZ?: boolean;
  hasM?: boolean;
}

// ── GeoJSON query response ────────────────────────────────────────────

export interface ArcGisGeoJsonResponse {
  type: "FeatureCollection";
  features: GeoJSON.Feature[];
  exceededTransferLimit?: boolean;
  error?: { code: number; message: string; details: string[] };
}

// ── Inspection result ─────────────────────────────────────────────────

export interface ArcGisServiceInspection {
  url: string;
  serviceType: "FeatureServer" | "MapServer";
  isLayer: boolean;
  name?: string;
  description?: string;
  layers: ArcGisLayerSummary[];
  selectedLayer?: ArcGisLayerMetadata;
  publicAccess: boolean;
  querySupported: boolean;
  warnings: string[];
  errors: string[];
}

export interface ArcGisLayerSummary {
  id: number;
  name: string;
  kind: "spatialLayer" | "table" | "groupLayer" | "unknown";
  parentLayerId?: number;
  subLayerIds?: number[];
  geometryType?: string;
  querySupported: boolean;
  maxRecordCount?: number;
  minScale?: number;
  maxScale?: number;
  metadata?: ArcGisLayerMetadata;
}
