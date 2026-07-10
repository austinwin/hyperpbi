import { h } from "preact";
import type { ResolvedMapLayer, ResolvedMapRenderer, ResolvedMapSymbol } from "../../maps/model/resolvedMapTypes";
import { useRenderContext } from "../../render/RenderContext";

export function MapLegendPanel({ mapId, layers }: { mapId: string; layers: ResolvedMapLayer[] }) {
    const context = useRenderContext();
    const visibility = context.state.mapLayerState[mapId]?.visibility ?? {};
    const visibleLayers = layers.filter(layer => (visibility[layer.id] ?? layer.visible ?? true) && layer.legend?.visible !== false && hasMeaningfulLegend(layer.renderer));

    return (
        <div class="hp-map-legend">
            {visibleLayers.length === 0 ? (
                <div class="hp-map-panel-empty">No legend entries are available for the currently visible layers.</div>
            ) : visibleLayers.map(layer => {
                const title = layer.legend?.title ?? layer.name;
                return layer.legend?.collapsed ? (
                    <details key={layer.id} class="hp-map-legend-group">
                        <summary class="hp-map-legend-title" title={title}>{title}</summary>
                        <div class="hp-map-legend-entries">{renderLegendEntries(layer.renderer, layer.name)}</div>
                    </details>
                ) : (
                    <section key={layer.id} class="hp-map-legend-group">
                        <strong class="hp-map-legend-title" title={title}>{title}</strong>
                        <div class="hp-map-legend-entries">{renderLegendEntries(layer.renderer, layer.name)}</div>
                    </section>
                );
            })}
        </div>
    );
}

function hasMeaningfulLegend(renderer: ResolvedMapRenderer): boolean {
    if (renderer.type === "heatmap" || renderer.type === "densityGrid" || renderer.type === "service") return false;
    if (renderer.type === "uniqueValue") return Boolean(renderer.valueMap?.size || renderer.defaultSymbol);
    if (renderer.type === "classBreaks") return Boolean(renderer.breaks?.length);
    return ["simple", "continuousColor", "proportionalSize", "cluster"].includes(renderer.type);
}

function swatch(symbol: ResolvedMapSymbol | undefined, label: string): h.JSX.Element {
    const color = symbol?.fillColor ?? symbol?.color ?? "#3388ff";
    const outline = symbol?.outlineColor ?? symbol?.color ?? color;
    const width = symbol?.outlineWidth ?? symbol?.weight ?? 1;
    return <span class="hp-map-legend-swatch" title={label} style={{ background: color, border: `${width}px solid ${outline}` }} />;
}

function entry(label: string, symbol?: ResolvedMapSymbol): h.JSX.Element {
    return <div class="hp-map-legend-entry">{swatch(symbol, label)}<span title={label}>{label}</span></div>;
}

function renderLegendEntries(renderer: ResolvedMapRenderer, layerName: string): h.JSX.Element | h.JSX.Element[] {
    if (renderer.type === "simple") return entry(layerName || "Features", renderer.symbol);
    if (renderer.type === "uniqueValue") {
        const entries: h.JSX.Element[] = [];
        for (const [value, symbol] of renderer.valueMap ?? []) entries.push(<div key={value}>{entry(renderer.valueLabels?.get(value) ?? String(value), symbol)}</div>);
        if (renderer.defaultSymbol) entries.push(<div key="__other__">{entry(renderer.defaultLabel ?? "Other", renderer.defaultSymbol)}</div>);
        return entries;
    }
    if (renderer.type === "classBreaks") {
        return (renderer.breaks ?? []).map(brk => {
            const label = brk.label ?? `${brk.min.toLocaleString()} – ${brk.max.toLocaleString()}`;
            return <div key={`${brk.min}-${brk.max}`}>{entry(label, brk.symbol)}</div>;
        });
    }
    if (renderer.type === "continuousColor") {
        const min = renderer.domainMin ?? 0;
        const max = renderer.domainMax ?? 1;
        return <div class="hp-map-legend-continuous"><div class="hp-map-legend-gradient" title={`${min} to ${max}`} style={{ background: `linear-gradient(90deg, ${renderer.minColor ?? "#f0f0f0"}, ${renderer.maxColor ?? "#3388ff"})` }} /><div class="hp-map-legend-range"><span>{min.toLocaleString()}</span><span>{max.toLocaleString()}</span></div></div>;
    }
    if (renderer.type === "proportionalSize") {
        const minValue = renderer.domainMin ?? 0;
        const maxValue = renderer.domainMax ?? 1;
        const midValue = (minValue + maxValue) / 2;
        const minSize = renderer.minSize ?? 4;
        const maxSize = renderer.maxSize ?? 24;
        const midSize = Math.round((minSize + maxSize) / 2);
        const values = [[minValue, minSize], [midValue, midSize], [maxValue, maxSize]];
        return <div class="hp-map-legend-proportional">{values.map(([value, size]) => <div class="hp-map-legend-size" key={String(value)}><span style={{ width: `${size}px`, height: `${size}px`, background: renderer.baseColor ?? "#3388ff" }} /><b>{value.toLocaleString()}</b></div>)}</div>;
    }
    if (renderer.type === "cluster") {
        const label = renderer.clusterLabel === "sum" ? "Cluster sum" : renderer.clusterLabel === "count" ? "Cluster count" : "Clustered points";
        return <div class="hp-map-legend-entry hp-map-legend-cluster"><span class="hp-map-cluster-swatch"><b>3</b></span><span title={label}>{label}</span></div>;
    }
    return <span />;
}
