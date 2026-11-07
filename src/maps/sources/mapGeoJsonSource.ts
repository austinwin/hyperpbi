import { bindGeoJsonLayer } from "../join/mapGeoJsonBinding";
import type { MapSourceContext } from "./mapSourceResolver";
import { validateGeoJson } from "./publicGeoJson";
import type { MapLayerDefinition } from "../../schema/mapSchema";
import type { ResolvedMapFeature, ResolvedMapLayer } from "../model/resolvedMapTypes";
import { geometryAnalysis } from "./mapSourceResolver";
import { resolveRenderer } from "../renderers/mapRendererResolver";
import { featureAttribute } from "../attributes/mapFeatureAttributes";
import { matchesFilter } from "../../data/filtering";
import type { Primitive } from "../../data/normalizeData";

export function resolveGeoJsonLayer(
    definition: MapLayerDefinition,
    data: GeoJSON.GeoJsonObject,
    context?: MapSourceContext,
): ResolvedMapLayer {
    const started = globalThis.performance?.now?.() ?? Date.now();
    const source = definition.source.type === "geoJson" ? definition.source : undefined;
    const rawFeatures = flattenGeoJson(validateGeoJson(data));
    const maximum = Math.max(1, Math.min(100_000, definition.performance?.maxFeatures ?? 30_000));
    const warnings: string[] = [];
    if (rawFeatures.length > maximum) warnings.push(`Feature limit: showing ${maximum} of ${rawFeatures.length} GeoJSON features. Use FeatureServer viewport queries for larger datasets.`);
    const ids = new Set<string>();
    if (rawFeatures.some(raw => (source?.idField ? raw.properties?.[source.idField] : undefined) == null && raw.id == null)) warnings.push("Some features have no stable ID. Set source.idField; positional identity cannot survive reordered data.");
    let features = rawFeatures.slice(0, maximum).map((raw, index) => { const feature = materializeGeoJsonFeature(definition, raw, index, source?.idField); if (ids.has(feature.id)) warnings.push(`Duplicate feature ID “${feature.id}”; set a unique source.idField to preserve selection identity.`); ids.add(feature.id); return feature; });
    const filters = definition.filter ? Array.isArray(definition.filter) ? definition.filter : [definition.filter] : [];
    if (filters.length && !definition.join?.enabled)
        features = features.filter((feature) => filters.every((filter) =>
            matchesFilter(
                featureAttribute(feature, filter.field, filter.fieldSource ?? "service") as Primitive,
                filter.operator,
                filter.value as Primitive,
            ),
        ));
    const geometry = geometryAnalysis(features);
    const renderer = resolveRenderer(
        definition.renderer ?? { type: "simple", symbol: {} },
        features,
        "service",
    );
    const layer: ResolvedMapLayer = {
        id: definition.id,
        name: definition.name,
        sourceType: "geoJson",
        sourceIdentity: source?.url ?? `inline:${definition.id}`,
        geometryType: geometry.type,
        visible: definition.visible ?? true,
        opacity: definition.opacity ?? 1,
        order: definition.order ?? 0,
        groupId: definition.groupId,
        datasetName: context?.datasetName ?? definition.dataset,
        provenance: definition.provenance,
        powerBiIdentityAvailable: false,
        features,
        renderer,
        labels: definition.labels ? {
            enabled: definition.labels.enabled ?? true,
            field: definition.labels.field,
            fieldSource: definition.labels.fieldSource ?? "service",
            template: definition.labels.template,
            placement: definition.labels.placement ?? "center",
            minZoom: definition.labels.minZoom,
            maxZoom: definition.labels.maxZoom,
            color: definition.labels.color ?? "#111827",
            size: definition.labels.size ?? 12,
            weight: definition.labels.weight ?? 500,
            fontFamily: definition.labels.fontFamily,
            haloColor: definition.labels.haloColor,
            haloSize: definition.labels.haloSize,
            backgroundColor: definition.labels.backgroundColor,
            padding: definition.labels.padding,
            collision: definition.labels.collision ?? "hideOverlaps",
            maxLabels: definition.labels.maxLabels,
        } : undefined,
        popup: definition.popup ? {
            mode: definition.popup.mode,
          remote: definition.popup.remote,
            title: definition.popup.title,
            fields: (definition.popup.fields ?? []).map((field) => ({
                ...field,
                fieldSource: field.fieldSource ?? "service",
                display: field.display ?? "text",
            })),
            actions: definition.popup.actions ?? [],
            html: definition.popup.html,
            content: definition.popup.content,
            defaultFieldSource: definition.popup.defaultFieldSource ?? "service",
        } : undefined,
        tooltip: definition.tooltip ? {
            enabled: definition.tooltip.enabled ?? true,
            fields: definition.tooltip.fields?.map((field) => ({
                ...field,
                fieldSource: field.fieldSource ?? "service",
                display: "text" as const,
            })),
            template: definition.tooltip.template,
            defaultFieldSource: definition.tooltip.defaultFieldSource ?? "service",
        } : undefined,
        interaction: definition.interaction,
        legend: definition.legend,
        visibility: definition.visibility,
        diagnostics: {
            featureCount: features.length,
            requestCount: source?.url ? 1 : 0,
            loading: false,
            sourceType: "geoJson",
            sourceUrl: source?.url,
            geometryType: geometry.type,
            usedServiceSymbology: false,
            usedServiceLabels: false,
            warnings: [...new Set(warnings)],
            geometryTypeCounts: geometry.counts,
            validFeatureCount: features.length,
            sourceResolutionMs: (globalThis.performance?.now?.() ?? Date.now()) - started,
        },
        loading: false,
    };
    if (definition.join?.enabled && context) {
        const bound = bindGeoJsonLayer(layer, definition, context);
        if (filters.length) bound.features = bound.features.filter(feature => filters.every(filter => matchesFilter(featureAttribute(feature, filter.field, filter.fieldSource ?? "service") as Primitive, filter.operator, filter.value as Primitive)));
        bound.renderer = resolveRenderer(definition.renderer ?? { type: "simple", symbol: {} }, bound.features, "joined");
        return bound;
    }
    return layer;
}

