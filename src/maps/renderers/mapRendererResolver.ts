// ── Map Renderer Resolver ────────────────────────────────────────────
// Resolves declarative map renderer definitions to resolved renderers
// that can be applied at runtime.

import type { MapRendererDefinition, MapSymbolDefinition } from "../../schema/mapSchema";
import type { ResolvedMapRenderer, ResolvedMapSymbol } from "../model/resolvedMapTypes";

export function resolveRenderer(
    definition: MapRendererDefinition,
    featureValues: Array<{ value: unknown; size?: number }>
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
            if (definition.values) {
                for (const entry of definition.values) {
                    valueMap.set(String(entry.value), resolveSymbol(entry.symbol));
                }
            }
            return {
                type: "uniqueValue",
                field: definition.field,
                fieldSource: definition.fieldSource,
                valueMap,
                defaultSymbol: definition.defaultSymbol ? resolveSymbol(definition.defaultSymbol) : undefined,
                defaultLabel: definition.defaultLabel,
            };
        }

        case "classBreaks": {
            return {
                type: "classBreaks",
                field: definition.field,
                fieldSource: definition.fieldSource,
                method: definition.method ?? "quantile",
                breaks: definition.breaks?.map(b => ({
                    min: b.min,
                    max: b.max,
                    label: b.label,
                    symbol: resolveSymbol(b.symbol),
                })),
                colorRamp: definition.colorRamp,
            };
        }

        case "continuousColor":
            return {
                type: "continuousColor",
                field: definition.field,
                fieldSource: definition.fieldSource,
                minColor: definition.minColor,
                maxColor: definition.maxColor,
                clamp: definition.clamp,
            };

        case "proportionalSize":
            return {
                type: "proportionalSize",
                field: definition.field,
                fieldSource: definition.fieldSource,
                minSize: definition.minSize ?? 4,
                maxSize: definition.maxSize ?? 24,
                baseColor: definition.color,
            };

        case "heatmap":
            return {
                type: "heatmap",
                weightField: definition.weightField,
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
                clusterLabel: definition.clusterLabel,
                aggregateField: definition.aggregateField,
            };

        case "densityGrid":
            return {
                type: "densityGrid",
                field: definition.field,
                fieldSource: definition.fieldSource,
            };

        default:
            return { type: "simple", symbol: {} };
    }
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
