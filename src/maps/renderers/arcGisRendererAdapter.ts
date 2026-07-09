// ── ArcGIS Renderer Adapter ───────────────────────────────────────────
// Converts ArcGIS service drawingInfo.renderer into ResolvedMapRenderer.
// Supports simple, uniqueValue, and classBreaks renderers.

import { arcGisColorToCss } from "../arcgis/arcGisGeometryConverter";
import type {
    ArcGisRendererDef,
    ArcGisSymbolDef,
    ArcGisUniqueValueInfo,
    ArcGisClassBreakInfo,
} from "../arcgis/arcGisServiceTypes";
import type {
    ResolvedMapRenderer,
    ResolvedMapSymbol,
    ResolvedClassBreak,
} from "../model/resolvedMapTypes";

export interface ArcGisRendererAdaptResult {
    renderer: ResolvedMapRenderer;
    usedServiceSymbology: boolean;
    warnings: string[];
}

export function adaptArcGisRenderer(
    arcGisRenderer: ArcGisRendererDef | undefined
): ArcGisRendererAdaptResult {
    const warnings: string[] = [];

    if (!arcGisRenderer) {
        return {
            renderer: { type: "simple", symbol: { color: "#3388ff", radius: 6, weight: 2, fillOpacity: 0.35 } },
            usedServiceSymbology: false,
            warnings: ["No service renderer defined."],
        };
    }

    switch (arcGisRenderer.type.toLowerCase()) {
        case "simple":
            return adaptSimpleRenderer(arcGisRenderer, warnings);

        case "uniquevalue":
        case "unique value":
            return adaptUniqueValueRenderer(arcGisRenderer, warnings);

        case "classbreaks":
        case "class breaks":
            return adaptClassBreaksRenderer(arcGisRenderer, warnings);

        default:
            warnings.push(`Unsupported ArcGIS renderer type: ${arcGisRenderer.type}. Using simple symbol fallback.`);
            return {
                renderer: {
                    type: "service",
                    symbol: arcGisSymbolToResolved(arcGisRenderer.symbol),
                },
                usedServiceSymbology: true,
                warnings,
            };
    }
}

function adaptSimpleRenderer(
    def: ArcGisRendererDef,
    warnings: string[]
): ArcGisRendererAdaptResult {
    const symbol = arcGisSymbolToResolved(def.symbol);
    return {
        renderer: {
            type: "simple",
            symbol,
        },
        usedServiceSymbology: true,
        warnings,
    };
}

function adaptUniqueValueRenderer(
    def: ArcGisRendererDef,
    warnings: string[]
): ArcGisRendererAdaptResult {
    const valueMap = new Map<string, ResolvedMapSymbol>();

    if (def.uniqueValueInfos) {
        for (const info of def.uniqueValueInfos) {
            const symbol = arcGisSymbolToResolved(info.symbol);
            const key = String(info.value);
            valueMap.set(key, { ...symbol });
        }
    }

    return {
        renderer: {
            type: "uniqueValue",
            field: def.field1 ?? def.field2 ?? def.field3,
            fieldSource: "service",
            valueMap: valueMap.size > 0 ? valueMap : undefined,
            defaultSymbol: def.defaultSymbol
                ? arcGisSymbolToResolved(def.defaultSymbol)
                : undefined,
            defaultLabel: def.defaultLabel,
        },
        usedServiceSymbology: true,
        warnings: valueMap.size === 0
            ? [...warnings, "Unique value renderer has no value definitions."]
            : warnings,
    };
}

