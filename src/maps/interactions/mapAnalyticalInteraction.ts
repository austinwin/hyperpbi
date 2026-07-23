import type { MapQuickFilterDefinition, MapSelectionOperation } from "../../schema/mapSchema";
import type { ResolvedMapFeature, ResolvedMapLayer, ResolvedMapRenderer, ResolvedMapSymbol } from "../model/resolvedMapTypes";
import { featureAttribute } from "../attributes/mapFeatureAttributes";
import { resolvedMapFeatureKey } from "../model/mapFeatureIdentity";

export interface MapLegendEntryModel {
    key: string;
    label: string;
    featureKeys: string[];
    featureCount: number;
    percentage: number;
    aggregateValue?: number;
    symbol?: ResolvedMapSymbol;
    minimum?: number;
    maximum?: number;
}

export interface MapFeatureVisualState {
    normal: boolean;
    hovered: boolean;
    selected: boolean;
    externallyHighlighted: boolean;
    dimmed: boolean;
    filteredOut: boolean;
}

export type MapQuickFilterValues = Record<string, unknown>;
export type MapLegendSelections = Record<string, string[]>;

export interface MapSelectionResolution {
    featureKeys: string[];
    overflowCount: number;
}

export function resolveAnalyticalSelection(
    current: readonly string[],
    incoming: readonly string[],
    operation: MapSelectionOperation,
    maximum = Number.POSITIVE_INFINITY,
): MapSelectionResolution {
    const uniqueIncoming = Array.from(new Set(incoming));
    const selected = new Set(current);
    if (operation === "clear") selected.clear();
    else if (operation === "replace") {
        selected.clear();
        uniqueIncoming.forEach((key) => selected.add(key));
    } else if (operation === "add") uniqueIncoming.forEach((key) => selected.add(key));
    else if (operation === "remove") uniqueIncoming.forEach((key) => selected.delete(key));
    else
        uniqueIncoming.forEach((key) => {
            if (selected.has(key)) selected.delete(key);
            else selected.add(key);
        });
    const all = [...selected];
    const limit = Number.isFinite(maximum) ? Math.max(0, Math.floor(maximum)) : all.length;
    return { featureKeys: all.slice(0, limit), overflowCount: Math.max(0, all.length - limit) };
}

export function resolveFeatureVisualState(input: {
    featureKey: string;
    selectedFeatureKeys: ReadonlySet<string>;
    externalFeatureKeys: ReadonlySet<string>;
    hoveredFeatureKeys: ReadonlySet<string>;
    filteredFeatureKeys?: ReadonlySet<string>;
    hasEmphasis: boolean;
}): MapFeatureVisualState {
    const selected = input.selectedFeatureKeys.has(input.featureKey);
    const externallyHighlighted = input.externalFeatureKeys.has(input.featureKey);
    const hovered = input.hoveredFeatureKeys.has(input.featureKey);
    const filteredOut = input.filteredFeatureKeys?.has(input.featureKey) === true;
    const emphasized = selected || externallyHighlighted || hovered;
    return {
        normal: !input.hasEmphasis && !filteredOut,
        selected,
        externallyHighlighted,
        hovered,
        filteredOut,
        dimmed: !filteredOut && input.hasEmphasis && !emphasized,
    };
}

export function legendKeyForFeature(
    feature: ResolvedMapFeature,
    renderer: ResolvedMapRenderer,
): string {
    if (renderer.type === "uniqueValue" && renderer.field)
        return String(featureAttribute(feature, renderer.field, renderer.fieldSource ?? "joined") ?? "__null__");
    if (renderer.type === "classBreaks" && renderer.field) {
        const numeric = Number(featureAttribute(feature, renderer.field, renderer.fieldSource ?? "joined"));
        const index = renderer.breaks?.findIndex((entry) =>
            Number.isFinite(numeric) &&
            numeric >= entry.min &&
            (numeric < entry.max || entry.maxInclusive !== false && numeric <= entry.max),
        ) ?? -1;
        return index >= 0 ? `break:${index}` : "__other__";
    }
    return "__all__";
}

