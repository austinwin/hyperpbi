import { useMemo } from "preact/hooks";
import type { MapQuickFilterDefinition } from "../../schema/mapSchema";
import type { ResolvedMapLayer } from "../../maps/model/resolvedMapTypes";
import { featureAttribute } from "../../maps/attributes/mapFeatureAttributes";
import { useRenderContext } from "../../render/RenderContext";

export function MapQuickFilterPanel({
    mapId,
    definitions,
    layers,
}: {
    mapId: string;
    definitions: readonly MapQuickFilterDefinition[];
    layers: readonly ResolvedMapLayer[];
}) {
    const context = useRenderContext();
    const values = context.state.mapUiState[mapId]?.quickFilterValues ?? {};
    const filterToSelected = context.state.mapUiState[mapId]?.filterToSelected === true;
    const categories = useMemo(
        () => new Map(definitions.map((definition) => [
            definition.id,
            categoryValues(definition, layers),
        ] as const)),
        [definitions, layers],
    );
    const set = (id: string, value?: unknown) =>
        context.dispatch({ type: "setMapQuickFilter", mapId, filterId: id, value });

    if (!definitions.length)
        return <div class="hp-map-panel-empty">No map quick filters are configured.</div>;
    return (
        <div class="hp-map-quick-filters">
            {definitions.map((definition) => {
                const value = values[definition.id] ?? definition.defaultValue;
                const label = definition.label ?? definition.field;
                if (definition.type === "categorical") {
                    const selected = Array.isArray(value) ? value.map(String) : value === undefined ? [] : [String(value)];
                    return (
                        <fieldset key={definition.id}>
                            <legend>{label}</legend>
                            <select
                                multiple={definition.multiSelect !== false}
                                aria-label={label}
                                onChange={(event) => {
                                    const selectedValues = Array.from(event.currentTarget.selectedOptions).map((option) => option.value);
                                    set(definition.id, definition.multiSelect === false ? selectedValues[0] : selectedValues);
                                }}
                            >
                                {(categories.get(definition.id) ?? []).map((category) =>
                                    <option value={category.value} selected={selected.includes(category.value)}>{category.label} ({category.count})</option>,
                                )}
                            </select>
                        </fieldset>
                    );
                }
                if (definition.type === "numericRange" || definition.type === "dateRange") {
                    const range = Array.isArray(value) ? value : ["", ""];
                    return (
                        <fieldset key={definition.id}>
                            <legend>{label}</legend>
                            <div class="hp-map-filter-range">
                                <input aria-label={`${label} minimum`} type={definition.type === "dateRange" ? "date" : "number"} value={String(range[0] ?? "")} onInput={(event) => set(definition.id, [event.currentTarget.value, range[1] ?? ""])} />
                                <span>to</span>
                                <input aria-label={`${label} maximum`} type={definition.type === "dateRange" ? "date" : "number"} value={String(range[1] ?? "")} onInput={(event) => set(definition.id, [range[0] ?? "", event.currentTarget.value])} />
                            </div>
                        </fieldset>
                    );
                }
                if (definition.type === "text")
                    return (
                        <label key={definition.id}>
                            <span>{label}</span>
                            <input type="search" value={String(value ?? "")} placeholder={`Search ${label}`} onInput={(event) => set(definition.id, event.currentTarget.value)} />
                        </label>
                    );
                if (definition.type === "null")
                    return (
                        <label key={definition.id}>
                            <span>{label}</span>
                            <select value={String(value ?? "all")} onChange={(event) => set(definition.id, event.currentTarget.value)}>
                                <option value="all">All values</option>
                                <option value="null">Null only</option>
                                <option value="notNull">Not null</option>
                            </select>
                        </label>
                    );
                return (
                    <label key={definition.id}>
                        <span>{label}</span>
                        <input type="number" min="1" max="1000" value={Number(value ?? definition.count ?? 10)} onInput={(event) => set(definition.id, Number(event.currentTarget.value))} />
                    </label>
                );
            })}
            <div class="hp-map-quick-filter-actions">
                <button type="button" aria-pressed={filterToSelected} onClick={() => context.dispatch({ type: "setMapFilterToSelected", mapId, value: !filterToSelected })}>Filter to selected</button>
                <button type="button" onClick={() => context.dispatch({ type: "clearMapQuickFilters", mapId })}>Clear filters</button>
            </div>
        </div>
    );
}

function categoryValues(
    definition: MapQuickFilterDefinition,
    layers: readonly ResolvedMapLayer[],
): Array<{ value: string; label: string; count: number }> {
    const counts = new Map<string, number>();
    for (const layer of layers) {
        if (definition.layerId && layer.id !== definition.layerId) continue;
        const source = definition.fieldSource ?? (layer.sourceType === "powerbi" ? "powerbi" : "service");
        for (const feature of layer.features) {
            const raw = featureAttribute(feature, definition.field, source);
            if ((raw === null || raw === undefined || raw === "") && definition.includeNull === false) continue;
            const value = raw === null || raw === undefined || raw === "" ? "__null__" : String(raw);
            counts.set(value, (counts.get(value) ?? 0) + 1);
        }
    }
    return [...counts].map(([value, count]) => ({
        value,
        label: value === "__null__" ? "(Blank)" : value,
        count,
    })).sort((left, right) => left.label.localeCompare(right.label));
}
