import type { MapLayerDefinition } from "../../schema/mapSchema";
export const MAP_ORIGIN_GROUPS = ["Published map definitions", "Power BI data", "ArcGIS and other services"] as const;
export function mapLayerOrigin(layer: Pick<MapLayerDefinition, "source" | "provenance">): typeof MAP_ORIGIN_GROUPS[number] {
    return layer.provenance?.provider === "published" ? MAP_ORIGIN_GROUPS[0] : layer.source.type === "powerbi" ? MAP_ORIGIN_GROUPS[1] : MAP_ORIGIN_GROUPS[2];
}
