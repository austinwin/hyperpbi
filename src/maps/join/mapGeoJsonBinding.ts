import type { MapLayerDefinition } from "../../schema/mapSchema";
import type { ResolvedMapLayer } from "../model/resolvedMapTypes";
import type { MapSourceContext } from "../sources/mapSourceResolver";
import { executeMapJoin } from "./mapJoinEngine";
import { resolveRenderer } from "../renderers/mapRendererResolver";

/** Adapt native GeoJSON features to the existing join engine, preserving publisher identity. */
export function bindGeoJsonLayer(layer: ResolvedMapLayer, definition: MapLayerDefinition, context: MapSourceContext): ResolvedMapLayer {
    if (!definition.join?.enabled) return layer;
    const join = definition.join;
    const fail = (message: string): ResolvedMapLayer => ({ ...layer, features: [], error: message, diagnostics: { ...layer.diagnostics, error: message, warnings: [...layer.diagnostics.warnings, message] } });
    if (context.datasetFound === false) return fail(`Logical dataset “${context.datasetName}” is unavailable for this join.`);
    const field = context.fields[join.powerBiField];
    if (!field) return fail(`Join key “${join.powerBiField}” is missing from dataset “${context.datasetName ?? "powerbi"}”.`);
    if (field.kind === "measure" || field.origin === "powerbi-measure") return fail(`Measure “${field.displayName}” cannot identify a feature relationship. Choose a model column or a logical dataset key; measures can style or aggregate the joined features.`);
    if (layer.features.length && !layer.features.some(feature => Object.hasOwn(feature.serviceAttributes, join.serviceField))) return fail(`Join key “${join.serviceField}” is missing from the spatial layer. Choose an existing feature attribute.`);
    const numeric = field.dataType === "number";
    const serviceValues = layer.features.map(feature => feature.serviceAttributes[join.serviceField]).filter(value => value !== null && value !== undefined && value !== "");
    const typeWarning = numeric && serviceValues.some(value => typeof value === "string" && !Number.isFinite(Number(value))) ? `Join key type mismatch: numeric “${join.powerBiField}” is compared with nonnumeric “${join.serviceField}”. Check key normalization and source types.` : undefined;
    try {
        const joined = executeMapJoin({ powerBiRows: context.rows, powerBiRowIndices: context.rowIndices, powerBiRowKeys: context.rowKeys, powerBiSourceRowIndices: context.powerBiIdentityAvailable === false ? context.rows.map(() => []) : context.sourceRowIndices, powerBiSourceRowKeys: context.powerBiIdentityAvailable === false ? context.rows.map(() => []) : context.sourceRowKeys, serviceFeatures: layer.features.map(feature => ({ objectId: feature.id, attributes: feature.serviceAttributes, geometry: feature.geometry })), definition: join, layerId: layer.id });
        const originals = new Map(layer.features.map(feature => [feature.id, feature]));
        const features = joined.features.map(feature => { const original = originals.get(String(feature.serviceObjectId)); return { ...feature, id: original?.id ?? feature.id, lat: original?.lat ?? null, lon: original?.lon ?? null }; });
        return { ...layer, features, datasetName: context.datasetName, powerBiIdentityAvailable: context.powerBiIdentityAvailable !== false, renderer: resolveRenderer(definition.renderer ?? { type: "simple", symbol: {} }, features, "joined"), diagnostics: { ...layer.diagnostics, featureCount: features.length, joinDiagnostics: joined.diagnostics, joinField: join.serviceField, effectiveDataset: context.datasetName, warnings: [...layer.diagnostics.warnings, ...joined.warnings, ...(typeWarning ? [typeWarning] : [])] } };
    } catch (error) { return fail(error instanceof Error ? error.message : String(error)); }
}
