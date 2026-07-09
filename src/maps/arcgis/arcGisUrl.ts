// ── ArcGIS URL Handling ──────────────────────────────────────────────
// Parses, normalizes, and validates ArcGIS REST service URLs.

export interface ParsedArcGisUrl {
    originalUrl: string;
    normalizedUrl: string;
    serviceType: "FeatureServer" | "MapServer" | "unknown";
    serviceRootUrl?: string;
    layerUrl?: string;
    layerId?: number;
    isServiceRoot: boolean;
    isLayer: boolean;
}

const ARCGIS_REST_PATH = /\/arcgis\/rest\/services\//i;
const FEATURE_SERVER = /FeatureServer\/?$/i;
const MAP_SERVER = /MapServer\/?$/i;
const LAYER_PATTERN = /(FeatureServer|MapServer)\/(\d+)/i;

export function parseArcGisUrl(input: string): ParsedArcGisUrl {
    const originalUrl = input.trim();

    // Security: reject dangerous URLs
    const lower = originalUrl.toLowerCase();
    if (lower.startsWith("javascript:") || lower.startsWith("data:") || lower.startsWith("file:")) {
        return invalidUrl(originalUrl, "Unsupported protocol");
    }
    if (lower.includes("@") && (lower.includes("://") && lower.indexOf("@") < lower.indexOf("://") + 10)) {
        return invalidUrl(originalUrl, "Credentials in URL are not allowed");
    }

    // Strip query string and fragment
    let normalized = originalUrl.split("?")[0].split("#")[0];
    // Remove trailing slash (unless it's a service root)
    if (normalized.endsWith("/") && !/(FeatureServer|MapServer)\/$/i.test(normalized)) {
        normalized = normalized.slice(0, -1);
    }

    // Validate it's an ArcGIS REST path
    if (!ARCGIS_REST_PATH.test(normalized)) {
        return { originalUrl, normalizedUrl: normalized, serviceType: "unknown", isServiceRoot: false, isLayer: false };
    }

    // Detect service type
    let serviceType: ParsedArcGisUrl["serviceType"] = "unknown";
    if (/FeatureServer/i.test(normalized)) serviceType = "FeatureServer";
    else if (/MapServer/i.test(normalized)) serviceType = "MapServer";

    // Detect if it's a service root or layer
    const isServiceRoot = FEATURE_SERVER.test(normalized) || MAP_SERVER.test(normalized);
    const layerMatch = normalized.match(LAYER_PATTERN);

    let layerId: number | undefined;
    let serviceRootUrl: string | undefined;
    let layerUrl: string | undefined;

    if (layerMatch) {
        layerId = parseInt(layerMatch[2], 10);
        layerUrl = normalized;
        // Service root is the URL without the layer ID
        serviceRootUrl = normalized.replace(LAYER_PATTERN, "$1");
    } else if (isServiceRoot) {
        serviceRootUrl = normalized;
    }

    return {
        originalUrl,
        normalizedUrl: normalized,
        serviceType,
        serviceRootUrl,
        layerUrl,
        layerId,
        isServiceRoot,
        isLayer: layerId !== undefined,
    };
}

function invalidUrl(url: string, reason: string): ParsedArcGisUrl {
    return {
        originalUrl: url,
        normalizedUrl: "",
        serviceType: "unknown",
        isServiceRoot: false,
        isLayer: false,
    };
}

export function isRecognizedArcGisUrl(url: string): boolean {
    const parsed = parseArcGisUrl(url);
    return parsed.serviceType !== "unknown" && parsed.normalizedUrl.length > 0;
}

export function buildArcGisQueryUrl(layerUrl: string): string {
    return `${layerUrl}/query`;
}
