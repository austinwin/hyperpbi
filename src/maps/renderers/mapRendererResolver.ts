// ── Map Renderer Resolver ────────────────────────────────────────────
// Resolves declarative map renderer definitions to resolved renderers
// that can be applied at runtime. Accepts actual resolved features
// for domain computation (continuous, proportional, class breaks).

import type { MapRendererDefinition, MapSymbolDefinition } from "../../schema/mapSchema";
import type { ResolvedMapRenderer, ResolvedMapSymbol, ResolvedClassBreak } from "../model/resolvedMapTypes";
import { resolvedFeatureValue } from "../model/mapFeatureValue";
import type { ResolvedMapFeature } from "../model/resolvedMapTypes";

export function resolveRenderer(
    definition: MapRendererDefinition,
    features: readonly ResolvedMapFeature[],
    defaultFieldSource: "powerbi" | "service" | "joined" = "joined"
): ResolvedMapRenderer {
    switch (definition.type) {
        case "service":
            return { type: "service" };

        case "simple":
            return {
                type: "simple",
                symbol: resolveSymbol(definition.symbol),
            };

        case "uniqueValue": {
            const valueMap = new Map<string, ResolvedMapSymbol>();
            const valueLabels = new Map<string, string>();
            if (definition.values) {
                for (const entry of definition.values) {
                    const key = String(entry.value);
                    valueMap.set(key, resolveSymbol(entry.symbol));
                    if (entry.label) valueLabels.set(key, entry.label);
                }
            }
            return {
                type: "uniqueValue",
                field: definition.field,
                fieldSource: definition.fieldSource ?? defaultFieldSource,
                valueMap,
                valueLabels: valueLabels.size > 0 ? valueLabels : undefined,
                defaultSymbol: definition.defaultSymbol ? resolveSymbol(definition.defaultSymbol) : undefined,
                defaultLabel: definition.defaultLabel,
            };
        }

        case "classBreaks": {
            const breaks = resolveClassBreaks({ ...definition, fieldSource: definition.fieldSource ?? defaultFieldSource }, features);
            return {
                type: "classBreaks",
                field: definition.field,
                fieldSource: definition.fieldSource ?? defaultFieldSource,
                method: definition.method ?? "quantile",
                breaks,
                colorRamp: definition.colorRamp,
            };
        }

        case "continuousColor": {
            const domain = computeDomain(features, definition.field, definition.fieldSource ?? defaultFieldSource);
            return {
                type: "continuousColor",
                field: definition.field,
                fieldSource: definition.fieldSource ?? defaultFieldSource,
                minColor: definition.minColor,
                maxColor: definition.maxColor,
                clamp: definition.clamp,
                domainMin: domain ? domain[0] : undefined,
                domainMax: domain ? domain[1] : undefined,
            };
        }

        case "proportionalSize": {
            const domain = computeDomain(features, definition.field, definition.fieldSource ?? defaultFieldSource);
            return {
                type: "proportionalSize",
                field: definition.field,
                fieldSource: definition.fieldSource ?? defaultFieldSource,
                minSize: definition.minSize ?? 4,
                maxSize: definition.maxSize ?? 24,
                baseColor: definition.color,
                domainMin: domain ? domain[0] : undefined,
                domainMax: domain ? domain[1] : undefined,
            };
        }

        case "heatmap":
            return {
                type: "heatmap",
                weightField: definition.weightField,
                fieldSource: definition.fieldSource ?? defaultFieldSource,
                radius: definition.radius,
                blur: definition.blur,
                minOpacity: definition.minOpacity,
                heatGradient: definition.gradient,
            };

        case "cluster":
            return {
                type: "cluster",
                clusterRadius: definition.radius,
                disableAtZoom: definition.disableAtZoom,
                showCoverageOnHover: definition.showCoverageOnHover,
                clusterLabel: definition.clusterLabel,
                aggregateField: definition.aggregateField,
                fieldSource: definition.fieldSource ?? defaultFieldSource,
                format: definition.format,
            };

        case "densityGrid":
            return {
                type: "densityGrid",
                field: definition.field,
                fieldSource: definition.fieldSource ?? defaultFieldSource,
            };

        default:
            return { type: "simple", symbol: {} };
    }
}

