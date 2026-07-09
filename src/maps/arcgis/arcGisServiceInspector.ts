// ── ArcGIS Service Inspector ─────────────────────────────────────────
// Inspects ArcGIS REST service endpoints to retrieve metadata.

import { getArcGisJson, ArcGisAuthError, ArcGisServiceError, ArcGisHttpError } from "./arcGisRestClient";
import { parseArcGisUrl } from "./arcGisUrl";
import { checkHostPolicy } from "./arcGisHostPolicy";
import type {
    ArcGisServiceInfo,
    ArcGisLayerMetadata,
    ArcGisLayerInfo,
    ArcGisServiceInspection,
    ArcGisLayerSummary,
} from "./arcGisServiceTypes";

export async function inspectArcGisService(serviceUrl: string): Promise<ArcGisServiceInspection> {
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
            errors: ["Not a recognized ArcGIS REST service URL. Provide a FeatureServer or MapServer URL."],
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
            errors: [hostPolicy.reason ?? `Host ${hostPolicy.host} is not permitted.`],
            warnings: [],
        };
    }

    try {
        if (parsed.isLayer) {
            return await inspectLayer(parsed.normalizedUrl, parsed.layerId!, parsed.serviceType);
        } else {
            return await inspectServiceRoot(parsed.normalizedUrl, parsed.serviceType);
        }
    } catch (error) {
        if (error instanceof ArcGisAuthError) {
            return {
                url: parsed.normalizedUrl,
                serviceType: parsed.serviceType,
                isLayer: parsed.isLayer,
                publicAccess: false,
                querySupported: false,
                layers: [],
                errors: ["This service requires ArcGIS authentication. HyperPBI currently supports public ArcGIS REST layers only."],
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

async function inspectServiceRoot(rootUrl: string, serviceType: "FeatureServer" | "MapServer"): Promise<ArcGisServiceInspection> {
    const response = await getArcGisJson<any>(`${rootUrl}?f=pjson`);

    const serviceInfo = response as ArcGisServiceInfo;
    const layers: ArcGisLayerSummary[] = [];

    // Process layers
    const allLayers = [...(serviceInfo.layers ?? []), ...(serviceInfo.tables ?? [])];
    for (const layerInfo of allLayers) {
        // Skip group/parent layers that have sublayers
        if (layerInfo.subLayerIds && layerInfo.subLayerIds.length > 0) continue;

        const layerUrl = `${rootUrl}/${layerInfo.id}`;
        let querySupported = false;
        let geometryType: string | undefined;

        // Quick check: try to get layer metadata
        try {
            const layerMeta = await getArcGisJson<ArcGisLayerMetadata>(`${layerUrl}?f=pjson`);
            const caps = layerMeta.capabilities ?? "";
            querySupported = caps.toLowerCase().includes("query");
            geometryType = layerMeta.geometryType;
        } catch {
            // If we can't inspect, still list the layer but mark as unavailable
        }

        layers.push({
            id: layerInfo.id,
            name: layerInfo.name,
            geometryType,
            querySupported,
            maxRecordCount: undefined,
            minScale: layerInfo.minScale,
            maxScale: layerInfo.maxScale,
        });
    }

    return {
        url: rootUrl,
        serviceType,
        isLayer: false,
        name: serviceInfo.mapName ?? serviceInfo.serviceDescription,
        description: serviceInfo.serviceDescription,
        layers,
        publicAccess: true,
        querySupported: layers.some(l => l.querySupported),
        warnings: [],
        errors: [],
    };
}

async function inspectLayer(layerUrl: string, layerId: number, serviceType: "FeatureServer" | "MapServer"): Promise<ArcGisServiceInspection> {
    const metadata = await getArcGisJson<ArcGisLayerMetadata>(`${layerUrl}?f=pjson`);

    const caps = metadata.capabilities ?? "";
    const querySupported = caps.toLowerCase().includes("query");

    const rootUrl = layerUrl.replace(/\/\d+$/, "");

    return {
        url: layerUrl,
        serviceType,
        isLayer: true,
        name: metadata.name,
        description: metadata.description,
        layers: [{
            id: metadata.id,
            name: metadata.name,
            geometryType: metadata.geometryType,
            querySupported,
            maxRecordCount: metadata.maxRecordCount,
            minScale: metadata.minScale,
            maxScale: metadata.maxScale,
        }],
        selectedLayer: metadata,
        publicAccess: true,
        querySupported,
        warnings: querySupported ? [] : ["This layer does not support query operations. Symbology, joins, labels, and popups requiring feature queries will be unavailable."],
        errors: [],
    };
}
