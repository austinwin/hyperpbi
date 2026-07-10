// ── Resolved Map Labels ───────────────────────────────────────────────
// Creates noninteractive Leaflet label groups for resolved map layers.
// Supports point, multipoint, polyline, polygon, and multipolygon.
// Basic label collision: hideOverlaps is not implemented.

import * as L from "leaflet";
import type { ResolvedMapLayer, ResolvedMapFeature } from "../../maps/model/resolvedMapTypes";
import { resolvedFeatureValue } from "../../maps/model/mapFeatureValue";
import { resolveSafeTemplate } from "./ResolvedMapPopup";

export interface ResolvedMapLabelRuntime {
    group: L.LayerGroup;
    cleanup: () => void;
    warnings: string[];
}

function getGeometryCenter(geometry: GeoJSON.GeoJsonObject): [number, number] | null {
    if (!geometry) return null;
    switch (geometry.type) {
        case "Point": {
            const c = (geometry as GeoJSON.Point).coordinates;
            return [c[1], c[0]];
        }
        case "MultiPoint": {
            const coords = (geometry as GeoJSON.MultiPoint).coordinates;
            if (coords.length === 0) return null;
            const sumLat = coords.reduce((s, c) => s + c[1], 0);
            const sumLon = coords.reduce((s, c) => s + c[0], 0);
            return [sumLat / coords.length, sumLon / coords.length];
        }
        case "LineString": {
            const coords = (geometry as GeoJSON.LineString).coordinates;
            if (coords.length === 0) return null;
            const mid = coords[Math.floor(coords.length / 2)];
            return [mid[1], mid[0]];
        }
        case "MultiLineString": {
            const lines = (geometry as GeoJSON.MultiLineString).coordinates;
            if (lines.length === 0) return null;
            let longest = lines[0];
            for (const line of lines) {
                if (line.length > longest.length) longest = line;
            }
            const mid = longest[Math.floor(longest.length / 2)];
            return [mid[1], mid[0]];
        }
        case "Polygon":
        case "MultiPolygon": {
            try {
                const geojson = L.geoJSON(geometry);
                const bounds = geojson.getBounds();
                if (bounds.isValid()) {
                    const center = bounds.getCenter();
                    return [center.lat, center.lng];
                }
            } catch { /* fall through */ }
            return null;
        }
        default:
            return null;
    }
}

function buildLabelIcon(
    labelText: string,
    labels: Exclude<ResolvedMapLayer["labels"], undefined>,
    placement: string,
): L.DivIcon | null {
    const span = document.createElement("span");
    span.className = "hp-map-label-text";
    span.textContent = labelText;
    span.style.color = labels.color ?? "#333";
    span.style.fontSize = `${labels.size ?? 12}px`;
    span.style.fontWeight = String(labels.weight ?? "normal");

    if (labels.haloColor && labels.haloSize) {
        span.style.textShadow = [
            `-${labels.haloSize}px -${labels.haloSize}px 0 ${labels.haloColor}`,
            `${labels.haloSize}px -${labels.haloSize}px 0 ${labels.haloColor}`,
            `-${labels.haloSize}px ${labels.haloSize}px 0 ${labels.haloColor}`,
            `${labels.haloSize}px ${labels.haloSize}px 0 ${labels.haloColor}`,
        ].join(", ");
    } else if (labels.haloColor) {
        span.style.textShadow = `0 0 3px ${labels.haloColor}`;
    }

    const offsets: Record<string, [number, number]> = {
        center: [0, 0],
        above: [0, -12],
        below: [0, 12],
        left: [-12, 0],
        right: [12, 0],
        lineCenter: [0, 0],
    };
    const offset = offsets[placement] ?? offsets.center;

    return L.divIcon({
        className: "hp-map-label",
        html: span.outerHTML,
        iconSize: [0, 0],
        iconAnchor: offset,
    });
}

export function createResolvedMapLabels(
    map: L.Map,
    layer: ResolvedMapLayer,
    options: {
        pane: string;
        visible: boolean;
    }
): ResolvedMapLabelRuntime {
    const warnings: string[] = [];
    const labels = layer.labels;
    if (!labels) {
        return { group: L.layerGroup(), cleanup: () => {}, warnings };
    }

    if (labels.collision === "hideOverlaps") {
        warnings.push(
            "Label collision mode hideOverlaps is not supported; labels are rendered without collision suppression."
        );
    }

    const group = L.layerGroup([], { pane: options.pane });

    const primaryPlacement = labels.placement ?? "center";

    // Collect label values
    const labelEntries: Array<{ feature: ResolvedMapFeature; text: string; pos: [number, number] | null }> = [];

    for (const feature of layer.features) {
        const labelText = labels.template
            ? resolveSafeTemplate(labels.template, feature, labels.fieldSource ?? "service")
            : feature.labelValue ?? (labels.field
                ? String(resolvedFeatureValue(feature, labels.field, labels.fieldSource ?? "service") ?? "")
                : feature.id);

        if (!labelText) continue;

        let pos: [number, number] | null = null;

        if (feature.lat !== null && feature.lon !== null) {
            pos = [feature.lat, feature.lon];
        } else if (feature.geometry) {
            pos = getGeometryCenter(feature.geometry);
        }

        if (!pos) continue;

        labelEntries.push({ feature, text: labelText, pos });
    }

    // Enforce maxLabels
    const maxLabels = labels.maxLabels;
    const finalEntries = maxLabels && maxLabels > 0
        ? labelEntries.slice(0, maxLabels)
        : labelEntries;

    for (const entry of finalEntries) {
        if (!entry.pos) continue;

        const icon = buildLabelIcon(entry.text, labels, primaryPlacement);
        if (!icon) continue;

        const marker = L.marker(entry.pos, {
            icon,
            interactive: false,
            keyboard: false,
        });

        group.addLayer(marker);
    }

    // Zoom visibility
    const handleZoom = () => {
        const zoom = map.getZoom();
        const belowMin = labels.minZoom !== undefined && zoom < labels.minZoom;
        const aboveMax = labels.maxZoom !== undefined && zoom > labels.maxZoom;
        const shouldShow = options.visible && !belowMin && !aboveMax;
        if (shouldShow && !map.hasLayer(group)) {
            group.addTo(map);
        } else if (!shouldShow && map.hasLayer(group)) {
            map.removeLayer(group);
        }
    };

    map.on("zoomend", handleZoom);
    handleZoom(); // Initial check

    return {
        group,
        cleanup: () => {
            map.off("zoomend", handleZoom);
            map.removeLayer(group);
            group.clearLayers();
        },
        warnings,
    };
}