export function buildLegendEntries(mapId: string, layer: ResolvedMapLayer): MapLegendEntryModel[] {
    const renderer = layer.renderer;
    const groups = new Map<string, ResolvedMapFeature[]>();
    for (const feature of layer.features) {
        const key = legendKeyForFeature(feature, renderer);
        const values = groups.get(key) ?? [];
        values.push(feature);
        groups.set(key, values);
    }
    const entries: MapLegendEntryModel[] = [];
    if (renderer.type === "uniqueValue") {
        for (const [key, symbol] of renderer.valueMap ?? []) {
            const features = groups.get(key) ?? [];
            entries.push(entryModel(mapId, layer, key, layer.legend?.labels?.[key] ?? renderer.valueLabels?.get(key) ?? key, features, symbol));
        }
        const other = groups.get("__other__") ?? groups.get("__null__") ?? [];
        if (renderer.defaultSymbol || other.length)
            entries.push(entryModel(mapId, layer, "__other__", layer.legend?.labels?.__other__ ?? renderer.defaultLabel ?? "Other", other, renderer.defaultSymbol));
    } else if (renderer.type === "classBreaks") {
        for (const [index, item] of (renderer.breaks ?? []).entries()) {
            const key = `break:${index}`;
            const label = layer.legend?.labels?.[key] ?? item.label ?? `${item.min.toLocaleString()} – ${item.max.toLocaleString()}`;
            const model = entryModel(mapId, layer, key, label, groups.get(key) ?? [], item.symbol);
            model.minimum = item.min;
            model.maximum = item.max;
            entries.push(model);
        }
    } else {
        entries.push(entryModel(mapId, layer, "__all__", layer.name || "Features", layer.features, renderer.symbol));
    }
    const authoredOrder = (layer.legend?.order ?? []).map(String);
    if (authoredOrder.length)
        entries.sort((left, right) => {
            const leftIndex = authoredOrder.indexOf(left.key);
            const rightIndex = authoredOrder.indexOf(right.key);
            if (leftIndex < 0 && rightIndex < 0) return 0;
            if (leftIndex < 0) return 1;
            if (rightIndex < 0) return -1;
            return leftIndex - rightIndex;
        });
    return entries;
}

function entryModel(
    mapId: string,
    layer: ResolvedMapLayer,
    key: string,
    label: string,
    features: ResolvedMapFeature[],
    symbol?: ResolvedMapSymbol,
): MapLegendEntryModel {
    const aggregateValues = layer.legend?.valueField
        ? features
            .map((feature) => Number(featureAttribute(feature, layer.legend!.valueField!, layer.legend!.valueFieldSource ?? defaultSource(layer))))
            .filter(Number.isFinite)
        : [];
    let aggregateValue: number | undefined;
    if (aggregateValues.length) {
        const aggregation = layer.legend?.valueAggregation ?? "sum";
        if (aggregation === "sum") aggregateValue = aggregateValues.reduce((sum, value) => sum + value, 0);
        if (aggregation === "avg") aggregateValue = aggregateValues.reduce((sum, value) => sum + value, 0) / aggregateValues.length;
        if (aggregation === "min") aggregateValue = Math.min(...aggregateValues);
        if (aggregation === "max") aggregateValue = Math.max(...aggregateValues);
    }
    return {
        key,
        label,
        featureKeys: features.map((feature) => resolvedMapFeatureKey(mapId, layer, feature)),
        featureCount: features.length,
        percentage: layer.features.length ? features.length / layer.features.length : 0,
        aggregateValue,
        symbol,
    };
}

