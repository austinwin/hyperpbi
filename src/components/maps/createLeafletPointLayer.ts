import * as L from "leaflet";
import type { LeafletFeatureStyle } from "../../maps/renderers/mapFeatureSymbol";
import { getIcon } from "../icons/iconRegistry";
import { safeUrl } from "../../security/safeUrl";
import { sanitizeSvg } from "../../security/sanitizeSvg";

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
    if (style.shape === "icon" || style.icon) return createRichIconMarker(position, style, pane, layerOpacity, title);
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
        bubblingMouseEvents: false,
    });
    const radius = Math.max(2, Math.min(64, style.radius || 6));
    const size = Math.ceil(radius * 2 + Math.max(0, style.weight) * 2);
    return L.marker(position, {
        pane,
        bubblingMouseEvents: false,
        title: title ? title.slice(0, 160) : undefined,
        icon: L.divIcon({
            className: `hp-map-point-shape hp-map-point-${pointShape}`,
            html: safePointSvg(pointShape, style, layerOpacity),
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
        }),
    });
}

function createRichIconMarker(
    position: L.LatLngExpression,
    style: LeafletFeatureStyle,
    pane: string | undefined,
    layerOpacity: number,
    title?: string,
): L.Marker {
    const authoredSize = style.icon?.size;
    const diameter = Math.max(12, Math.min(128, authoredSize?.[0] ?? (style.radius || 12) * 2));
    const height = Math.max(12, Math.min(128, authoredSize?.[1] ?? diameter));
    const anchor = style.icon?.anchor ?? style.anchor ?? [diameter / 2, height / 2];
    const offset = style.icon?.offset ?? style.offset ?? [0, 0];
    const rotation = Number.isFinite(style.rotation) ? Number(style.rotation) : 0;
    const opacity = Math.max(0, Math.min(1, style.opacity * layerOpacity));
    const graphic = safeIconGraphic(style, diameter, height);
    const text = style.markerText ? `<span class="hp-map-marker-text">${escapeText(style.markerText)}</span>` : "";
    const badge = style.badge ? `<span class="hp-map-marker-badge">${escapeText(style.badge)}</span>` : "";
    const value = style.showValue && title ? `<span class="hp-map-marker-value">${escapeText(title)}</span>` : "";
    return L.marker(position, {
        pane,
        bubblingMouseEvents: false,
        title: title ? title.slice(0, 160) : undefined,
        icon: L.divIcon({
            className: "hp-map-rich-marker",
            html: `<span class="hp-map-rich-marker-inner" style="opacity:${opacity};transform:translate(${Number(offset[0]) || 0}px,${Number(offset[1]) || 0}px) rotate(${rotation}deg);color:${escapeAttribute(style.fillColor)}">${graphic}</span>${text}${badge}${value}`,
            iconSize: [diameter, height],
            iconAnchor: [Number(anchor[0]) || diameter / 2, Number(anchor[1]) || height / 2],
        }),
    });
}

function safeIconGraphic(style: LeafletFeatureStyle, width: number, height: number): string {
    const icon = style.icon;
    if (icon?.type === "builtIn" && icon.name) {
        const definition = getIcon(icon.name);
        if (definition)
            return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${width}" height="${height}" fill="none" stroke="currentColor" stroke-width="${Math.max(1, style.weight)}" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${escapeAttribute(definition.path)}"/></svg>`;
    }
    if (icon?.type === "svg" && icon.svg && typeof DOMParser !== "undefined") {
        const sanitized = sanitizeSvg(icon.svg, `hp-map-icon-${Math.abs(hashString(icon.svg))}`);
        if (sanitized.svg) return sanitized.svg;
    }
    if (icon?.type === "image" && icon.url) {
        const url = safeUrl(icon.url, { allowImages: true, allowExternal: true, allowDataImages: false });
        if (url) return `<img alt="" src="${escapeAttribute(url)}" width="${width}" height="${height}" referrerpolicy="no-referrer" />`;
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="${width}" height="${height}" aria-hidden="true"><circle cx="12" cy="12" r="9" fill="${escapeAttribute(style.fillColor)}" stroke="${escapeAttribute(style.color)}" stroke-width="${Math.max(1, style.weight)}"/></svg>`;
}

function escapeText(value: string): string {
    return escapeAttribute(value).replace(/'/g, "&#39;");
}

function hashString(value: string): number {
    let hash = 0;
    for (let index = 0; index < value.length; index++) hash = (hash * 31 + value.charCodeAt(index)) | 0;
    return hash;
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

    const marker = layer as L.Marker;
    if ((style.shape === "icon" || style.icon) && typeof marker.setIcon === "function") {
        marker.setIcon(createRichIconMarker([0, 0], style, undefined, layerOpacity).getIcon());
        return true;
    }
    const shape = style.shape;
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
