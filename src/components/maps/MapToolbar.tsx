import { h, type ComponentChildren } from "preact";
import { MapComponent } from "../../schema/hyperpbiSchema";
import type { MapToolbarPopover as MapToolbarPopoverState } from "../../render/stateStore";
import { Icon } from "../icons/Icon";
import type { MapSelectionTool } from "../../maps/interactions/mapSpatialSelection";

export function mapToolbarPopoverId(mapId: string, popover: Exclude<MapToolbarPopoverState, null>): string {
    return `${mapId}-map-toolbar-${popover}-popover`;
}

export function toggleMapToolbarPopover(
    current: MapToolbarPopoverState,
    requested: Exclude<MapToolbarPopoverState, null>
): MapToolbarPopoverState {
    return current === requested ? null : requested;
}

interface MapToolbarProps {
    mapId: string;
    component: MapComponent;
    activePopover: MapToolbarPopoverState;
    layerControlEnabled: boolean;
    legendEnabled: boolean;
    searchEnabled: boolean;
    popoverContent?: ComponentChildren;
    onHome: () => void;
    onZoomIn?: () => void;
    onZoomOut?: () => void;
    onZoomToSelection: () => void;
    onSetPopover: (popover: MapToolbarPopoverState) => void;
    onClearSelection: () => void;
    activeSelectionTool?: MapSelectionTool | null;
    onSetSelectionTool?: (tool: MapSelectionTool | null) => void;
    quickFiltersEnabled?: boolean;
    selectedFeatureCount?: number;
    selectedRowCount?: number;
}

export function MapToolbar({
    mapId,
    component,
    activePopover,
    layerControlEnabled,
    legendEnabled,
    searchEnabled,
    popoverContent,
    onHome,
    onZoomIn = () => undefined,
    onZoomOut = () => undefined,
    onZoomToSelection,
    onSetPopover,
    onClearSelection,
    activeSelectionTool,
    onSetSelectionTool = () => undefined,
    quickFiltersEnabled = false,
    selectedFeatureCount = 0,
    selectedRowCount = 0,
}: MapToolbarProps) {
    const toolbar = component.toolbar ?? {};
    const actions: Array<{
        id: string;
        icon: string;
        label: string;
        show: boolean;
        action: () => void;
        popover?: Exclude<MapToolbarPopoverState, null>;
        active?: boolean;
    }> = [
        { id: "home", icon: "home", label: "Reset view", show: toolbar.home !== false, action: onHome },
        { id: "zoomIn", icon: "plus", label: "Zoom in", show: toolbar.zoomIn !== false, action: onZoomIn },
        { id: "zoomOut", icon: "minus", label: "Zoom out", show: toolbar.zoomOut !== false, action: onZoomOut },
        { id: "layers", icon: "layers", label: "Layers", show: layerControlEnabled && toolbar.layers !== false, popover: "layers", action: () => onSetPopover(toggleMapToolbarPopover(activePopover, "layers")) },
        { id: "legend", icon: "list", label: "Legend", show: legendEnabled && toolbar.legend !== false, popover: "legend", action: () => onSetPopover(toggleMapToolbarPopover(activePopover, "legend")) },
        { id: "search", icon: "search", label: "Location search", show: searchEnabled && toolbar.search !== false, popover: "search", action: () => onSetPopover(toggleMapToolbarPopover(activePopover, "search")) },
        { id: "quickFilters", icon: "filter", label: "Map quick filters", show: quickFiltersEnabled && toolbar.quickFilters !== false, popover: "quickFilters", action: () => onSetPopover(toggleMapToolbarPopover(activePopover, "quickFilters")) },
        { id: "bookmarks", icon: "bookmark", label: "View bookmarks", show: toolbar.bookmarks !== false && Boolean(component.bookmarks?.length), popover: "bookmarks", action: () => onSetPopover(toggleMapToolbarPopover(activePopover, "bookmarks")) },
        { id: "selection", icon: activeSelectionTool === "lasso" ? "lasso" : "select-rectangle", label: "Selection tools", show: toolbar.selection !== false && selectionToolsEnabled(component), popover: "selection", active: Boolean(activeSelectionTool), action: () => onSetPopover(toggleMapToolbarPopover(activePopover, "selection")) },
    ];
    const visibleActions = actions.filter(action => action.show);
    if (visibleActions.length === 0) return null;

    return (
        <div class={`hp-map-toolbar hp-map-toolbar-${toolbar.position ?? "topleft"}`} role="toolbar" aria-label="Map tools">
            {visibleActions.map(action => {
                const active = action.active === true || Boolean(action.popover && activePopover === action.popover);
                const controls = action.popover ? mapToolbarPopoverId(mapId, action.popover) : undefined;
                return (
                    <div key={action.id} class="hp-map-toolbar-item">
                        <button
                            id={`${mapId}-map-toolbar-${action.id}`}
                            type="button"
                            class={`hp-map-toolbar-btn ${active ? "is-active" : ""}`}
                            aria-label={action.label}
                            title={action.label}
                            aria-expanded={action.popover ? active : undefined}
                            aria-controls={controls}
                            aria-pressed={action.popover || action.active !== undefined ? active : undefined}
                            onClick={action.action}
                        >
                            <Icon name={action.icon} size="xs" decorative />
                        </button>
                        {active && popoverContent}
                    </div>
                );
            })}
            {toolbar.selectedCount !== false && selectedFeatureCount > 0 && (
                <output class="hp-map-selected-count" aria-label={`${selectedFeatureCount} selected map features`}>
                    {selectedFeatureCount.toLocaleString()}
                    {selectedRowCount > 0 && <small>{selectedRowCount.toLocaleString()} rows</small>}
                </output>
            )}
        </div>
    );
}

function selectionToolsEnabled(component: MapComponent): boolean {
    return [
        component.tools?.rectangleSelection,
        component.tools?.lassoSelection,
        component.tools?.circleSelection,
    ].some(mapToolEnabled) ||
        component.toolbar?.rectangleSelection === true ||
        component.toolbar?.lassoSelection === true ||
        component.toolbar?.zoomToSelection !== false ||
        component.toolbar?.clearSelection !== false;
}

function mapToolEnabled(value: boolean | { enabled?: boolean } | undefined): boolean {
    return value === true || Boolean(value && typeof value === "object" && value.enabled !== false);
}
