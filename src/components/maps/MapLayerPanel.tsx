// ── Map Layer Panel ──────────────────────────────────────────────────
// Shows a list of map layers with visibility toggles, opacity, reorder,
// and per-layer controls.

import { h } from "preact";
import type { ResolvedMapLayer } from "../../maps/model/resolvedMapTypes";
import { useRenderContext } from "../../render/RenderContext";
import { Icon } from "../icons/Icon";

export function MapLayerPanel({ mapId, layers }: { mapId: string; layers: ResolvedMapLayer[] }) {
    const context = useRenderContext();
    const mapState = context.state.mapLayerState[mapId];
    const layerOrder = mapState?.order ?? layers.map(l => l.id);
    const visibility = mapState?.visibility ?? {};
    const opacity = mapState?.opacity ?? {};
    const labels = mapState?.labels ?? {};

    const orderedLayers = [...layers].sort((a, b) => {
        const aIdx = layerOrder.indexOf(a.id);
        const bIdx = layerOrder.indexOf(b.id);
        if (aIdx === -1 && bIdx === -1) return a.order - b.order;
        if (aIdx === -1) return 1;
        if (bIdx === -1) return -1;
        return aIdx - bIdx;
    });

    return (
        <div class="hp-map-layer-panel">
            <div class="hp-map-layer-panel-header">
                <span class="hp-map-layer-panel-title">Layers</span>
            </div>
            <div class="hp-map-layer-list">
                {orderedLayers.map(layer => {
                    const isVisible = visibility[layer.id] ?? layer.visible;
                    const layerOpacity = opacity[layer.id] ?? layer.opacity;
                    const labelsOn = labels[layer.id] ?? layer.labels?.enabled ?? false;
                    const iconName = layer.sourceType === "powerbi" ? "database" :
                        layer.sourceType === "arcgisFeature" ? "layers" : "map";

                    return (
                        <div key={layer.id} class={`hp-map-layer-row ${!isVisible ? "hp-layer-hidden" : ""}`}>
                            <button
                                type="button"
                                class="hp-map-layer-visibility"
                                aria-label={isVisible ? "Hide layer" : "Show layer"}
                                onClick={() => context.dispatch({
                                    type: "mapLayerVisibility", mapId, layerId: layer.id, visible: !isVisible
                                })}
                            >
                                <Icon name={isVisible ? "eye" : "eye"} size="xs" decorative />
                            </button>
                            <span class="hp-map-layer-icon">
                                <Icon name={iconName} size="xs" decorative />
                            </span>
                            <span class="hp-map-layer-name">{layer.name}</span>
                            <span class="hp-map-layer-count">{layer.features.length.toLocaleString()}</span>
                            {layer.loading && <span class="hp-map-layer-loading" />}
                            {layer.error && <span class="hp-map-layer-error" title={layer.error}>!</span>}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
