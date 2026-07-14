// ── ArcGIS Service Inspector ─────────────────────────────────────────
// Inspects ArcGIS REST service endpoints to retrieve metadata.

import {
  getArcGisJson,
  ArcGisAuthError,
  ArcGisServiceError,
} from "./arcGisRestClient";
import { parseArcGisUrl } from "./arcGisUrl";
import { checkHostPolicy } from "./arcGisHostPolicy";
import type {
  ArcGisServiceInfo,
  ArcGisLayerMetadata,
  ArcGisServiceInspection,
  ArcGisLayerSummary,
} from "./arcGisServiceTypes";

const successfulInspectionCache = new Map<string, ArcGisServiceInspection>();

export function clearArcGisServiceInspectionCache(): void {
  successfulInspectionCache.clear();
}

export async function inspectArcGisService(
  serviceUrl: string,
  { signal }: { signal?: AbortSignal } = {},
): Promise<ArcGisServiceInspection> {
  const parsed = parseArcGisUrl(serviceUrl);
  const warnings: string[] = [];
  const errors: string[] = [];

  if (parsed.serviceType === "unknown") {
    return {
      url: serviceUrl,
      serviceType: "FeatureServer",
      isLayer: false,
      publicAccess: false,
      querySupported: false,
      layers: [],
      errors: [
        "Not a recognized ArcGIS REST service URL. Provide a FeatureServer or MapServer URL.",
      ],
      warnings: [],
    };
  }

  // Check host policy
  const hostPolicy = checkHostPolicy(parsed.normalizedUrl);
  if (!hostPolicy.allowed) {
    return {
      url: parsed.normalizedUrl,
      serviceType: parsed.serviceType,
      isLayer: parsed.isLayer,
      publicAccess: false,
      querySupported: false,
      layers: [],
      errors: [
        hostPolicy.reason ?? `Host ${hostPolicy.host} is not permitted.`,
      ],
      warnings: [],
    };
  }

  try {
    const cached = successfulInspectionCache.get(parsed.normalizedUrl);
    if (cached) return cached;
    let inspection: ArcGisServiceInspection;
    if (parsed.isLayer) {
      inspection = await inspectLayer(
        parsed.normalizedUrl,
        parsed.layerId!,
        parsed.serviceType,
        signal,
      );
    } else {
      inspection = await inspectServiceRoot(
        parsed.normalizedUrl,
        parsed.serviceType,
        signal,
      );
    }
    if (!inspection.errors.length) successfulInspectionCache.set(parsed.normalizedUrl, inspection);
    return inspection;
  } catch (error) {
    if (signal?.aborted) throw error;
    if (error instanceof ArcGisAuthError) {
      return {
        url: parsed.normalizedUrl,
        serviceType: parsed.serviceType,
        isLayer: parsed.isLayer,
        publicAccess: false,
        querySupported: false,
        layers: [],
        errors: [
          "This service requires ArcGIS authentication. HyperPBI currently supports public ArcGIS REST layers only.",
        ],
        warnings: [],
      };
    }

    if (error instanceof ArcGisServiceError) {
      return {
        url: parsed.normalizedUrl,
        serviceType: parsed.serviceType,
        isLayer: parsed.isLayer,
        publicAccess: true,
        querySupported: false,
        layers: [],
        errors: [`Service error (${error.code}): ${error.message}`],
        warnings: [],
      };
    }

    const message = error instanceof Error ? error.message : String(error);
    return {
      url: parsed.normalizedUrl,
      serviceType: parsed.serviceType,
      isLayer: parsed.isLayer,
      publicAccess: false,
      querySupported: false,
      layers: [],
      errors: [`Could not inspect service: ${message}`],
      warnings: [],
    };
  }
}

async function inspectServiceRoot(
  rootUrl: string,
  serviceType: "FeatureServer" | "MapServer",
  signal?: AbortSignal,
): Promise<ArcGisServiceInspection> {
  const response = await getArcGisJson<any>(`${rootUrl}?f=pjson`, { signal });

  const serviceInfo = response as ArcGisServiceInfo;
  const tableIds = new Set((serviceInfo.tables ?? []).map((item) => item.id));
  const allItems = [...(serviceInfo.layers ?? []), ...(serviceInfo.tables ?? [])];
  const layers: ArcGisLayerSummary[] = allItems.slice(0, 10_000).map((item) => {
    const type = item.type?.toLowerCase() ?? "";
    const kind: ArcGisLayerSummary["kind"] = tableIds.has(item.id) || type.includes("table")
      ? "table"
      : item.subLayerIds?.length || type.includes("group")
        ? "groupLayer"
        : type.includes("feature") || type.includes("raster") || type.includes("layer") || !type
          ? "spatialLayer"
          : "unknown";
    return {
      id: item.id,
      name: item.name,
      kind,
      parentLayerId: item.parentLayerId,
      subLayerIds: item.subLayerIds,
      querySupported: kind === "spatialLayer",
      minScale: item.minScale,
      maxScale: item.maxScale,
    };
  });

  return {
    url: rootUrl,
    serviceType,
    isLayer: false,
    name: serviceInfo.mapName ?? serviceInfo.serviceDescription,
    description: serviceInfo.serviceDescription,
    layers,
    publicAccess: true,
    querySupported: layers.some((l) => l.querySupported),
    warnings:
      allItems.length > layers.length
        ? [`Service summary was bounded to ${layers.length} items.`]
        : [],
    errors: [],
  };
}

async function inspectLayer(
  layerUrl: string,
  layerId: number,
  serviceType: "FeatureServer" | "MapServer",
  signal?: AbortSignal,
): Promise<ArcGisServiceInspection> {
  const metadata = await getArcGisJson<ArcGisLayerMetadata>(
    `${layerUrl}?f=pjson`,
    { signal },
  );

  const caps = metadata.capabilities ?? "";
  const querySupported = caps.toLowerCase().includes("query");

  const rootUrl = layerUrl.replace(/\/\d+$/, "");

  return {
    url: layerUrl,
    serviceType,
    isLayer: true,
    name: metadata.name,
    description: metadata.description,
    layers: [
      {
        id: metadata.id,
        name: metadata.name,
        kind: metadata.geometryType ? "spatialLayer" : "table",
        geometryType: metadata.geometryType,
        querySupported,
        maxRecordCount: metadata.maxRecordCount,
        minScale: metadata.minScale,
        maxScale: metadata.maxScale,
        metadata,
      },
    ],
    selectedLayer: metadata,
    publicAccess: true,
    querySupported,
    warnings: querySupported
      ? []
      : [
          "This layer does not support query operations. Symbology, joins, labels, and popups requiring feature queries will be unavailable.",
        ],
    errors: [],
  };
}
