// ── Legacy Map Resolver ───────────────────────────────────────────────
// Converts legacy MapComponent settings/style/popup into the new layers[] model.
// This ensures backward compatibility for existing dashboard specifications.

import type { MapComponent } from "../../schema/hyperpbiSchema";
import type { MapBindingKeys } from "../../data/normalizeData";
import type { MapLayerDefinition } from "../../schema/mapSchema";

export function resolveLegacyMapLayers(
    component: MapComponent,
    runtimeBindings: Partial<MapBindingKeys> | undefined
): MapLayerDefinition[] {
    // If layers are already configured, use them directly
    if (component.layers && component.layers.length > 0) {
        return component.layers;
    }

    // Build one internal Power BI layer from legacy settings
    const mapId = component.id ?? "map";
    const layerId = `${mapId}_powerbi`;

    const layer: MapLayerDefinition = {
        id: layerId,
        name: "Map data",
        visible: true,
        opacity: component.style?.opacity ?? 0.9,
        order: 0,
        source: {
            type: "powerbi",
            bindings: {
                ...runtimeBindings,
                ...(component.settings?.clusterPoints !== undefined ? {} : {}),
            },
        },
        renderer: legacyStyleToRenderer(component),
        popup: component.popup ? {
            enabled: true,
            html: component.popup.html,
        } : undefined,
        interaction: component.interaction,
    };

    return [layer];
}

function legacyStyleToRenderer(component: MapComponent): any {
    const style = component.style;
    if (!style) return { type: "simple", symbol: {} };

    if (style.colorMode === "gradient") {
        return {
            type: "continuousColor",
            field: "__color__", // resolved at runtime
            fieldSource: "powerbi",
            minColor: style.gradientStart ?? "#dbeafe",
            maxColor: style.gradientEnd ?? "#2563eb",
        };
    }

    if (style.colorMode === "categorical") {
        return {
            type: "uniqueValue",
            field: "__color__",
            fieldSource: "powerbi",
            defaultSymbol: {
                color: style.defaultPointColor ?? "#2563eb",
                radius: style.radius ?? 6,
                weight: style.lineWeight ?? 3,
                fillOpacity: style.fillOpacity ?? 0.35,
                opacity: style.opacity ?? 0.9,
            },
        };
    }

    return {
        type: "simple",
        symbol: {
            color: style.defaultPointColor ?? "#2563eb",
            radius: style.radius ?? 6,
            weight: style.lineWeight ?? 3,
            fillOpacity: style.fillOpacity ?? 0.35,
            opacity: style.opacity ?? 0.9,
        },
    };
}