export function applyAnalyticalFilters(
    layers: readonly ResolvedMapLayer[],
    legendSelections: MapLegendSelections,
    quickFilters: readonly MapQuickFilterDefinition[],
    quickFilterValues: MapQuickFilterValues,
    selectedFeatureKeys: ReadonlySet<string>,
    filterToSelected: boolean,
    mapId: string,
): ResolvedMapLayer[] {
    return layers.map((layer) => {
        const selectedLegendKeys = legendSelections[layer.id] ?? [];
        const relevantQuickFilters = quickFilters.filter((definition) => !definition.layerId || definition.layerId === layer.id);
        let features = layer.features;
        if (selectedLegendKeys.length)
            features = features.filter((feature) => selectedLegendKeys.includes(legendKeyForFeature(feature, layer.renderer)));
        for (const definition of relevantQuickFilters) {
            const value = quickFilterValues[definition.id] ??
                definition.defaultValue ??
                (definition.type === "topN" ? definition.count ?? 10 : undefined);
            if (value === undefined || value === "" || Array.isArray(value) && value.length === 0) continue;
            if (definition.type === "topN") {
                const count = Math.max(1, Math.floor(Number(value ?? definition.count ?? 10)));
                const rankingField = definition.valueField ?? definition.field;
                const rankingSource = definition.valueFieldSource ?? definition.fieldSource ?? defaultSource(layer);
                const allowed = new Set([...features]
                    .sort((left, right) =>
                        Number(featureAttribute(right, rankingField, rankingSource)) -
                        Number(featureAttribute(left, rankingField, rankingSource)),
                    )
                    .slice(0, count));
                features = features.filter((feature) => allowed.has(feature));
                continue;
            }
            features = features.filter((feature) => quickFilterMatches(feature, layer, definition, value));
        }
        if (filterToSelected)
            features = features.filter((feature) => selectedFeatureKeys.has(resolvedMapFeatureKey(mapId, layer, feature)));
        return features === layer.features ? layer : { ...layer, features };
    });
}

function quickFilterMatches(
    feature: ResolvedMapFeature,
    layer: ResolvedMapLayer,
    definition: MapQuickFilterDefinition,
    filterValue: unknown,
): boolean {
    const value = featureAttribute(feature, definition.field, definition.fieldSource ?? defaultSource(layer));
    if (definition.type === "null") {
        if (filterValue === "null") return value === null || value === undefined || value === "";
        if (filterValue === "notNull") return value !== null && value !== undefined && value !== "";
        return true;
    }
    if (definition.type === "categorical") {
        const accepted = Array.isArray(filterValue) ? filterValue.map(String) : [String(filterValue)];
        return accepted.includes(String(value ?? "__null__"));
    }
    if (definition.type === "text") {
        const haystack = String(value ?? "").toLocaleLowerCase();
        const needle = String(filterValue).toLocaleLowerCase();
        if (definition.operator === "equals") return haystack === needle;
        if (definition.operator === "startsWith") return haystack.startsWith(needle);
        return haystack.includes(needle);
    }
    if (definition.type === "numericRange") {
        const numeric = Number(value);
        const [minimum, maximum] = Array.isArray(filterValue) ? filterValue : [];
        return Number.isFinite(numeric) &&
            (minimum === undefined || minimum === "" || numeric >= Number(minimum)) &&
            (maximum === undefined || maximum === "" || numeric <= Number(maximum));
    }
    if (definition.type === "dateRange") {
        const timestamp = new Date(String(value)).getTime();
        const [minimum, maximum] = Array.isArray(filterValue) ? filterValue : [];
        return Number.isFinite(timestamp) &&
            (!minimum || timestamp >= new Date(String(minimum)).getTime()) &&
            (!maximum || timestamp <= new Date(String(maximum)).getTime());
    }
    return true;
}

function defaultSource(layer: ResolvedMapLayer): "powerbi" | "service" | "joined" {
    if (layer.sourceType === "powerbi") return "powerbi";
    return layer.features.some((feature) => feature.powerBiRowKeys.length) ? "joined" : "service";
}