function adaptClassBreaksRenderer(
    def: ArcGisRendererDef,
    warnings: string[]
): ArcGisRendererAdaptResult {
    const breaks: ResolvedClassBreak[] = [];

    if (def.classBreakInfos) {
        for (const info of def.classBreakInfos) {
            breaks.push({
                min: info.classMinValue,
                max: info.classMaxValue,
                label: info.label,
                symbol: arcGisSymbolToResolved(info.symbol),
            });
        }
    }

    if (def.colorRamp) {
        const colors = resolveArcGisColorRamp(def.colorRamp);
        // Assign colors to breaks if no individual symbols
        if (breaks.every(b => !b.symbol.color && !b.symbol.fillColor)) {
            for (let i = 0; i < breaks.length; i++) {
                const colorIdx = colors.length > 1
                    ? Math.round((i / Math.max(breaks.length - 1, 1)) * (colors.length - 1))
                    : 0;
                breaks[i].symbol = {
                    ...breaks[i].symbol,
                    fillColor: colors[colorIdx] ?? breaks[i].symbol.fillColor,
                    color: colors[colorIdx] ?? breaks[i].symbol.color,
                };
            }
        }
    }

    return {
        renderer: {
            type: "classBreaks",
            field: def.field1 ?? def.field2 ?? def.field3,
            fieldSource: "service",
            method: def.classificationMethod === "esriClassifyEqualInterval"
                ? "equalInterval"
                : def.classificationMethod === "esriClassifyQuantile"
                    ? "quantile"
                    : def.classificationMethod === "esriClassifyNaturalBreaks"
                        ? "naturalBreaks"
                        : "manual",
            breaks: breaks.length > 0 ? breaks : undefined,
            defaultSymbol: def.defaultSymbol
                ? arcGisSymbolToResolved(def.defaultSymbol)
                : undefined,
        },
        usedServiceSymbology: true,
        warnings,
    };
}

// ── Symbol Conversion ─────────────────────────────────────────────────

export function arcGisSymbolToResolved(symbol: ArcGisSymbolDef | undefined): ResolvedMapSymbol {
    if (!symbol) {
        return { color: "#3388ff", fillColor: "#3388ff", radius: 6, weight: 2, fillOpacity: 0.35 };
    }

    const resolved: ResolvedMapSymbol = {};

    switch (symbol.type) {
        case "esriSMS": // Simple Marker Symbol
            resolved.shape = "circle";
            resolved.color = arcGisColorToCss(symbol.color) ?? "#3388ff";
            resolved.fillColor = arcGisColorToCss(symbol.color) ?? "#3388ff";
            resolved.radius = symbol.size ? symbol.size / 2 : 6;
            resolved.size = symbol.size ?? 12;
            resolved.opacity = symbol.color && symbol.color.length >= 4
                ? symbol.color[3] / 255
                : 0.9;
            resolved.fillOpacity = 0.35;
            if (symbol.outline) {
                resolved.outlineColor = arcGisColorToCss(symbol.outline.color) ?? "#333333";
                resolved.outlineWidth = symbol.outline.width ?? 1;
                resolved.weight = symbol.outline.width ?? 1;
            }
            break;

        case "esriSLS": {// Simple Line Symbol
            resolved.shape = "line";
            resolved.color = arcGisColorToCss(symbol.color) ?? "#3388ff";
            resolved.weight = symbol.width ?? 2;
            resolved.width = symbol.width ?? 2;
            resolved.opacity = symbol.color && symbol.color.length >= 4
                ? symbol.color[3] / 255
                : 0.9;
            if (symbol.style === "esriSLSDash") {
                resolved.dashArray = "8, 4";
            } else if (symbol.style === "esriSLSDot") {
                resolved.dashArray = "2, 4";
            }
            break;
        }

        case "esriSFS": {// Simple Fill Symbol
            resolved.shape = "fill";
            resolved.fillColor = arcGisColorToCss(symbol.color) ?? "#3388ff";
            resolved.fillOpacity = symbol.color && symbol.color.length >= 4
                ? symbol.color[3] / 255
                : 0.35;
            if (symbol.outline) {
                resolved.color = arcGisColorToCss(symbol.outline.color) ?? "#333333";
                resolved.outlineColor = resolved.color;
                resolved.outlineWidth = symbol.outline.width ?? 1;
                resolved.weight = symbol.outline.width ?? 1;
            } else {
                resolved.color = resolved.fillColor;
                resolved.weight = 1;
            }
            resolved.opacity = 0.9;
            break;
        }

        default:
            // Fallback for unsupported symbol types
            resolved.color = arcGisColorToCss(symbol.color) ?? "#3388ff";
            resolved.fillColor = resolved.color;
            resolved.radius = 6;
            resolved.weight = 2;
            resolved.fillOpacity = 0.35;
            break;
    }

    return resolved;
}

