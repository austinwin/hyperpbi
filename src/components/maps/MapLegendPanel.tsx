import { h } from "preact";
import { useMemo, useState } from "preact/hooks";
import type { ResolvedMapLayer, ResolvedMapRenderer, ResolvedMapSymbol } from "../../maps/model/resolvedMapTypes";
import type { MapLegendDefinition } from "../../schema/mapSchema";
import { buildLegendEntries, type MapLegendEntryModel } from "../../maps/interactions/mapAnalyticalInteraction";
import { useRenderContext } from "../../render/RenderContext";

export function MapLegendPanel({
    mapId,
    layers,
    definition,
    onSelectFeatures,
}: {
    mapId: string;
    layers: ResolvedMapLayer[];
    definition?: MapLegendDefinition;
    onSelectFeatures?: (layer: ResolvedMapLayer, featureKeys: string[], operation: "replace" | "add" | "toggle" | "remove") => void;
}) {
    const context = useRenderContext();
    const [search, setSearch] = useState("");
    const visibility = context.state.mapLayerState[mapId]?.visibility ?? {};
    const legendSelections = context.state.mapUiState[mapId]?.legendSelections ?? {};
    const visibleLayers = layers.filter((layer) =>
        (visibility[layer.id] ?? layer.visible ?? true) &&
        layer.legend?.visible !== false &&
        hasMeaningfulLegend(layer.renderer),
    );
    const models = useMemo(
        () => new Map(visibleLayers.map((layer) => [layer.id, buildLegendEntries(mapId, layer)] as const)),
        [mapId, visibleLayers],
    );
    const searchable = definition?.search !== false && visibleLayers.some((layer) => layer.legend?.search !== false && (models.get(layer.id)?.length ?? 0) > 8);
    const query = search.trim().toLocaleLowerCase();

    const setFilter = (layer: ResolvedMapLayer, keys: string[]) => {
        if (layer.legend?.clickAction === "filterMap")
            for (const candidate of visibleLayers) {
                const candidateKeys = new Set((models.get(candidate.id) ?? []).map((entry) => entry.key));
                context.dispatch({
                    type: "setMapLegendSelection",
                    mapId,
                    layerId: candidate.id,
                    keys: keys.filter((key) => candidateKeys.has(key)),
                });
            }
        else
            context.dispatch({ type: "setMapLegendSelection", mapId, layerId: layer.id, keys });
    };

    return (
        <div class="hp-map-legend">
            {searchable && (
                <label class="hp-map-legend-search">
                    <span class="hp-visually-hidden">Search legend</span>
                    <input value={search} placeholder="Search legend…" onInput={(event) => setSearch(event.currentTarget.value)} />
                </label>
            )}
            {visibleLayers.length === 0 ? (
                <div class="hp-map-panel-empty">No legend entries are available for the currently visible layers.</div>
            ) : visibleLayers.map((layer) => {
                const title = layer.legend?.title ?? layer.name;
                const allEntries = models.get(layer.id) ?? [];
                const entries = query ? allEntries.filter((entry) => entry.label.toLocaleLowerCase().includes(query)) : allEntries;
                const selected = legendSelections[layer.id] ?? [];
                const body = (
                    <>
                        {layer.legend?.interactive !== false && allEntries.length > 1 && (
                            <div class="hp-map-legend-actions">
                                <button type="button" onClick={() => setFilter(layer, allEntries.map((entry) => entry.key))}>Select all</button>
                                <button type="button" onClick={() => setFilter(layer, [])}>Clear</button>
                            </div>
                        )}
                        <div class="hp-map-legend-entries" style={{ maxHeight: `${layer.legend?.maxHeight ?? definition?.maxHeight ?? 320}px` }}>
                            {renderLegend(layer, entries, selected, {
                                click: (entry, event) => {
                                    if (layer.legend?.interactive === false) return;
                                    const action = layer.legend?.clickAction ?? "filterLayer";
                                    const multiple = layer.legend?.selectionMode === "multiple" || event.ctrlKey || event.metaKey;
                                    const alreadySelected = selected.includes(entry.key);
                                    const next = multiple
                                        ? alreadySelected ? selected.filter((key) => key !== entry.key) : [...selected, entry.key]
                                        : alreadySelected && selected.length === 1 ? [] : [entry.key];
                                    if (action === "filterLayer" || action === "filterMap") setFilter(layer, next);
                                    else if (action === "highlight")
                                        context.dispatch({
                                            type: "setMapLegendHover",
                                            mapId,
                                            featureKeys: alreadySelected ? [] : entry.featureKeys,
                                        });
                                    else onSelectFeatures?.(layer, entry.featureKeys, multiple ? "toggle" : "replace");
                                },
                                isolate: (entry) => setFilter(layer, [entry.key]),
                                hover: (entry) => {
                                    if ((layer.legend?.hoverAction ?? "highlight") !== "highlight") return;
                                    context.dispatch({ type: "setMapLegendHover", mapId, featureKeys: entry?.featureKeys ?? [] });
                                },
                            })}
                        </div>
                    </>
                );
                return layer.legend?.collapsed ? (
                    <details key={layer.id} class="hp-map-legend-group">
                        <summary class="hp-map-legend-title" title={title}>{title}</summary>
                        {body}
                    </details>
                ) : (
                    <section key={layer.id} class="hp-map-legend-group">
                        <strong class="hp-map-legend-title" title={title}>{title}</strong>
                        {body}
                    </section>
                );
            })}
        </div>
    );
}

