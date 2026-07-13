import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import type { ResolvedMapLayer } from "../../maps/model/resolvedMapTypes";
import type { MapComponent } from "../../schema/hyperpbiSchema";
import { useRenderContext } from "../../render/RenderContext";
import { Icon } from "../icons/Icon";

interface MapLayerPanelProps {
    mapId: string;
    layers: ResolvedMapLayer[];
    configuration?: MapComponent["layerPanel"];
}

function OpacityInput({ mapId, layer, opacity }: { mapId: string; layer: ResolvedMapLayer; opacity: number }) {
    const context = useRenderContext();
    const percentage = Math.round(Math.max(0, Math.min(1, opacity)) * 100);
    const [draft, setDraft] = useState(String(percentage));
    useEffect(() => setDraft(String(percentage)), [percentage]);

    const commit = (candidate = draft) => {
        if (!candidate.trim()) {
            setDraft(String(percentage));
            return;
        }
        const parsed = Number(candidate);
        if (!Number.isFinite(parsed)) {
            setDraft(String(percentage));
            return;
        }
        const clamped = Math.max(0, Math.min(100, Math.round(parsed)));
        setDraft(String(clamped));
        context.dispatch({ type: "mapLayerOpacity", mapId, layerId: layer.id, opacity: clamped / 100 });
    };

    return (
        <label class="hp-map-layer-opacity">
            <span class="hp-map-visually-hidden">{layer.name} opacity</span>
            <input
                type="number"
                min="0"
                max="100"
                step="1"
                value={draft}
                aria-label={`${layer.name} opacity`}
                onInput={(event: Event) => setDraft((event.currentTarget as HTMLInputElement).value)}
                onBlur={(event: FocusEvent) => commit((event.currentTarget as HTMLInputElement).value)}
                onKeyDown={(event: KeyboardEvent) => {
                    if (event.key === "Enter") {
                        event.preventDefault();
                        commit((event.currentTarget as HTMLInputElement).value);
                    }
                }}
            />
            <span aria-hidden="true">%</span>
        </label>
    );
}

