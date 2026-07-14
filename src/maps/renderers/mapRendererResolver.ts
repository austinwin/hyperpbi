// ── Map Renderer Resolver ────────────────────────────────────────────
// Resolves declarative map renderer definitions to resolved renderers
// that can be applied at runtime. Accepts actual resolved features
// for domain computation (continuous, proportional, class breaks).

import type { MapRendererDefinition, MapSymbolDefinition } from "../../schema/mapSchema";
import type { ResolvedMapRenderer, ResolvedMapSymbol } from "../model/resolvedMapTypes";
import { resolvedFeatureValue } from "../model/mapFeatureValue";
import type { ResolvedMapFeature } from "../model/resolvedMapTypes";
import { generateClassBreaks } from "./mapClassBreaks";

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
            const values = numericFeatureValues(features, definition.field, definition.fieldSource ?? defaultFieldSource);
            const classBreakResult = generateClassBreaks({
                method: definition.method,
                classes: definition.classes,
                breaks: definition.breaks,
                colorRamp: definition.colorRamp,
                values,
                resolveSymbol,
            });
            return {
                type: "classBreaks",
                field: definition.field,
                fieldSource: definition.fieldSource ?? defaultFieldSource,
                method: definition.method ?? "quantile",
                breaks: classBreakResult.breaks,
                colorRamp: definition.colorRamp,
                classBreakResult,
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

function numericFeatureValues(
    features: readonly ResolvedMapFeature[],
    field: string | undefined,
    fieldSource: "powerbi" | "service" | "joined" | undefined,
): number[] {
    if (!field) return [];
    const values: number[] = [];
    for (const feature of features) {
        const value = resolvedFeatureValue(feature, field, fieldSource ?? "joined");
        if (typeof value === "number" && Number.isFinite(value)) values.push(value);
    }
    return values;
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
