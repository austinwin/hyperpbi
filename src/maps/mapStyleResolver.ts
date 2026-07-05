import { NormalizedMapData, NormalizedMapFeature } from "../data/normalizeData";
import { MapComponent } from "../schema/hyperpbiSchema";
import { categoricalColor } from "../utils/colors";

function clamp(value: number, min: number, max: number): number { return Math.max(min, Math.min(max, value)); }
function safeColor(value: string | undefined, fallback: string): string { return value && /^#[0-9a-f]{6}$/i.test(value) ? value : fallback; }
function interpolate(start: string, end: string, amount: number): string {
    const channel = (hex: string, offset: number) => parseInt(hex.slice(offset, offset + 2), 16);
    const value = [1, 3, 5].map(offset => Math.round(channel(start, offset) + (channel(end, offset) - channel(start, offset)) * amount).toString(16).padStart(2, "0"));
    return `#${value.join("")}`;
}

export interface ResolvedMapStyle {
    defaultColor: string;
    radius: number;
    minRadius: number;
    maxRadius: number;
    lineWeight: number;
    minLineWeight: number;
    maxLineWeight: number;
    fillOpacity: number;
    opacity: number;
    colorFor(feature: NormalizedMapFeature): string;
    radiusFor(feature: NormalizedMapFeature): number;
    weightFor(feature: NormalizedMapFeature): number;
}

export function resolveMapStyle(component: MapComponent, themePrimary: string, map: NormalizedMapData): ResolvedMapStyle {
    const config = component.style ?? {}; const features = map.layers.flatMap(layer => layer.features);
    const sizeValues = features.map(feature => feature.sizeValue).filter((value): value is number => value !== null && Number.isFinite(value));
    const colorValues = features.map(feature => Number(feature.colorValue)).filter(Number.isFinite);
    const sizeMin = sizeValues.length ? Math.min(...sizeValues) : 0; const sizeMax = sizeValues.length ? Math.max(...sizeValues) : 0;
    const colorMin = colorValues.length ? Math.min(...colorValues) : 0; const colorMax = colorValues.length ? Math.max(...colorValues) : 0;
    const minRadius = clamp(config.minRadius ?? 4, 1, 40); const maxRadius = clamp(config.maxRadius ?? 14, minRadius, 60);
    const minLineWeight = clamp(config.minLineWeight ?? 1, .5, 20); const maxLineWeight = clamp(config.maxLineWeight ?? 8, minLineWeight, 30);
    const defaultColor = safeColor(config.defaultPointColor, themePrimary); const gradientStart = safeColor(config.gradientStart, "#dbeafe"); const gradientEnd = safeColor(config.gradientEnd, defaultColor);
    const scaled = (value: number | null, min: number, max: number, lower: number, upper: number, fallback: number) => value === null || max === min ? fallback : lower + (value - min) / (max - min) * (upper - lower);
    return {
        defaultColor, radius: clamp(config.radius ?? 6, 1, 40), minRadius, maxRadius,
        lineWeight: clamp(config.lineWeight ?? 3, .5, 20), minLineWeight, maxLineWeight,
        fillOpacity: clamp(config.fillOpacity ?? .35, 0, 1), opacity: clamp(config.opacity ?? .9, 0, 1),
        colorFor: feature => !map.bindings.color ? defaultColor : config.colorMode === "gradient" && typeof feature.colorValue === "number" ? interpolate(gradientStart, gradientEnd, colorMax === colorMin ? .5 : (feature.colorValue - colorMin) / (colorMax - colorMin)) : categoricalColor(feature.colorValue),
        radiusFor: feature => clamp(scaled(feature.sizeValue, sizeMin, sizeMax, minRadius, maxRadius, config.radius ?? 6), minRadius, maxRadius),
        weightFor: feature => clamp(scaled(feature.sizeValue, sizeMin, sizeMax, minLineWeight, maxLineWeight, config.lineWeight ?? 3), minLineWeight, maxLineWeight)
    };
}