export function MapLayerPanel({ mapId, layers, configuration }: MapLayerPanelProps) {
    const context = useRenderContext();
    const mapState = context.state.mapLayerState[mapId];
    const [expandedDiagnostics, setExpandedDiagnostics] = useState<Record<string, boolean>>({});
    const currentIds = new Set(layers.map(layer => layer.id));
    const storedOrder = mapState?.order ?? [];
    const layerOrder = [
        ...storedOrder.filter(layerId => currentIds.has(layerId)),
        ...layers.map(layer => layer.id).filter(layerId => !storedOrder.includes(layerId)),
    ];
    const allowReorder = configuration?.allowViewerReorder !== false;
    const allowOpacity = configuration?.allowViewerOpacity !== false;
    const allowLabels = configuration?.allowViewerLabels !== false;
    const orderedLayers = [...layers].sort((left, right) => layerOrder.indexOf(left.id) - layerOrder.indexOf(right.id));

    const moveLayer = (layerId: string, direction: -1 | 1) => {
        const ids = [...layerOrder];
        const index = ids.indexOf(layerId);
        const target = index + direction;
        if (index < 0 || target < 0 || target >= ids.length) return;
        [ids[index], ids[target]] = [ids[target], ids[index]];
        context.dispatch({ type: "mapLayerOrder", mapId, layerIds: ids });
    };

    return (
        <div class="hp-map-layer-panel">
            <div class="hp-map-layer-panel-header">
                <span>{layers.length.toLocaleString()} layer{layers.length === 1 ? "" : "s"}</span>
                <button type="button" class="hp-map-layer-reset" onClick={() => context.dispatch({ type: "resetMapLayers", mapId })}>Reset</button>
            </div>
            {orderedLayers.length === 0 ? (
                <div class="hp-map-panel-empty">No map layers are available.</div>
            ) : (
                <div class="hp-map-layer-list">
                    {orderedLayers.map((layer, index) => {
                        const isVisible = mapState?.visibility?.[layer.id] ?? layer.visible ?? true;
                        const opacity = Math.max(0, Math.min(1, mapState?.opacity?.[layer.id] ?? layer.opacity ?? 1));
                        const labelsOn = mapState?.labels?.[layer.id] ?? layer.labels?.enabled ?? false;
                        const hasError = Boolean(layer.error ?? layer.diagnostics.error);
                        const hasWarnings = (layer.diagnostics.warnings?.length ?? 0) > 0;
                        const loading = Boolean(layer.loading || layer.diagnostics.loading);
                        const diagnosticsOpen = expandedDiagnostics[layer.id] === true;
                        const iconName = layer.sourceType === "powerbi" ? "database" : layer.sourceType === "arcgisTile" ? "grid" : layer.sourceType === "arcgisDynamic" ? "image" : "layers";
                        return (
                            <div key={layer.id} class={`hp-map-layer-row ${isVisible ? "" : "is-hidden"}`}>
                                <div class="hp-map-layer-rowline">
                                    <button type="button" class="hp-map-layer-visibility" aria-label={isVisible ? `Hide ${layer.name}` : `Show ${layer.name}`} title={isVisible ? "Hide layer" : "Show layer"} onClick={() => context.dispatch({ type: "mapLayerVisibility", mapId, layerId: layer.id, visible: !isVisible })}>
                                        <Icon name={isVisible ? "eye" : "eye-off"} size="xs" decorative />
                                    </button>
                                    <span class="hp-map-layer-icon" title={layer.sourceType}><Icon name={iconName} size="xs" decorative /></span>
                                    <span class="hp-map-layer-name" title={layer.name}>{layer.name}</span>
                                    <span class="hp-map-layer-count" title={`${layer.features.length} features`}>{layer.features.length.toLocaleString()}</span>
                                    {loading && <span class="hp-map-layer-loading" title="Loading" aria-label={`${layer.name} is loading`} />}
                                    {(hasError || hasWarnings) && (
                                        <button
                                            type="button"
                                            class={`hp-map-layer-diagnostic-toggle ${hasError ? "is-error" : "is-warning"}`}
                                            title={hasError ? "View layer error" : "View layer warnings"}
                                            aria-label={hasError ? `${layer.name} error: ${layer.error ?? layer.diagnostics.error}` : `${layer.name} has ${layer.diagnostics.warnings.length} warnings`}
                                            aria-expanded={diagnosticsOpen}
                                            onClick={() => setExpandedDiagnostics(previous => ({ ...previous, [layer.id]: !previous[layer.id] }))}
                                        >
                                            <Icon name="alert" size="xs" decorative />
                                        </button>
                                    )}
                                    {allowOpacity && <OpacityInput mapId={mapId} layer={layer} opacity={opacity} />}
                                    {allowLabels && layer.labels && (
                                            <button type="button" class={`hp-map-layer-label-toggle ${labelsOn ? "is-active" : ""}`} aria-label={labelsOn ? `Hide labels for ${layer.name}` : `Show labels for ${layer.name}`} title={labelsOn ? "Hide labels" : "Show labels"} onClick={() => context.dispatch({ type: "mapLayerLabels", mapId, layerId: layer.id, visible: !labelsOn })}>
                                                <Icon name="text" size="xs" decorative />
                                            </button>
                                    )}
                                    {allowReorder && (
                                            <div class="hp-map-layer-reorder" aria-label={`Reorder ${layer.name}`}>
                                                <button type="button" disabled={index === 0} aria-label={`Move ${layer.name} up`} title="Move up" onClick={() => moveLayer(layer.id, -1)}><Icon name="chevron-up" size="xs" decorative /></button>
                                                <button type="button" disabled={index === orderedLayers.length - 1} aria-label={`Move ${layer.name} down`} title="Move down" onClick={() => moveLayer(layer.id, 1)}><Icon name="chevron-down" size="xs" decorative /></button>
                                            </div>
                                    )}
                                </div>
                                {diagnosticsOpen && (hasError || hasWarnings) && (
                                    <div class="hp-map-layer-diagnostics" role="status">
                                        {(layer.error ?? layer.diagnostics.error) && <p><strong>Error:</strong> {layer.error ?? layer.diagnostics.error}</p>}
                                        {hasWarnings && <p><strong>Warnings:</strong> {layer.diagnostics.warnings.join("; ")}</p>}
                                        <dl>
                                            <dt>Source</dt><dd>{layer.diagnostics.sourceType}</dd>
                                            {layer.diagnostics.sourceUrl && <><dt>URL</dt><dd class="hp-map-diagnostic-url" title={layer.diagnostics.sourceUrl}>{layer.diagnostics.sourceUrl}</dd></>}
                                            <dt>Features</dt><dd>{layer.diagnostics.featureCount}</dd>
                                            <dt>Requests</dt><dd>{layer.diagnostics.requestCount}</dd>
                                            {layer.diagnostics.objectIdField && <><dt>OID field</dt><dd>{layer.diagnostics.objectIdField}</dd></>}
                                            {layer.diagnostics.queryStrategy && <><dt>Strategy</dt><dd>{layer.diagnostics.queryStrategy}</dd></>}
                                            {layer.diagnostics.joinDiagnostics && <><dt>Join</dt><dd>{layer.diagnostics.joinDiagnostics.matchedPowerBiRowCount} Power BI rows and {layer.diagnostics.joinDiagnostics.matchedServiceFeatureCount} service features matched.</dd></>}
                                        </dl>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
