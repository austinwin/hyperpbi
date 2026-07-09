// ── Map Legend Panel ─────────────────────────────────────────────────
// Shows per-layer legends from resolved layers. Supports simple,
// unique-value, class-break, continuous color, and proportional size.

import { h } from "preact";
import type { ResolvedMapLayer, ResolvedMapRenderer, ResolvedMapSymbol, ResolvedClassBreak } from "../../maps/model/resolvedMapTypes";
import { useRenderContext } from "../../render/RenderContext";

interface MapLegendPanelProps {
    mapId: string;
    layers: ResolvedMapLayer[];
}

export function MapLegendPanel({ mapId, layers }: MapLegendPanelProps) {
    const context = useRenderContext();
    const mapState = context.state.mapLayerState[mapId];
    const visibility = mapState?.visibility ?? {};

    const visibleLayers = layers.filter(l => {
        const isVisible = visibility[l.id] ?? l.visible ?? true;
        return isVisible && l.legend?.visible !== false && hasMeaningfulLegend(l);
    });

    if (visibleLayers.length === 0) return null;

    return (
        <div class="hp-map-legend">
            {visibleLayers.map(layer => (
                <div key={layer.id} class="hp-map-legend-layer">
                    {layer.legend?.title && (
                        <strong class="hp-map-legend-title">{layer.legend.title}</strong>
                    )}
                    {!layer.legend?.title && (
                        <strong class="hp-map-legend-title">{layer.name}</strong>
                    )}
                    {renderLegendEntries(layer.renderer)}
                </div>
            ))}
        </div>
    );
}

function hasMeaningfulLegend(layer: ResolvedMapLayer): boolean {
    const r = layer.renderer as ResolvedMapRenderer;
    if (r.type === "simple" && !r.symbol) return false;
    if (r.type === "heatmap" || r.type === "densityGrid") return false;
    if (r.type === "cluster") return true;
    if (r.type === "simple") return true;
    if (r.type === "uniqueValue" && r.valueMap && r.valueMap.size > 0) return true;
    if (r.type === "classBreaks" && r.breaks && r.breaks.length > 0) return true;
    if (r.type === "continuousColor") return true;
    if (r.type === "proportionalSize") return true;
    return false;
}

function renderLegendEntries(renderer: ResolvedMapRenderer): h.JSX.Element | null {
    switch (renderer.type) {
        case "simple":
            return renderSimpleLegend(renderer.symbol);
        case "uniqueValue":
            return renderUniqueValueLegend(renderer);
        case "classBreaks":
            return renderClassBreaksLegend(renderer);
        case "continuousColor":
            return renderContinuousLegend(renderer);
        case "proportionalSize":
            return renderProportionalLegend(renderer);
        case "cluster":
            return <div class="hp-map-legend-entry">Clustered points</div>;
        default:
            return null;
    }
}

function renderSimpleLegend(symbol?: ResolvedMapSymbol): h.JSX.Element {
    const color = symbol?.fillColor ?? symbol?.color ?? "#3388ff";
    const outlineColor = symbol?.outlineColor ?? symbol?.color ?? color;
    const weight = symbol?.weight ?? symbol?.outlineWidth ?? 2;
    return (
        <div class="hp-map-legend-entry">
            <span class="hp-map-legend-swatch" style={{
                background: color,
                border: `${weight}px solid ${outlineColor}`,
            }} />
            <span>{symbol?.shape ?? "default"}</span>
        </div>
    );
}

function renderUniqueValueLegend(renderer: ResolvedMapRenderer): h.JSX.Element {
    const entries: h.JSX.Element[] = [];
    if (renderer.valueMap) {
        for (const [value, symbol] of renderer.valueMap) {
            const color = symbol.fillColor ?? symbol.color ?? "#3388ff";
            entries.push(
                <div key={value} class="hp-map-legend-entry">
                    <span class="hp-map-legend-swatch" style={{ background: color }} />
                    <span>{String(value)}</span>
                </div>
            );
        }
    }
    if (renderer.defaultSymbol && renderer.defaultLabel) {
        const color = renderer.defaultSymbol.fillColor ?? renderer.defaultSymbol.color ?? "#ccc";
        entries.push(
            <div key="__default__" class="hp-map-legend-entry">
                <span class="hp-map-legend-swatch" style={{ background: color }} />
                <span>{renderer.defaultLabel}</span>
            </div>
        );
    }
    return <div>{entries}</div>;
}

function renderClassBreaksLegend(renderer: ResolvedMapRenderer): h.JSX.Element {
    const entries: h.JSX.Element[] = [];
    if (renderer.breaks) {
        for (const brk of renderer.breaks) {
            const color = brk.symbol?.fillColor ?? brk.symbol?.color ?? "#3388ff";
            entries.push(
                <div key={`${brk.min}-${brk.max}`} class="hp-map-legend-entry">
                    <span class="hp-map-legend-swatch" style={{ background: color }} />
                    <span>{brk.label ?? `${brk.min} – ${brk.max}`}</span>
                </div>
            );
        }
    }
    return <div>{entries}</div>;
}

function renderContinuousLegend(renderer: ResolvedMapRenderer): h.JSX.Element {
    const minColor = renderer.minColor ?? "#f0f0f0";
    const maxColor = renderer.maxColor ?? "#3388ff";
    const domainMin = renderer.domainMin ?? 0;
    const domainMax = renderer.domainMax ?? 1;
    return (
        <div class="hp-map-legend-entry">
            <div class="hp-map-gradient" style={{
                background: `linear-gradient(90deg, ${minColor}, ${maxColor})`,
                width: "100%", height: "12px", borderRadius: "2px",
            }} />
            <div class="hp-map-legend-range">
                <span>{domainMin.toLocaleString()}</span>
                <span>{domainMax.toLocaleString()}</span>
            </div>
        </div>
    );
}

function renderProportionalLegend(renderer: ResolvedMapRenderer): h.JSX.Element {
    const minSize = renderer.minSize ?? 4;
    const maxSize = renderer.maxSize ?? 24;
    const color = renderer.baseColor ?? "#3388ff";
    return (
        <div class="hp-map-legend-entry">
            <div class="hp-map-legend-sizes">
                <span class="hp-map-legend-size-dot" style={{
                    width: `${minSize}px`, height: `${minSize}px`, background: color,
                }} />
                <span class="hp-map-legend-size-dot" style={{
                    width: `${Math.round((minSize + maxSize) / 2)}px`,
                    height: `${Math.round((minSize + maxSize) / 2)}px`,
                    background: color,
                }} />
                <span class="hp-map-legend-size-dot" style={{
                    width: `${maxSize}px`, height: `${maxSize}px`, background: color,
                }} />
            </div>
        </div>
    );
}
