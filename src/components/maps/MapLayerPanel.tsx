// ── Map Layer Panel ──────────────────────────────────────────────────
// Shows a list of map layers with visibility, opacity, labels, reorder,
// feature count, loading/error/warning indicators, and diagnostics.

import { h } from "preact";
import { useState } from "preact/hooks";
import type { ResolvedMapLayer } from "../../maps/model/resolvedMapTypes";
import type { MapComponent } from "../../schema/hyperpbiSchema";
import { useRenderContext } from "../../render/RenderContext";
import { Icon } from "../icons/Icon";

interface MapLayerPanelProps {
    mapId: string;
    layers: ResolvedMapLayer[];
    configuration?: MapComponent["layerPanel"];
}

export function MapLayerPanel({ mapId, layers, configuration }: MapLayerPanelProps) {
    const context = useRenderContext();
    const mapState = context.state.mapLayerState[mapId];
    const [expandedDiagnostics, setExpandedDiagnostics] = useState<Record<string, boolean>>({});
    const currentIds = new Set(layers.map(layer => layer.id));
    const layerOrder = [
        ...(mapState?.order ?? []).filter(layerId => currentIds.has(layerId)),
        ...layers.map(layer => layer.id).filter(layerId => !(mapState?.order ?? []).includes(layerId)),
    ];
    const visibility = mapState?.visibility ?? {};
    const layerOpacity = mapState?.opacity ?? {};
    const labels = mapState?.labels ?? {};

    const allowReorder = configuration?.allowViewerReorder !== false;
    const allowOpacity = configuration?.allowViewerOpacity !== false;
    const allowLabels = configuration?.allowViewerLabels !== false;

    const orderedLayers = [...layers].sort((a, b) => {
        const aIdx = layerOrder.indexOf(a.id);
        const bIdx = layerOrder.indexOf(b.id);
        if (aIdx === -1 && bIdx === -1) return a.order - b.order;
        if (aIdx === -1) return 1;
        if (bIdx === -1) return -1;
        return aIdx - bIdx;
    });

    const handleMoveLayer = (layerId: string, direction: -1 | 1) => {
        const ids = [...layerOrder];
        const idx = ids.indexOf(layerId);
        if (idx < 0) return;
        const newIdx = idx + direction;
        if (newIdx < 0 || newIdx >= ids.length) return;
        [ids[idx], ids[newIdx]] = [ids[newIdx], ids[idx]];
        context.dispatch({ type: "mapLayerOrder", mapId, layerIds: ids });
    };

    return (
        <div class="hp-map-layer-panel">
            <div class="hp-map-layer-panel-header">
                <span class="hp-map-layer-panel-title">Layers</span>
                <button
                    type="button"
                    class="hp-map-layer-reset"
                    onClick={() => context.dispatch({ type: "resetMapLayers", mapId })}
                >
                    Reset
                </button>
            </div>
            <div class="hp-map-layer-list">
                {orderedLayers.map(layer => {
                    const isVisible = visibility[layer.id] ?? layer.visible;
                    const layerOp = layerOpacity[layer.id] ?? layer.opacity ?? 1;
                    const labelsOn = labels[layer.id] ?? layer.labels?.enabled ?? false;
                    const iconName = layer.sourceType === "powerbi" ? "database"
                        : layer.sourceType === "arcgisTile" ? "grid"
                        : layer.sourceType === "arcgisDynamic" ? "image"
                        : "layers";
                    const hasError = !!(layer.error ?? layer.diagnostics.error);
                    const hasWarnings = (layer.diagnostics.warnings?.length ?? 0) > 0 && !hasError;
                    const isFirst = orderedLayers.indexOf(layer) === 0;
                    const isLast = orderedLayers.indexOf(layer) === orderedLayers.length - 1;
                    const diagnosticsOpen = expandedDiagnostics[layer.id] === true;
                    const isLoading = layer.loading || layer.diagnostics.loading;

                    return (
                        <div key={layer.id} class={`hp-map-layer-row ${!isVisible ? "hp-layer-hidden" : ""}`}>
                            <div class="hp-map-layer-main">
                                <button
                                    type="button"
                                    class="hp-map-layer-visibility"
                                    aria-label={isVisible ? `Hide ${layer.name}` : `Show ${layer.name}`}
                                    title={isVisible ? "Hide layer" : "Show layer"}
                                    onClick={() => context.dispatch({
                                        type: "mapLayerVisibility", mapId, layerId: layer.id, visible: !isVisible
                                    })}
                                >
                                    <Icon name={isVisible ? "eye" : "eye-off"} size="xs" decorative />
                                </button>
                                <span class="hp-map-layer-icon">
                                    <Icon name={iconName} size="xs" decorative />
                                </span>
                                <span class="hp-map-layer-name">{layer.name}</span>
                                <span class="hp-map-layer-count" title={`${layer.features.length} feature${layer.features.length !== 1 ? "s" : ""}`}>
                                    {layer.features.length.toLocaleString()}
                                </span>
                            </div>

                            <div class="hp-map-layer-controls">
                                {allowOpacity && (
                                    <label class="hp-map-layer-opacity" title={`Opacity: ${Math.round(layerOp * 100)}%`}>
                                        <span class="hp-map-layer-opacity-label">Opacity</span>
                                        <input
                                            type="range"
                                            min="0"
                                            max="1"
                                            step="0.05"
                                            value={layerOp}
                                            onInput={(e: Event) => {
                                                const val = Math.max(0, Math.min(1, parseFloat((e.target as HTMLInputElement).value) || 0));
                                                context.dispatch({ type: "mapLayerOpacity", mapId, layerId: layer.id, opacity: val });
                                            }}
                                            aria-label={`${layer.name} opacity`}
                                        />
                                    </label>
                                )}

                                {allowLabels && layer.labels && (
                                    <button
                                        type="button"
                                        class={`hp-map-layer-label-toggle ${labelsOn ? "hp-active" : ""}`}
                                        aria-label={labelsOn ? `Hide labels for ${layer.name}` : `Show labels for ${layer.name}`}
                                        title={labelsOn ? "Hide labels" : "Show labels"}
                                        onClick={() => context.dispatch({
                                            type: "mapLayerLabels", mapId, layerId: layer.id, visible: !labelsOn
                                        })}
                                    >
                                        <Icon name="text" size="xs" decorative />
                                    </button>
                                )}

                                {allowReorder && (
                                    <div class="hp-map-layer-reorder">
                                        <button
                                            type="button"
                                            class="hp-map-layer-move"
                                            disabled={isFirst}
                                            aria-label={`Move ${layer.name} up`}
                                            title="Move up"
                                            onClick={() => handleMoveLayer(layer.id, -1)}
                                        >
                                            <Icon name="chevron-up" size="xs" decorative />
                                        </button>
                                        <button
                                            type="button"
                                            class="hp-map-layer-move"
                                            disabled={isLast}
                                            aria-label={`Move ${layer.name} down`}
                                            title="Move down"
                                            onClick={() => handleMoveLayer(layer.id, 1)}
                                        >
                                            <Icon name="chevron-down" size="xs" decorative />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {isLoading && (
                                <div class="hp-map-layer-loading" title="Loading…" />
                            )}

                            {hasError && (
                                <button
                                    type="button"
                                    class="hp-map-layer-error"
                                    title={layer.error ?? layer.diagnostics.error}
                                    aria-label={`${layer.name} error: ${layer.error ?? layer.diagnostics.error}`}
                                    aria-expanded={diagnosticsOpen}
                                    onClick={() => setExpandedDiagnostics(previous => ({
                                        ...previous, [layer.id]: !previous[layer.id]
                                    }))}
                                >
                                    ⚠️ Error
                                </button>
                            )}

                            {hasWarnings && (
                                <button
                                    type="button"
                                    class="hp-map-layer-warning"
                                    title={layer.diagnostics.warnings.join("; ")}
                                    aria-label={`${layer.name} has ${layer.diagnostics.warnings.length} warning${layer.diagnostics.warnings.length !== 1 ? "s" : ""}`}
                                    aria-expanded={diagnosticsOpen}
                                    onClick={() => setExpandedDiagnostics(previous => ({
                                        ...previous, [layer.id]: !previous[layer.id]
                                    }))}
                                >
                                    ⚡ {layer.diagnostics.warnings.length}
                                </button>
                            )}

                            {diagnosticsOpen && (hasError || hasWarnings) && (
                                <div class="hp-map-layer-diagnostics" role="status">
                                    {(layer.error ?? layer.diagnostics.error) && (
                                        <div><strong>Error:</strong> {layer.error ?? layer.diagnostics.error}</div>
                                    )}
                                    {layer.diagnostics.warnings.length > 0 && (
                                        <div><strong>Warnings:</strong> {layer.diagnostics.warnings.join("; ")}</div>
                                    )}
                                    <dl>
                                        <dt>Source type</dt><dd>{layer.diagnostics.sourceType}</dd>
                                        {layer.diagnostics.sourceUrl && <><dt>Source URL</dt><dd>{layer.diagnostics.sourceUrl}</dd></>}
                                        <dt>Feature count</dt><dd>{layer.diagnostics.featureCount}</dd>
                                        <dt>Request count</dt><dd>{layer.diagnostics.requestCount}</dd>
                                        {layer.diagnostics.objectIdField && <><dt>OID field</dt><dd>{layer.diagnostics.objectIdField}</dd></>}
                                        {layer.diagnostics.queryStrategy && <><dt>Query strategy</dt><dd>{layer.diagnostics.queryStrategy}</dd></>}
                                        {layer.diagnostics.cacheUsed !== undefined && <><dt>Cache used</dt><dd>{layer.diagnostics.cacheUsed ? "Yes" : "No"}</dd></>}
                                        {layer.diagnostics.joinField && <><dt>Join field</dt><dd>{layer.diagnostics.joinField}</dd></>}
                                        {layer.diagnostics.joinDiagnostics && <>
                                            <dt>Join diagnostics</dt>
                                            <dd>{layer.diagnostics.joinDiagnostics.matchedPowerBiRowCount} Power BI rows and {layer.diagnostics.joinDiagnostics.matchedServiceFeatureCount} service features matched; {layer.diagnostics.joinDiagnostics.unmatchedPowerBiKeyCount} Power BI keys and {layer.diagnostics.joinDiagnostics.unmatchedServiceFeatureCount} service features unmatched.</dd>
                                        </>}
                                    </dl>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
