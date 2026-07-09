// ── ArcGIS Dynamic Layer ──────────────────────────────────────────────
// Handles ArcGIS Dynamic Map Service rendering via /export endpoint.
// Renders PNG image overlays on Leaflet maps, refreshing on move/resize.

import * as L from "leaflet";
import { getArcGisJson, ArcGisServiceError } from "./arcGisRestClient";
import { parseArcGisUrl } from "./arcGisUrl";
import { checkHostPolicy } from "./arcGisHostPolicy";

export interface ArcGisDynamicLayerOptions {
    url: string;
    layerIds?: number[];
    layerDefinitions?: Record<number, string>;
    opacity?: number;
    minZoom?: number;
    maxZoom?: number;
    attribution?: string;
    format?: "png" | "png24" | "png32" | "jpg";
    transparent?: boolean;
    debounceMs?: number;
    signal?: AbortSignal;
}

export interface ArcGisDynamicLayerState {
    loading: boolean;
    error?: string;
    lastRequestTime?: number;
}

/**
 * Create a Leaflet image overlay layer that auto-refreshes from an ArcGIS
 * Dynamic Map Service /export endpoint on map move/resize events.
 */
export function createArcGisDynamicLayer(
    options: ArcGisDynamicLayerOptions,
    onStateChange?: (state: ArcGisDynamicLayerState) => void
): L.Layer {
    const {
        url,
        layerIds,
        layerDefinitions,
        opacity = 1,
        minZoom,
        maxZoom,
        attribution = "",
        format = "png",
        transparent = true,
        debounceMs = 300,
        signal: externalSignal,
    } = options;

    // Normalize URL: get MapServer export endpoint
    const parsed = parseArcGisUrl(url);
    const serviceUrl = parsed.isLayer
        ? parsed.serviceRootUrl ?? parsed.normalizedUrl
        : parsed.normalizedUrl;

    if (parsed.serviceType !== "MapServer") {
        throw new Error("Dynamic layers require a MapServer URL.");
    }

    // Check host policy
    const hostPolicy = checkHostPolicy(serviceUrl);
    if (!hostPolicy.allowed) {
        throw new Error(hostPolicy.reason ?? `Host not permitted: ${hostPolicy.host}`);
    }

    const exportUrl = `${serviceUrl}/export`;

    // Create the image overlay
    const bounds: L.LatLngBoundsExpression = [[-90, -180], [90, 180]];
    const imageOverlay = L.imageOverlay("", bounds, {
        opacity,
        attribution,
        className: "hp-arcgis-dynamic-overlay",
    });

    let currentAbortController: AbortController | null = null;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    let mapRef: L.Map | null = null;
    let isLoading = false;

    // Extend the layer with map event binding
    const originalOnAdd = imageOverlay.onAdd;
    const originalOnRemove = imageOverlay.onRemove;

    (imageOverlay as any).onAdd = function (map: L.Map) {
        if (originalOnAdd) originalOnAdd.call(imageOverlay, map);
        mapRef = map;
        setupMapListeners(map);
        refreshImage(map);
        return imageOverlay.getElement() || undefined;
    };

    (imageOverlay as any).onRemove = function (map: L.Map) {
        if (originalOnRemove) originalOnRemove.call(imageOverlay, map);
        removeMapListeners(map);
        cancelCurrentRequest();
        mapRef = null;
        return imageOverlay;
    };

    const setupMapListeners = (map: L.Map) => {
        map.on("moveend", debouncedRefresh);
        map.on("resize", debouncedRefresh);
        map.on("zoomend", checkZoomVisibility);
    };

    const removeMapListeners = (map: L.Map) => {
        map.off("moveend", debouncedRefresh);
        map.off("resize", debouncedRefresh);
        map.off("zoomend", checkZoomVisibility);
    };

    const checkZoomVisibility = () => {
        if (!mapRef) return;
        const zoom = mapRef.getZoom();
        const el = imageOverlay.getElement();
        if (!el) return;

        if (minZoom !== undefined && zoom < minZoom) {
            el.style.display = "none";
        } else if (maxZoom !== undefined && zoom > maxZoom) {
            el.style.display = "none";
        } else {
            el.style.display = "";
        }
    };

    const debouncedRefresh = () => {
        if (debounceTimer) clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            if (mapRef) refreshImage(mapRef);
        }, debounceMs);
    };

    const cancelCurrentRequest = () => {
        if (currentAbortController) {
            currentAbortController.abort();
            currentAbortController = null;
        }
    };

    const refreshImage = async (map: L.Map) => {
        cancelCurrentRequest();
        const controller = new AbortController();
        currentAbortController = controller;

        if (externalSignal?.aborted || controller.signal.aborted) return;

        try {
            isLoading = true;
            onStateChange?.({ loading: true });

            const mapBounds = map.getBounds();
            const size = map.getSize();

            if (size.x === 0 || size.y === 0) {
                onStateChange?.({ loading: false });
                return;
            }

            const params = new URLSearchParams();
            params.set("f", "image");
            params.set("bbox", [
                mapBounds.getWest(),
                mapBounds.getSouth(),
                mapBounds.getEast(),
                mapBounds.getNorth(),
            ].join(","));
            params.set("bboxSR", "4326");
            params.set("imageSR", "4326");
            params.set("size", `${Math.round(size.x)},${Math.round(size.y)}`);
            params.set("format", format);
            params.set("transparent", String(transparent));

            if (layerIds && layerIds.length > 0) {
                params.set("layers", `show:${layerIds.join(",")}`);
            }
            if (layerDefinitions && Object.keys(layerDefinitions).length > 0) {
                params.set("layerDefs", JSON.stringify(layerDefinitions));
            }

            const fullUrl = `${exportUrl}?${params.toString()}`;

            // Load as blob for image data
            const response = await fetch(fullUrl, {
                signal: controller.signal,
                credentials: "omit",
                referrerPolicy: "no-referrer",
                cache: "no-store",
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const contentType = response.headers.get("content-type") ?? "";
            if (contentType.includes("application/json") || contentType.includes("text/")) {
                // ArcGIS may return JSON errors even for image requests
                const json = await response.json().catch(() => null);
                if (json?.error) {
                    throw new ArcGisServiceError(
                        json.error.code,
                        json.error.message ?? "Export error",
                        fullUrl,
                        json.error.details ?? []
                    );
                }
                throw new Error("Unexpected JSON response from export endpoint.");
            }

            const blob = await response.blob();
            const objectUrl = URL.createObjectURL(blob);

            // Capture old URL before setting new one
            const prevUrl = (imageOverlay as unknown as Record<string, unknown>)._url as string | undefined;

            // Preload image to ensure it's ready before swap
            const img = new Image();
            await new Promise<void>((resolve, reject) => {
                img.onload = () => resolve();
                img.onerror = () => reject(new Error("Image preload failed"));
                img.src = objectUrl;
            });

            // Swap: set new image, then revoke old
            imageOverlay.setUrl(objectUrl);
            imageOverlay.setBounds(map.getBounds());

            // Revoke old blob URL after successful swap
            if (prevUrl && prevUrl.startsWith("blob:")) {
                URL.revokeObjectURL(prevUrl);
            }

            isLoading = false;
            onStateChange?.({ loading: false, lastRequestTime: Date.now() });

        } catch (error) {
            if (error instanceof DOMException && error.name === "AbortError") {
                // Request was cancelled, which is expected
                isLoading = false;
                return;
            }

            const message = error instanceof Error ? error.message : String(error);
            isLoading = false;
            onStateChange?.({ loading: false, error: message });
        } finally {
            if (currentAbortController === controller) {
                currentAbortController = null;
            }
        }
    };

    return imageOverlay;
}

/**
 * Build a tile URL template for ArcGIS MapServer tile layers.
 * Converts:
 *   https://host/.../MapServer → https://host/.../MapServer/tile/{z}/{y}/{x}
 * Also supports URLs already containing {z}, {x}, {y} placeholders.
 */
export function buildArcGisTileUrl(url: string): string {
    const parsed = parseArcGisUrl(url);

    // If URL already contains tile placeholders, use as-is
    if (/\{z\}|\{x\}|\{y\}/.test(url)) {
        return url;
    }

    // MapServer → tile endpoint
    if (parsed.serviceType === "MapServer") {
        const base = parsed.normalizedUrl.replace(/\/$/, "");
        return `${base}/tile/{z}/{y}/{x}`;
    }

    // FeatureServer URLs cannot be used as tile layers
    if (parsed.serviceType === "FeatureServer") {
        throw new Error(
            "FeatureServer URLs cannot be used as tile layers. " +
            "Use a MapServer URL or a feature layer with arcgisFeature source type instead."
        );
    }

    throw new Error(`Cannot build tile URL from: ${url}`);
}