function flattenGeoJson(data: GeoJSON.GeoJsonObject): GeoJSON.Feature[] {
    if (data.type === "FeatureCollection") return (data as GeoJSON.FeatureCollection).features;
    if (data.type === "Feature") return [data as GeoJSON.Feature];
    if (data.type === "GeometryCollection")
        return (data as GeoJSON.GeometryCollection).geometries.map((geometry) => ({ type: "Feature", properties: {}, geometry }));
    return [{ type: "Feature", properties: {}, geometry: data as GeoJSON.Geometry }];
}

function materializeGeoJsonFeature(
    definition: MapLayerDefinition,
    raw: GeoJSON.Feature,
    index: number,
    idField?: string,
): ResolvedMapFeature {
    const properties = raw.properties && typeof raw.properties === "object"
        ? { ...raw.properties } as Record<string, unknown>
        : {};
    const geometry = raw.geometry;
    const idValue = (idField ? properties[idField] : undefined) ?? raw.id;
    const id = idValue === undefined || idValue === null ? `geojson-${index}` : String(idValue);
    const point = geometry?.type === "Point" ? geometry.coordinates : undefined;
    return {
        id,
        layerId: definition.id,
        geometryType: geometryType(geometry),
        geometry,
        lat: point && Number.isFinite(point[1]) ? point[1] : null,
        lon: point && Number.isFinite(point[0]) ? point[0] : null,
        serviceAttributes: properties,
        powerBiAttributes: {},
        powerBiRowIndices: [],
        powerBiRowKeys: [],
        joinedAttributes: {},
        selected: false,
    };
}

function geometryType(geometry: GeoJSON.Geometry | null): ResolvedMapFeature["geometryType"] {
    if (!geometry) return "unknown";
    if (geometry.type === "Point") return "point";
    if (geometry.type === "MultiPoint") return "multipoint";
    if (geometry.type === "LineString" || geometry.type === "MultiLineString") return "polyline";
    if (geometry.type === "Polygon" || geometry.type === "MultiPolygon") return "polygon";
    return "mixed";
}