function hasMeaningfulLegend(renderer: ResolvedMapRenderer): boolean {
    if (renderer.type === "service") return false;
    if (renderer.type === "uniqueValue") return Boolean(renderer.valueMap?.size || renderer.defaultSymbol);
    if (renderer.type === "classBreaks") return Boolean(renderer.breaks?.length);
    return true;
}

function swatch(symbol: ResolvedMapSymbol | undefined, label: string): h.JSX.Element {
    const color = symbol?.fillColor ?? symbol?.color ?? "#3388ff";
    const outline = symbol?.outlineColor ?? symbol?.color ?? color;
    const width = symbol?.outlineWidth ?? symbol?.weight ?? 1;
    const shape = symbol?.shape ?? "circle";
    return <span class={`hp-map-legend-swatch is-${shape}`} title={label} style={{ background: color, border: `${width}px solid ${outline}` }} />;
}

function renderEntry(
    layer: ResolvedMapLayer,
    entry: MapLegendEntryModel,
    selected: boolean,
    handlers: {
        click: (entry: MapLegendEntryModel, event: MouseEvent) => void;
        isolate: (entry: MapLegendEntryModel) => void;
        hover: (entry?: MapLegendEntryModel) => void;
    },
): h.JSX.Element {
    return (
        <div class={`hp-map-legend-entry ${selected ? "is-selected" : ""}`} data-legend-key={entry.key}>
            <button
                type="button"
                class="hp-map-legend-entry-main"
                aria-pressed={selected}
                onClick={(event) => handlers.click(entry, event)}
                onMouseEnter={() => handlers.hover(entry)}
                onMouseLeave={() => handlers.hover()}
            >
                {swatch(entry.symbol, entry.label)}
                <span title={entry.label}>{entry.label}</span>
                {layer.legend?.showCounts !== false && <b>{entry.featureCount.toLocaleString()}</b>}
                {layer.legend?.showPercentages && <small>{(entry.percentage * 100).toFixed(1)}%</small>}
                {entry.aggregateValue !== undefined && <small>{entry.aggregateValue.toLocaleString()}</small>}
            </button>
            {layer.legend?.interactive !== false && (
                <button type="button" class="hp-map-legend-isolate" aria-label={`Isolate ${entry.label}`} title={`Isolate ${entry.label}`} onClick={() => handlers.isolate(entry)}>◎</button>
            )}
        </div>
    );
}

function renderLegend(
    layer: ResolvedMapLayer,
    entries: MapLegendEntryModel[],
    selected: string[],
    handlers: {
        click: (entry: MapLegendEntryModel, event: MouseEvent) => void;
        isolate: (entry: MapLegendEntryModel) => void;
        hover: (entry?: MapLegendEntryModel) => void;
    },
): h.JSX.Element | h.JSX.Element[] {
    const renderer = layer.renderer;
    if (
        layer.legend?.type === "continuousColor" ||
        layer.legend?.type === "heatIntensity" ||
        renderer.type === "continuousColor" ||
        renderer.type === "heatmap" ||
        renderer.type === "densityGrid"
    ) {
        const min = renderer.domainMin ?? 0;
        const max = renderer.maxIntensity ?? renderer.domainMax ?? 1;
        const colors = renderer.type === "heatmap"
            ? Object.entries(renderer.heatGradient ?? { 0: "#2563eb", 0.5: "#22c55e", 1: "#dc2626" })
                .sort(([left], [right]) => Number(left) - Number(right))
                .map(([stop, color]) => `${color} ${Number(stop) * 100}%`).join(", ")
            : `${renderer.minColor ?? "#f0f0f0"}, ${renderer.maxColor ?? "#3388ff"}`;
        return <div class="hp-map-legend-continuous"><div class="hp-map-legend-gradient" title={`${min} to ${max}`} style={{ background: `linear-gradient(90deg, ${colors})` }} /><div class="hp-map-legend-range"><span>{min.toLocaleString()}</span><span>{max.toLocaleString()}</span></div></div>;
    }
    if (layer.legend?.type === "proportionalSize" || renderer.type === "proportionalSize") {
        const minValue = renderer.domainMin ?? 0;
        const maxValue = renderer.domainMax ?? 1;
        const midValue = (minValue + maxValue) / 2;
        const minSize = renderer.minSize ?? 4;
        const maxSize = renderer.maxSize ?? 24;
        const values = [[minValue, minSize], [midValue, Math.round((minSize + maxSize) / 2)], [maxValue, maxSize]];
        return <div class="hp-map-legend-proportional">{values.map(([value, size]) => <div class="hp-map-legend-size" key={String(value)}><span style={{ width: `${size}px`, height: `${size}px`, background: renderer.baseColor ?? "#3388ff" }} /><b>{value.toLocaleString()}</b></div>)}</div>;
    }
    if (renderer.type === "cluster") {
        const label = renderer.clusterLabel === "sum" ? "Cluster sum" : "Cluster count";
        return <div class="hp-map-legend-entry hp-map-legend-cluster"><span class="hp-map-cluster-swatch"><b>3</b></span><span title={label}>{label}</span></div>;
    }
    return entries.map((entry) => <div key={entry.key}>{renderEntry(layer, entry, selected.includes(entry.key), handlers)}</div>);
}