function computeDomain(
    features: readonly ResolvedMapFeature[],
    field: string | undefined,
    fieldSource: "powerbi" | "service" | "joined" | undefined
): [number, number] | null {
    if (!field) return null;
    const values: number[] = [];
    for (const f of features) {
        const val = resolvedFeatureValue(f, field, fieldSource ?? "joined");
        if (typeof val === "number" && isFinite(val)) {
            values.push(val);
        }
    }
    if (values.length === 0) return null;
    return [Math.min(...values), Math.max(...values)];
}

function resolveClassBreaks(
    definition: { method?: string; classes?: number; breaks?: Array<{ min: number; max: number; label?: string; symbol: MapSymbolDefinition }>; colorRamp?: string[]; field?: string; fieldSource?: "powerbi" | "service" | "joined" },
    features: readonly ResolvedMapFeature[]
): ResolvedClassBreak[] | undefined {
    // If manual breaks are provided, use them directly
    if (definition.breaks && definition.breaks.length > 0) {
        return definition.breaks.map(b => ({
            min: b.min,
            max: b.max,
            label: b.label,
            symbol: resolveSymbol(b.symbol),
        }));
    }

    // Compute breaks from features if colorRamp is provided
    if (definition.colorRamp && definition.colorRamp.length > 0) {
        const classes = definition.classes ?? definition.colorRamp.length;
        const domain = computeDomain(features, definition.field, definition.fieldSource);

        if (!domain || domain[0] === domain[1]) {
            // All equal values — use single symbol
            const symbol: ResolvedMapSymbol = { color: definition.colorRamp[0], fillColor: definition.colorRamp[0] };
            return [{ min: domain ? domain[0] : 0, max: domain ? domain[0] : 0, symbol }];
        }

        const numClasses = Math.min(classes, definition.colorRamp.length);
        let breakPoints: number[];

        switch (definition.method) {
            case "equalInterval": {
                const step = (domain[1] - domain[0]) / numClasses;
                breakPoints = Array.from({ length: numClasses + 1 }, (_, i) => domain[0] + i * step);
                break;
            }
            case "naturalBreaks":
                // Natural breaks not implemented — fall back to quantile with warning
                breakPoints = computeQuantileBreaks(features, definition.field, definition.fieldSource, numClasses);
                break;
            case "quantile":
            default:
                breakPoints = computeQuantileBreaks(features, definition.field, definition.fieldSource, numClasses);
                break;
        }

        const breaks: ResolvedClassBreak[] = [];
        for (let i = 0; i < numClasses; i++) {
            const color = definition.colorRamp[i] ?? definition.colorRamp[definition.colorRamp.length - 1];
            const symbol = resolveSymbol({ color, fillColor: color });
            breaks.push({
                min: breakPoints[i],
                max: i === numClasses - 1 ? breakPoints[i + 1] + 0.0001 : breakPoints[i + 1],
                symbol,
            });
        }
        return breaks;
    }

    return undefined;
}

function computeQuantileBreaks(
    features: readonly ResolvedMapFeature[],
    field: string | undefined,
    fieldSource: "powerbi" | "service" | "joined" | undefined,
    numClasses: number
): number[] {
    if (!field) return [0, 0];

    const values: number[] = [];
    for (const f of features) {
        const val = resolvedFeatureValue(f, field, fieldSource ?? "joined");
        if (typeof val === "number" && isFinite(val)) {
            values.push(val);
        }
    }
    values.sort((a, b) => a - b);

    if (values.length === 0) return [0, 0];
    if (values.length <= numClasses) return [values[0], ...values.slice(1), values[values.length - 1]];

    const breaks: number[] = [values[0]];
    for (let i = 1; i < numClasses; i++) {
        const idx = Math.floor((i / numClasses) * values.length);
        breaks.push(values[idx]);
    }
    breaks.push(values[values.length - 1]);
    return breaks;
}

function resolveSymbol(symbol: MapSymbolDefinition): ResolvedMapSymbol {
    return {
        shape: symbol.shape,
        color: symbol.color,
        fillColor: symbol.fillColor ?? symbol.color,
        size: symbol.size ?? symbol.radius,
        radius: symbol.radius ?? symbol.size,
        width: symbol.width,
        weight: symbol.weight,
        opacity: symbol.opacity,
        fillOpacity: symbol.fillOpacity,
        outlineColor: symbol.outlineColor,
        outlineWidth: symbol.outlineWidth,
        dashArray: symbol.dashArray,
    };
}
