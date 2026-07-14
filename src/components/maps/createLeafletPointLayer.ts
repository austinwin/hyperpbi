import * as L from "leaflet";
import type { LeafletFeatureStyle } from "../../maps/renderers/mapFeatureSymbol";

const escapeAttribute = (value: string): string => value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");

function polygonPoints(shape: "square" | "diamond" | "triangle", size: number): string {
    const middle = size / 2;
    if (shape === "triangle") return `${middle},1 ${size - 1},${size - 1} 1,${size - 1}`;
    if (shape === "diamond") return `${middle},1 ${size - 1},${middle} ${middle},${size - 1} 1,${middle}`;
    return `1,1 ${size - 1},1 ${size - 1},${size - 1} 1,${size - 1}`;
}
export function safePointSvg(shape: "square" | "diamond" | "triangle", style: LeafletFeatureStyle, layerOpacity: number): string {
    const radius = Math.max(2, Math.min(64, style.radius || 6));
    const size = Math.ceil(radius * 2 + Math.max(0, style.weight) * 2);
    const fill = escapeAttribute(style.fillColor);
    const stroke = escapeAttribute(style.color);
    const fillOpacity = Math.max(0, Math.min(1, style.fillOpacity * layerOpacity));
    const opacity = Math.max(0, Math.min(1, style.opacity * layerOpacity));
    const points = polygonPoints(shape, size);
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true" focusable="false"><polygon points="${points}" fill="${fill}" fill-opacity="${fillOpacity}" stroke="${stroke}" stroke-opacity="${opacity}" stroke-width="${Math.max(0, style.weight)}"/></svg>`;
}

export function createLeafletPointLayer(
    position: L.LatLngExpression,
    style: LeafletFeatureStyle,
    pane: string | undefined,
    layerOpacity: number,
    title?: string,
): L.Layer {
    const pointShape = ["square", "diamond", "triangle"].includes(style.shape) ? style.shape as "square" | "diamond" | "triangle" : "circle";
    if (pointShape === "circle") return L.circleMarker(position, {
        radius: style.radius || 6,
        color: style.color,
        fillColor: style.fillColor,
        fillOpacity: Math.max(0, Math.min(1, style.fillOpacity * layerOpacity)),
        opacity: Math.max(0, Math.min(1, style.opacity * layerOpacity)),
        weight: style.weight,
        dashArray: style.dashArray,
        pane,
    });
    const radius = Math.max(2, Math.min(64, style.radius || 6));
    const size = Math.ceil(radius * 2 + Math.max(0, style.weight) * 2);
    return L.marker(position, {
        pane,
        title: title ? title.slice(0, 160) : undefined,
        icon: L.divIcon({
            className: `hp-map-point-shape hp-map-point-${pointShape}`,
            html: safePointSvg(pointShape, style, layerOpacity),
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
        }),
    });
}

/** Update a mounted point without replacing the Leaflet feature instance. */
export function updateLeafletPointLayerStyle(
    layer: L.Layer,
    style: LeafletFeatureStyle,
    layerOpacity: number,
): boolean {
    const path = layer as L.Path & { setRadius?: (radius: number) => unknown };
    if (typeof path.setStyle === "function") {
        path.setStyle({
            color: style.color,
            fillColor: style.fillColor,
            fillOpacity: Math.max(0, Math.min(1, style.fillOpacity * layerOpacity)),
            opacity: Math.max(0, Math.min(1, style.opacity * layerOpacity)),
            weight: style.weight,
            dashArray: style.dashArray,
        });
        path.setRadius?.(style.radius || 6);
        return true;
    }

    const shape = style.shape;
    const marker = layer as L.Marker;
    if (!["square", "diamond", "triangle"].includes(shape ?? "") || typeof marker.setIcon !== "function") return false;
    const radius = Math.max(2, Math.min(64, style.radius || 6));
    const size = Math.ceil(radius * 2 + Math.max(0, style.weight) * 2);
    marker.setIcon(L.divIcon({
        className: `hp-map-point-shape hp-map-point-${shape}`,
        html: safePointSvg(shape as "square" | "diamond" | "triangle", style, layerOpacity),
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
    }));
    return true;
}
