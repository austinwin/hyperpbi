import type { MapLayerDefinition } from "../../schema/mapSchema";
import type { ArcGisLayerMetadata } from "../../maps/arcgis/arcGisServiceTypes";

export function geoJsonLayerMetadata(layer: MapLayerDefinition | undefined): ArcGisLayerMetadata | undefined {
    if (layer?.source.type !== "geoJson") return undefined;
    const data = layer.source.data;
    const features = data?.type === "FeatureCollection" ? (data as GeoJSON.FeatureCollection).features : data?.type === "Feature" ? [data as GeoJSON.Feature] : [];
    const names = new Set([...layer.provenance?.fields?.map(field => field.name) ?? [], ...features.slice(0, 50).flatMap(feature => Object.keys(feature.properties ?? {}))]);
    if (!names.size) return undefined;
    const fields = [...names].map(name => {
        const authored = layer.provenance?.fields?.find(field => field.name === name);
        const sample = features.find(feature => feature.properties?.[name] != null)?.properties?.[name];
        return { name, alias: authored?.alias ?? name, type: authored?.type === "number" || typeof sample === "number" ? "esriFieldTypeDouble" : authored?.type === "date" ? "esriFieldTypeDate" : "esriFieldTypeString" };
    });
    return { id: 0, name: layer.name, fields, objectIdField: layer.source.idField ?? "", geometryType: layer.provenance?.geometryType } as ArcGisLayerMetadata;
}
