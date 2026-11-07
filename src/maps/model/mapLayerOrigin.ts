import type { MapLayerDefinition } from "../../schema/mapSchema";
export const MAP_ORIGIN_GROUPS = ["Published map definitions", "Power BI data", "ArcGIS services", "GeoJSON", "XYZ / WMS services"] as const;
export function mapLayerOrigin(layer: Pick<MapLayerDefinition, "source" | "provenance">): typeof MAP_ORIGIN_GROUPS[number] {
    return layer.provenance?.provider === "published" ? MAP_ORIGIN_GROUPS[0] : layer.source.type === "powerbi" ? MAP_ORIGIN_GROUPS[1] : layer.source.type === "geoJson" ? MAP_ORIGIN_GROUPS[3] : layer.source.type === "xyz" ? MAP_ORIGIN_GROUPS[4] : MAP_ORIGIN_GROUPS[2];
}
