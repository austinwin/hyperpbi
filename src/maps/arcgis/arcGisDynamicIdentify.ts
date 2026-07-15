import type { GeoJsonObject } from "geojson";
import type { ArcGisDynamicIdentifyDefinition } from "../../schema/mapSchema";
import { esriToGeoJson } from "./arcGisGeometryConverter";
import { checkHostPolicy } from "./arcGisHostPolicy";
import { postArcGisForm } from "./arcGisRestClient";
import type { EsriGeometry } from "./arcGisServiceTypes";
import { parseArcGisUrl } from "./arcGisUrl";

export interface ArcGisDynamicIdentifyRequest {
  url: string;
  latitude: number;
  longitude: number;
  mapExtent: [number, number, number, number];
  imageWidth: number;
  imageHeight: number;
  layerIds?: number[];
  layerDefinitions?: Record<number, string>;
  identify?: ArcGisDynamicIdentifyDefinition;
  signal?: AbortSignal;
}

export interface ArcGisDynamicIdentifyResult {
  resultId: string;
  layerId: number;
  layerName: string;
  displayFieldName?: string;
  label: string;
  attributes: Record<string, unknown>;
  geometry: GeoJsonObject | null;
  geometryType?: string;
}

interface ArcGisIdentifyResponse {
  results?: ArcGisIdentifyResponseResult[];
}

interface ArcGisIdentifyResponseResult {
  layerId?: number;
  layerName?: string;
  displayFieldName?: string;
  value?: unknown;
  attributes?: Record<string, unknown>;
  geometry?: EsriGeometry;
  geometryType?: string;
}

const DEFAULT_TOLERANCE = 6;
const DEFAULT_MAX_RESULTS = 10;

/** Executes a single user-driven MapServer identify request in WGS84. */
export async function executeArcGisDynamicIdentify(
  request: ArcGisDynamicIdentifyRequest,
): Promise<ArcGisDynamicIdentifyResult[]> {
  const parsed = parseArcGisUrl(request.url);
  const serviceUrl = parsed.isLayer
    ? parsed.serviceRootUrl
    : parsed.normalizedUrl;
  if (parsed.serviceType !== "MapServer" || !serviceUrl)
    throw new Error("Dynamic identify requires an ArcGIS MapServer URL.");
  const normalizedServiceUrl = serviceUrl.replace(/\/$/, "");
  const policy = checkHostPolicy(normalizedServiceUrl);
  if (!policy.allowed)
    throw new Error(policy.reason ?? `Host not permitted: ${policy.host}`);

  const width = positiveInteger(request.imageWidth, 1);
  const height = positiveInteger(request.imageHeight, 1);
  const tolerance = boundedInteger(
    request.identify?.tolerance,
    DEFAULT_TOLERANCE,
    0,
    50,
  );
  const layerOption = request.identify?.layerOption ?? "visible";
  const layerIds = request.layerIds?.filter(Number.isFinite);
  const layers = layerIds?.length
    ? `${layerOption}:${layerIds.join(",")}`
    : layerOption;
  const parameters: Record<string, string> = {
    f: "json",
    geometry: JSON.stringify({
      x: request.longitude,
      y: request.latitude,
      spatialReference: { wkid: 4326 },
    }),
    geometryType: "esriGeometryPoint",
    sr: "4326",
    tolerance: String(tolerance),
    mapExtent: request.mapExtent.join(","),
    imageDisplay: `${width},${height},96`,
    returnGeometry: "true",
    returnFieldName: "false",
    layers,
  };
  if (request.layerDefinitions && Object.keys(request.layerDefinitions).length)
    parameters.layerDefs = JSON.stringify(request.layerDefinitions);

  const response = await postArcGisForm<ArcGisIdentifyResponse>(
    `${normalizedServiceUrl}/identify`,
    parameters,
    { signal: request.signal, retries: 0 },
  );
  const maxResults = boundedInteger(
    request.identify?.maxResults,
    DEFAULT_MAX_RESULTS,
    1,
    25,
  );
  return (response.results ?? []).slice(0, maxResults).map((result, index) => {
    const attributes = result.attributes ?? {};
    const layerId = Number.isFinite(result.layerId) ? result.layerId! : -1;
    const objectIdentity = identifyObjectIdentity(attributes);
    const label = identifyResultLabel(result, attributes, index);
    return {
      resultId: `${layerId}:${objectIdentity ?? `result-${index + 1}`}`,
      layerId,
      layerName: result.layerName || `Sublayer ${layerId}`,
      displayFieldName: result.displayFieldName,
      label,
      attributes,
      geometry: esriToGeoJson(result.geometry),
      geometryType: result.geometryType,
    };
  });
}

function identifyObjectIdentity(
  attributes: Record<string, unknown>,
): string | undefined {
  const preferred = ["objectid", "fid", "oid", "globalid", "id"];
  const entry = Object.entries(attributes).find(([key, value]) =>
    preferred.includes(key.toLowerCase()) && value !== null && value !== undefined,
  );
  return entry ? String(entry[1]) : undefined;
}

function identifyResultLabel(
  result: ArcGisIdentifyResponseResult,
  attributes: Record<string, unknown>,
  index: number,
): string {
  if (result.value !== null && result.value !== undefined && String(result.value))
    return String(result.value);
  if (result.displayFieldName) {
    const direct = attributes[result.displayFieldName];
    if (direct !== null && direct !== undefined && String(direct))
      return String(direct);
  }
  return identifyObjectIdentity(attributes) ?? `${result.layerName || "Result"} ${index + 1}`;
}

function positiveInteger(value: number, fallback: number): number {
  return Number.isFinite(value) && value > 0 ? Math.round(value) : fallback;
}

function boundedInteger(
  value: number | undefined,
  fallback: number,
  minimum: number,
  maximum: number,
): number {
  if (!Number.isFinite(value)) return fallback;
  return Math.max(minimum, Math.min(maximum, Math.round(value!)));
}
