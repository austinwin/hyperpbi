import { h } from "preact";
import { useEffect, useState } from "preact/hooks";
import type { ResolvedMapLayer } from "../../maps/model/resolvedMapTypes";
import type { MapComponent } from "../../schema/hyperpbiSchema";
import type { MapLayerGroupDefinition } from "../../schema/mapSchema";
import { useRenderContext } from "../../render/RenderContext";
import { Icon } from "../icons/Icon";

interface MapLayerPanelProps {
    mapId: string;
    layers: ResolvedMapLayer[];
    groups?: MapLayerGroupDefinition[];
    configuration?: MapComponent["layerPanel"];
    onZoomLayer?: (layerId: string) => void;
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

export function MapLayerPanel({ mapId, layers, groups = [], configuration, onZoomLayer }: MapLayerPanelProps) {
    const context = useRenderContext();
    const mapState = context.state.mapLayerState[mapId];
    const [expandedDiagnostics, setExpandedDiagnostics] = useState<Record<string, boolean>>({});
    const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(() => Object.fromEntries(groups.map(group => [group.id, group.collapsed === true])));
    const [selectedLayerId, setSelectedLayerId] = useState("");
    const [draggingLayerId, setDraggingLayerId] = useState("");
    const currentIds = new Set(layers.map(layer => layer.id));
    const storedOrder = mapState?.order ?? [];
    const layerOrder = [
        ...storedOrder.filter(layerId => currentIds.has(layerId)),
        ...layers.map(layer => layer.id).filter(layerId => !storedOrder.includes(layerId)),
    ];
    const allowReorder = configuration?.allowViewerReorder !== false;
    const allowOpacity = configuration?.allowViewerOpacity !== false;
    const allowLabels = configuration?.allowViewerLabels !== false;
    const groupRank = new Map(groups.slice().sort((left, right) => (left.order ?? 0) - (right.order ?? 0)).map((group, index) => [group.id, index] as const));
    const orderedLayers = [...layers].sort((left, right) => {
        const leftGroup = left.groupId ? groupRank.get(left.groupId) ?? groups.length : -1;
        const rightGroup = right.groupId ? groupRank.get(right.groupId) ?? groups.length : -1;
        return leftGroup - rightGroup || layerOrder.indexOf(left.id) - layerOrder.indexOf(right.id);
    });

    const moveLayer = (layerId: string, direction: -1 | 1) => {
        const ids = [...layerOrder];
        const index = ids.indexOf(layerId);
        let target = index + direction;
        const groupId = layers.find(layer => layer.id === layerId)?.groupId;
        while (target >= 0 && target < ids.length && layers.find(layer => layer.id === ids[target])?.groupId !== groupId) target += direction;
        if (index < 0 || target < 0 || target >= ids.length) return;
        [ids[index], ids[target]] = [ids[target], ids[index]];
        context.dispatch({ type: "mapLayerOrder", mapId, layerIds: ids });
    };
    const dropLayer = (targetId: string) => {
        if (!draggingLayerId || draggingLayerId === targetId) return;
        const source = layers.find(layer => layer.id === draggingLayerId), target = layers.find(layer => layer.id === targetId);
        if (source?.groupId !== target?.groupId) return;
        const ids = [...layerOrder]; const from = ids.indexOf(draggingLayerId), to = ids.indexOf(targetId);
        if (from < 0 || to < 0) return;
        ids.splice(to, 0, ids.splice(from, 1)[0]);
        context.dispatch({ type: "mapLayerOrder", mapId, layerIds: ids }); setDraggingLayerId("");
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
                        const group = layer.groupId ? groups.find(candidate => candidate.id === layer.groupId) : undefined;
                        const previousGroupId = index > 0 ? orderedLayers[index - 1].groupId : undefined;
                        const firstInGroup = Boolean(group && previousGroupId !== group.id);
                        const groupCollapsed = group ? collapsedGroups[group.id] === true : false;
                        const groupChildren = group ? layers.filter(candidate => candidate.groupId === group.id) : [];
                        const groupVisible = groupChildren.some(candidate => mapState?.visibility?.[candidate.id] ?? candidate.visible ?? true);
                        const isVisible = mapState?.visibility?.[layer.id] ?? layer.visible ?? true;
                        const opacity = Math.max(0, Math.min(1, mapState?.opacity?.[layer.id] ?? layer.opacity ?? 1));
                        const labelsOn = mapState?.labels?.[layer.id] ?? layer.labels?.enabled ?? false;
                        const hasError = Boolean(layer.error ?? layer.diagnostics.error);
                        const hasWarnings = (layer.diagnostics.warnings?.length ?? 0) > 0;
                        const loading = Boolean(layer.loading || layer.diagnostics.loading);
                        const diagnosticsOpen = expandedDiagnostics[layer.id] === true;
                        const iconName = layer.sourceType === "powerbi" ? "database" : layer.sourceType === "arcgisTile" ? "grid" : layer.sourceType === "arcgisDynamic" ? "image" : "layers";
                        return (<>
                            {firstInGroup && <div class="hp-map-layer-group" data-group-id={group!.id}><button type="button" aria-expanded={!groupCollapsed} aria-label={`${groupCollapsed ? "Expand" : "Collapse"} ${group!.name}`} onClick={() => setCollapsedGroups(current => ({ ...current, [group!.id]: !groupCollapsed }))}>{groupCollapsed ? "▸" : "▾"}</button><button type="button" class="hp-map-layer-visibility" aria-label={`${groupVisible ? "Hide" : "Show"} group ${group!.name}`} onClick={() => groupChildren.forEach(child => context.dispatch({ type: "mapLayerVisibility", mapId, layerId: child.id, visible: !groupVisible }))}><Icon name={groupVisible ? "eye" : "eye-off"} size="xs" decorative /></button><strong title={group!.name}>{group!.name}</strong><span>{groupChildren.length}</span></div>}
                            {!groupCollapsed && <div key={layer.id} draggable={allowReorder} onDragStart={() => setDraggingLayerId(layer.id)} onDragOver={event => event.preventDefault()} onDrop={() => dropLayer(layer.id)} onClick={() => setSelectedLayerId(layer.id)} class={`hp-map-layer-row ${isVisible ? "" : "is-hidden"} ${selectedLayerId === layer.id ? "is-selected" : ""}`}>
                                <div class="hp-map-layer-rowline">
                                    {allowReorder && <span class="hp-map-layer-drag" title="Drag to reorder within this group" aria-hidden="true">⋮⋮</span>}
                                    <button type="button" class="hp-map-layer-visibility" aria-label={isVisible ? `Hide ${layer.name}` : `Show ${layer.name}`} title={isVisible ? "Hide layer" : "Show layer"} onClick={() => context.dispatch({ type: "mapLayerVisibility", mapId, layerId: layer.id, visible: !isVisible })}>
                                        <Icon name={isVisible ? "eye" : "eye-off"} size="xs" decorative />
                                    </button>
                                    <span class="hp-map-layer-icon" title={layer.sourceType}><Icon name={iconName} size="xs" decorative /></span>
                                    <span class="hp-map-layer-name" title={`${layer.name} · dataset ${layer.datasetName ?? "powerbi"}`}>{layer.name}</span>
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
                                    {onZoomLayer && layer.features.length > 0 && <button type="button" class="hp-map-layer-zoom" aria-label={`Zoom to ${layer.name}`} title="Zoom to layer" onClick={event => { event.stopPropagation(); onZoomLayer(layer.id); }}><Icon name="target" size="xs" decorative /></button>}
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
                                            {layer.diagnostics.sourceUrl && <><dt>Service</dt><dd class="hp-map-diagnostic-url">{safeServiceOrigin(layer.diagnostics.sourceUrl)}</dd></>}
                                            <dt>Dataset</dt><dd>{layer.diagnostics.effectiveDataset ?? layer.datasetName ?? "powerbi"}</dd>
                                            <dt>Features</dt><dd>{layer.diagnostics.featureCount}</dd>
                                            <dt>Requests</dt><dd>{layer.diagnostics.requestCount}</dd>
                                            {layer.diagnostics.featureObjectsCreated !== undefined && <><dt>Created</dt><dd>{layer.diagnostics.featureObjectsCreated} Leaflet features</dd></>}
                                            {layer.diagnostics.featureObjectsPatched !== undefined && <><dt>Patched</dt><dd>{layer.diagnostics.featureObjectsPatched} feature styles/content</dd></>}
                                            {layer.diagnostics.fullLayerRebuilds !== undefined && <><dt>Rebuilds</dt><dd>{layer.diagnostics.fullLayerRebuilds}</dd></>}
                                            {layer.diagnostics.requestMs !== undefined && <><dt>Request</dt><dd>{layer.diagnostics.requestMs.toFixed(1)} ms</dd></>}
                                            {layer.diagnostics.joinMs !== undefined && <><dt>Join</dt><dd>{layer.diagnostics.joinMs.toFixed(1)} ms</dd></>}
                                            {layer.diagnostics.rendererCalculationMs !== undefined && <><dt>Renderer</dt><dd>{layer.diagnostics.rendererCalculationMs.toFixed(1)} ms</dd></>}
                                            {layer.diagnostics.layerRenderMs !== undefined && <><dt>Map render</dt><dd>{layer.diagnostics.layerRenderMs.toFixed(1)} ms</dd></>}
                                            {layer.diagnostics.objectIdField && <><dt>OID field</dt><dd>{layer.diagnostics.objectIdField}</dd></>}
                                            {layer.diagnostics.queryStrategy && <><dt>Strategy</dt><dd>{layer.diagnostics.queryStrategy}</dd></>}
                                            {layer.diagnostics.joinDiagnostics && <><dt>Join</dt><dd>{layer.diagnostics.joinDiagnostics.matchedPowerBiRowCount} Power BI rows and {layer.diagnostics.joinDiagnostics.matchedServiceFeatureCount} service features matched.</dd></>}
                                        </dl>
                                    </div>
                                )}
                            </div>}
                        </>);
                    })}
                </div>
            )}
        </div>
    );
}

function safeServiceOrigin(value: string): string {
    try { return new URL(value).origin; } catch { return "Configured external service"; }
}
