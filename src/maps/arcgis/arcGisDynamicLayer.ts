// ── ArcGIS Dynamic Layer ──────────────────────────────────────────────
// Handles ArcGIS Dynamic Map Service rendering via /export endpoint.
// Renders PNG image overlays on Leaflet maps, refreshing on move/resize.

import * as L from "leaflet";
import { getArcGisBlob } from "./arcGisRestClient";
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
    pane?: string;
}

export interface ArcGisDynamicLeafletLayer extends L.Layer {
    setOpacity(value: number): this;
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
): ArcGisDynamicLeafletLayer {
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
        pane,
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
        pane,
    });

    let currentAbortController: AbortController | null = null;
    let debounceTimer: ReturnType<typeof setTimeout> | null = null;
    let mapRef: L.Map | null = null;
    let activeObjectUrl: string | null = null;
    let wasWithinZoom = false;
    let requestGeneration = 0;
    let disposed = true;
    let externalAbortAttached = false;

    // Extend the layer with map event binding
    const originalOnAdd = imageOverlay.onAdd;
    const originalOnRemove = imageOverlay.onRemove;

    (imageOverlay as unknown as { onAdd: (map: L.Map) => HTMLElement | undefined }).onAdd = function (map: L.Map) {
        if (originalOnAdd) originalOnAdd.call(imageOverlay, map);
        disposed = false;
        mapRef = map;
        attachExternalAbort();
        setupMapListeners(map);
        wasWithinZoom = isWithinZoom(map);
        checkZoomVisibility();
        if (wasWithinZoom && !externalSignal?.aborted) void refreshImage(map);
        return imageOverlay.getElement() || undefined;
    };

    const onExternalAbort = () => {
        cancelCurrentRequest();
    };
    const attachExternalAbort = () => {
        if (!externalSignal || externalAbortAttached) return;
        if (externalSignal.aborted) onExternalAbort();
        else {
            externalSignal.addEventListener("abort", onExternalAbort, { once: true });
            externalAbortAttached = true;
        }
    };
    const detachExternalAbort = () => {
        if (!externalSignal || !externalAbortAttached) return;
        externalSignal.removeEventListener("abort", onExternalAbort);
        externalAbortAttached = false;
    };

    (imageOverlay as unknown as Record<string, unknown>).onRemove = function (map: L.Map) {
        disposed = true;
        if (originalOnRemove) originalOnRemove.call(imageOverlay, map);
        removeMapListeners(map);
        cancelCurrentRequest();
        detachExternalAbort();
        if (debounceTimer) {
            clearTimeout(debounceTimer);
            debounceTimer = null;
        }
        if (activeObjectUrl) {
            URL.revokeObjectURL(activeObjectUrl);
            activeObjectUrl = null;
        }
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
        const el = imageOverlay.getElement();
        const withinZoom = isWithinZoom(mapRef);
        if (el) el.style.display = withinZoom ? "" : "none";
        if (!withinZoom) {
            cancelCurrentRequest();
        } else if (!wasWithinZoom && !externalSignal?.aborted) {
            void refreshImage(mapRef);
        }
        wasWithinZoom = withinZoom;
    };

    const debouncedRefresh = () => {
        if (!mapRef || !isWithinZoom(mapRef) || externalSignal?.aborted) return;
        if (debounceTimer) {
            clearTimeout(debounceTimer);
            debounceTimer = null;
        }
        debounceTimer = setTimeout(() => {
            debounceTimer = null;
            if (mapRef && isWithinZoom(mapRef) && !externalSignal?.aborted) void refreshImage(mapRef);
        }, debounceMs);
    };

    function cancelCurrentRequest() {
        requestGeneration++;
        if (currentAbortController) {
            currentAbortController.abort();
            currentAbortController = null;
        }
    }

    const refreshImage = async (map: L.Map) => {
        if (!isWithinZoom(map) || externalSignal?.aborted) return;
        cancelCurrentRequest();
        const controller = new AbortController();
        currentAbortController = controller;
        const generation = requestGeneration;

        if (externalSignal?.aborted || controller.signal.aborted) return;

        const isCurrent = () =>
            !disposed &&
            mapRef === map &&
            currentAbortController === controller &&
            requestGeneration === generation &&
            !controller.signal.aborted &&
            !externalSignal?.aborted;
        let requestObjectUrl: string | null = null;

        try {
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

            const { blob } = await getArcGisBlob(fullUrl, { signal: controller.signal });
            if (!isCurrent()) return;
            requestObjectUrl = URL.createObjectURL(blob);

            // Preload image to ensure it's ready before swap
            const img = new Image();
            await preloadImage(img, requestObjectUrl, controller.signal);
            if (!isCurrent()) return;

            // Swap: capture old URL, set new image, then revoke old
            const previous = activeObjectUrl;
            imageOverlay.setUrl(requestObjectUrl);
            imageOverlay.setBounds(map.getBounds());
            activeObjectUrl = requestObjectUrl;
            requestObjectUrl = null;

            if (previous) {
                URL.revokeObjectURL(previous);
            }

            if (isCurrent())
                onStateChange?.({ loading: false, lastRequestTime: Date.now() });

        } catch (error) {
            if (error instanceof DOMException && error.name === "AbortError") {
                return;
            }
            const message = error instanceof Error ? error.message : String(error);
            if (isCurrent()) onStateChange?.({ loading: false, error: message });
        } finally {
            if (requestObjectUrl) URL.revokeObjectURL(requestObjectUrl);
            if (currentAbortController === controller) {
                currentAbortController = null;
            }
        }
    };

    function isWithinZoom(map: L.Map): boolean {
        const zoom = map.getZoom();
        return (minZoom === undefined || zoom >= minZoom) &&
            (maxZoom === undefined || zoom <= maxZoom);
    }

    return imageOverlay as unknown as ArcGisDynamicLeafletLayer;
}

function preloadImage(image: HTMLImageElement, source: string, signal: AbortSignal): Promise<void> {
    return new Promise((resolve, reject) => {
        if (signal.aborted) {
            reject(signal.reason ?? new DOMException("Image preload was aborted.", "AbortError"));
            return;
        }
        let settled = false;
        const finish = (callback: () => void) => {
            if (settled) return;
            settled = true;
            image.onload = null;
            image.onerror = null;
            signal.removeEventListener("abort", onAbort);
            callback();
        };
        const onAbort = () => finish(() => reject(signal.reason ?? new DOMException("Image preload was aborted.", "AbortError")));
        image.onload = () => finish(resolve);
        image.onerror = () => finish(() => reject(new Error("Image preload failed")));
        signal.addEventListener("abort", onAbort, { once: true });
        image.src = source;
    });
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
