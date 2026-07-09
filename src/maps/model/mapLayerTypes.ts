// ── Map Layer Type Definitions ────────────────────────────────────────
// Runtime type models used by the map subsystem.

import type { MapGeometryType } from "../../schema/mapSchema";

export interface MapLayerSourceTypeDef {
    type: string;
    label: string;
    supportsJoin: boolean;
    supportsQuery: boolean;
    supportsSymbology: boolean;
    supportsLabels: boolean;
    supportsPopup: boolean;
    needsHostPermission: boolean;
}

export const MAP_SOURCE_TYPES: Record<string, MapLayerSourceTypeDef> = {
    powerbi: {
        type: "powerbi",
        label: "Power BI Data",
        supportsJoin: false,
        supportsQuery: false,
        supportsSymbology: true,
        supportsLabels: true,
        supportsPopup: true,
        needsHostPermission: false,
    },
    arcgisFeature: {
        type: "arcgisFeature",
        label: "ArcGIS Feature Layer",
        supportsJoin: true,
        supportsQuery: true,
        supportsSymbology: true,
        supportsLabels: true,
        supportsPopup: true,
        needsHostPermission: true,
    },
    arcgisTile: {
        type: "arcgisTile",
        label: "ArcGIS Tile Layer",
        supportsJoin: false,
        supportsQuery: false,
        supportsSymbology: false,
        supportsLabels: false,
        supportsPopup: false,
        needsHostPermission: true,
    },
    arcgisDynamic: {
        type: "arcgisDynamic",
        label: "ArcGIS Dynamic Map",
        supportsJoin: false,
        supportsQuery: false,
        supportsSymbology: false,
        supportsLabels: false,
        supportsPopup: false,
        needsHostPermission: true,
    },
};

export function sourceTypeDef(type: string): MapLayerSourceTypeDef | undefined {
    return MAP_SOURCE_TYPES[type];
}
