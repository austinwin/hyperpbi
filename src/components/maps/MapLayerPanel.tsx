import { Fragment, h } from "preact";
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
            <span>Opacity</span>
            <span class="hp-map-layer-opacity-value">
                <input
                    type="number"
                    min="0"
                    max="100"
                    step="1"
                    value={draft}
                    aria-label={`${layer.name} opacity`}
                    onInput={event => setDraft(event.currentTarget.value)}
                    onBlur={event => commit(event.currentTarget.value)}
                    onKeyDown={event => {
                        if (event.key === "Enter") {
                            event.preventDefault();
                            commit(event.currentTarget.value);
                        }
                    }}
                />
                <span aria-hidden="true">%</span>
            </span>
        </label>
    );
}

export function MapLayerPanel({ mapId, layers, groups = [], configuration, onZoomLayer }: MapLayerPanelProps) {
    const context = useRenderContext();
    const mapState = context.state.mapLayerState[mapId];
    const [expandedDiagnostics, setExpandedDiagnostics] = useState<Record<string, boolean>>({});
    const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>(() => Object.fromEntries(groups.map(group => [group.id, group.collapsed === true])));
    const [draggingLayerId, setDraggingLayerId] = useState("");
    const isLayerVisible = (layer: ResolvedMapLayer) => mapState?.visibility?.[layer.id] ?? layer.visible ?? true;
    const setVisibility = (targetLayers: ResolvedMapLayer[], visible: boolean) => {
        targetLayers.forEach(layer => context.dispatch({ type: "mapLayerVisibility", mapId, layerId: layer.id, visible }));
    };
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
    const layersByGroup = new Map<string | undefined, ResolvedMapLayer[]>();
    for (const layer of orderedLayers) {
        const siblings = layersByGroup.get(layer.groupId);
        if (siblings) siblings.push(layer);
        else layersByGroup.set(layer.groupId, [layer]);
    }

    const moveLayer = (layerId: string, targetId: string) => {
        const ids = [...layerOrder];
        const index = ids.indexOf(layerId);
        const target = ids.indexOf(targetId);
        if (index < 0 || target < 0) return;
        [ids[index], ids[target]] = [ids[target], ids[index]];
        context.dispatch({ type: "mapLayerOrder", mapId, layerIds: ids });
    };
    const dropLayer = (targetId: string) => {
        if (!draggingLayerId || draggingLayerId === targetId) return;
        const ids = [...layerOrder];
        const from = ids.indexOf(draggingLayerId);
        const to = ids.indexOf(targetId);
        if (from < 0 || to < 0) return;
        ids.splice(to, 0, ids.splice(from, 1)[0]);
        context.dispatch({ type: "mapLayerOrder", mapId, layerIds: ids });
        setDraggingLayerId("");
    };
    const draggedLayer = layers.find(layer => layer.id === draggingLayerId);

    if (orderedLayers.length === 0) return <div class="hp-map-panel-empty">No map layers are available.</div>;

    return (
        <div class="hp-map-layer-panel">
            <div class="hp-map-layer-panel-header" role="group" aria-label="All layers">
                <div class="hp-map-layer-bulk">
                    <button type="button" class="hp-map-layer-button" onClick={() => setVisibility(layers, true)}><Icon name="eye" size="xs" decorative />Show all</button>
                    <button type="button" class="hp-map-layer-button" onClick={() => setVisibility(layers, false)}><Icon name="eye-off" size="xs" decorative />Hide all</button>
                </div>
                <button type="button" class="hp-map-layer-button" title="Restore default layer settings" onClick={() => context.dispatch({ type: "resetMapLayers", mapId })}>Reset</button>
            </div>
            <div class="hp-map-layer-list">
                {orderedLayers.map((layer, index) => {
                    const group = layer.groupId ? groups.find(candidate => candidate.id === layer.groupId) : undefined;
                    const previousGroupId = index > 0 ? orderedLayers[index - 1].groupId : undefined;
                    const groupCollapsed = group ? collapsedGroups[group.id] === true : false;
                    const siblings = layersByGroup.get(layer.groupId)!;
                    const siblingIndex = siblings.indexOf(layer);
                    const groupVisible = Boolean(group && siblings.some(isLayerVisible));
                    const isVisible = isLayerVisible(layer);
                    const opacity = mapState?.opacity?.[layer.id] ?? layer.opacity ?? 1;
                    const labelsOn = mapState?.labels?.[layer.id] ?? layer.labels?.enabled ?? false;
                    const hasError = Boolean(layer.error ?? layer.diagnostics.error);
                    const hasWarnings = (layer.diagnostics.warnings?.length ?? 0) > 0;
                    const loading = Boolean(layer.loading || layer.diagnostics.loading);
                    const diagnosticsOpen = expandedDiagnostics[layer.id] === true;
                    const iconName = layer.sourceType === "powerbi" ? "database" : layer.sourceType === "arcgisTile" ? "grid" : layer.sourceType === "arcgisDynamic" ? "image" : "layers";
                    const previous = siblings[siblingIndex - 1];
                    const next = siblings[siblingIndex + 1];
                    const canZoom = layer.features.length > 0 && onZoomLayer;
                    const canDrop = allowReorder && draggedLayer && draggedLayer.id !== layer.id && draggedLayer.groupId === layer.groupId;
                    return (<Fragment key={layer.id}>
                        {group && previousGroupId !== group.id && (
                            <div class="hp-map-layer-group" data-group-id={group.id}>
                                <button type="button" class="hp-map-layer-group-name" aria-expanded={!groupCollapsed} aria-label={`${groupCollapsed ? "Expand" : "Collapse"} ${group.name}`} onClick={() => setCollapsedGroups(current => ({ ...current, [group.id]: !groupCollapsed }))}>
                                    <Icon name={groupCollapsed ? "chevron-right" : "chevron-down"} size="xs" decorative />
                                    <strong>{group.name}</strong>
                                    <span>{siblings.length}</span>
                                </button>
                                <button type="button" class="hp-map-layer-button" aria-label={`${groupVisible ? "Hide" : "Show"} group ${group.name}`} title={groupVisible ? "Hide group" : "Show group"} onClick={() => setVisibility(siblings, !groupVisible)}>
                                    <Icon name={groupVisible ? "eye" : "eye-off"} size="xs" decorative />
                                </button>
                            </div>
                        )}
                        {!groupCollapsed && <div
                            onDragOver={canDrop ? event => event.preventDefault() : undefined}
                            onDrop={canDrop ? event => { event.preventDefault(); dropLayer(layer.id); } : undefined}
                            class={`hp-map-layer-row${isVisible ? "" : " is-hidden"}${draggingLayerId === layer.id ? " is-dragging" : ""}`}
                        >
                            <div class="hp-map-layer-rowline">
                                {allowReorder && <span
                                    class="hp-map-layer-drag"
                                    draggable
                                    title="Drag to reorder within this group"
                                    aria-hidden="true"
                                    onDragStart={event => {
                                        event.dataTransfer?.setData("text/plain", layer.id);
                                        if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
                                        setDraggingLayerId(layer.id);
                                    }}
                                    onDragEnd={() => setDraggingLayerId("")}
                                >⋮⋮</span>}
                                <span class="hp-map-layer-icon" title={layer.sourceType}><Icon name={iconName} size="xs" decorative /></span>
                                <div class="hp-map-layer-identity">
                                    <span class="hp-map-layer-name" title={`${layer.name} · ${layer.provenance ? `MiniUp ${layer.provenance.mapName} v${layer.provenance.mapVersion} · ` : ""}dataset ${layer.datasetName ?? "powerbi"}`}>{layer.name}</span>
                                    {layer.provenance && <small class="hp-map-layer-source" title={layer.provenance.sourceUrl ?? "Imported published map"}>MiniUp</small>}
                                </div>
                                {loading && <span class="hp-map-layer-loading" title="Loading" aria-label={`${layer.name} is loading`} />}
                                {(hasError || hasWarnings) && (
                                    <button
                                        type="button"
                                        class={`hp-map-layer-button ${hasError ? "is-error" : "is-warning"}`}
                                        title={hasError ? "View layer error" : "View layer warnings"}
                                        aria-label={hasError ? `${layer.name} error: ${layer.error ?? layer.diagnostics.error}` : `${layer.name} has ${layer.diagnostics.warnings.length} warnings`}
                                        aria-expanded={diagnosticsOpen}
                                        onClick={() => setExpandedDiagnostics(previous => ({ ...previous, [layer.id]: !previous[layer.id] }))}
                                    >
                                        <Icon name="alert" size="xs" decorative />
                                    </button>
                                )}
                                <button type="button" class={`hp-map-layer-button${isVisible ? " is-active" : ""}`} aria-label={isVisible ? `Hide ${layer.name}` : `Show ${layer.name}`} title={isVisible ? "Hide layer" : "Show layer"} onClick={() => setVisibility([layer], !isVisible)}>
                                    <Icon name={isVisible ? "eye" : "eye-off"} size="xs" decorative />
                                </button>
                            </div>
                            {(allowOpacity || (allowLabels && layer.labels) || canZoom || allowReorder) && (
                                <div class="hp-map-layer-controls">
                                    {allowOpacity && <OpacityInput mapId={mapId} layer={layer} opacity={opacity} />}
                                    <div class="hp-map-layer-actions-row">
                                        {allowLabels && layer.labels && (
                                            <button type="button" class={`hp-map-layer-button${labelsOn ? " is-active" : ""}`} aria-label={labelsOn ? `Hide labels for ${layer.name}` : `Show labels for ${layer.name}`} title={labelsOn ? "Hide labels" : "Show labels"} onClick={() => context.dispatch({ type: "mapLayerLabels", mapId, layerId: layer.id, visible: !labelsOn })}>
                                                <Icon name="text" size="xs" decorative />
                                            </button>
                                        )}
                                        {canZoom && <button type="button" class="hp-map-layer-button" aria-label={`Zoom to ${layer.name}`} title="Zoom to layer" onClick={() => canZoom(layer.id)}><Icon name="target" size="xs" decorative /></button>}
                                        {allowReorder && (
                                            <div class="hp-map-layer-reorder" role="group" aria-label={`Reorder ${layer.name}`}>
                                                <button type="button" class="hp-map-layer-button" disabled={!previous} aria-label={`Move ${layer.name} up`} title="Move up" onClick={() => moveLayer(layer.id, previous.id)}><Icon name="chevron-up" size="xs" decorative /></button>
                                                <button type="button" class="hp-map-layer-button" disabled={!next} aria-label={`Move ${layer.name} down`} title="Move down" onClick={() => moveLayer(layer.id, next.id)}><Icon name="chevron-down" size="xs" decorative /></button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
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
                    </Fragment>);
                })}
            </div>
        </div>
    );
}

function safeServiceOrigin(value: string): string {
    try { return new URL(value).origin; } catch { return "Configured external service"; }
}