export function adaptArcGisLabels(
    labelingInfo: Array<{
        labelPlacement?: string;
        labelExpression?: string;
        labelExpressionInfo?: { expression?: string };
        symbol?: {
            type: string;
            color?: number[];
            fontSize?: number;
            fontFamily?: string;
            fontWeight?: string;
            haloColor?: number[];
            haloSize?: number;
        };
        minScale?: number;
        maxScale?: number;
        where?: string;
    }> | undefined
): {
    usedServiceLabels: boolean;
    labels: {
        enabled: boolean;
        field?: string;
        template?: string;
        placement: "center" | "above" | "below" | "left" | "right" | "lineCenter";
        color: string;
        size: number;
        weight: number | string;
        haloColor?: string;
        haloSize?: number;
        collision: "none" | "hideOverlaps";
    } | undefined;
    warnings: string[];
} {
    if (!labelingInfo || labelingInfo.length === 0) {
        return { usedServiceLabels: false, labels: undefined, warnings: [] };
    }

    const info = labelingInfo[0];
    const warnings: string[] = [];
    const symbol = info.symbol;

    // Extract field name from label expression (simple case)
    let field: string | undefined;
    if (info.labelExpression) {
        // Strip brackets: [FIELD_NAME] -> FIELD_NAME
        const match = info.labelExpression.match(/^\[([^\]]+)\]$/);
        if (match) field = match[1];
    }

    return {
        usedServiceLabels: true,
        labels: {
            enabled: true,
            field,
            template: info.labelExpression,
            placement: info.labelPlacement === "esriServerPointLabelPlacementAboveCenter"
                ? "above"
                : info.labelPlacement === "esriServerPointLabelPlacementBelowCenter"
                    ? "below"
                    : "center",
            color: arcGisColorToCss(symbol?.color) ?? "#333333",
            size: symbol?.fontSize ?? 12,
            weight: symbol?.fontWeight ?? "normal",
            haloColor: symbol?.haloColor ? arcGisColorToCss(symbol.haloColor) : undefined,
            haloSize: symbol?.haloSize ?? 1,
            collision: "none", // Collision avoidance requires spatial indexing
        },
        warnings,
    };
}

// ── Color Ramp Resolution ─────────────────────────────────────────────

function resolveArcGisColorRamp(ramp: {
    type: string;
    fromColor?: number[];
    toColor?: number[];
    colorRamps?: Array<{
        fromColor?: number[];
        toColor?: number[];
    }>;
    algorithmicType?: string;
}): string[] {
    const colors: string[] = [];

    if (ramp.fromColor && ramp.toColor) {
        // Simple two-color ramp: interpolate
        const from = arcGisColorToCss(ramp.fromColor) ?? "#dbeafe";
        const to = arcGisColorToCss(ramp.toColor) ?? "#2563eb";
        colors.push(from);
        // Generate intermediate stops
        for (let i = 1; i < 4; i++) {
            colors.push(interpolateColor(from, to, i / 4));
        }
        colors.push(to);
    }

    if (ramp.colorRamps) {
        for (const subRamp of ramp.colorRamps) {
            if (subRamp.fromColor) {
                const c = arcGisColorToCss(subRamp.fromColor);
                if (c) colors.push(c);
            }
            if (subRamp.toColor) {
                const c = arcGisColorToCss(subRamp.toColor);
                if (c) colors.push(c);
            }
        }
    }

    return colors;
}

function interpolateColor(color1: string, color2: string, factor: number): string {
    const parse = (c: string) => {
        const m = c.match(/rgba?\((\d+),\s*(\d+),\s*(\d+)/);
        if (m) return [parseInt(m[1]), parseInt(m[2]), parseInt(m[3])];
        if (c.startsWith("#")) {
            const h = c.slice(1);
            return [
                parseInt(h.slice(0, 2), 16),
                parseInt(h.slice(2, 4), 16),
                parseInt(h.slice(4, 6), 16),
            ];
        }
        return [0, 0, 0];
    };

    const c1 = parse(color1);
    const c2 = parse(color2);
    const r = Math.round(c1[0] + (c2[0] - c1[0]) * factor);
    const g = Math.round(c1[1] + (c2[1] - c1[1]) * factor);
    const b = Math.round(c1[2] + (c2[2] - c1[2]) * factor);
    return `rgb(${r},${g},${b})`;
}
