import { h, type ComponentChildren } from "preact";
import { MapComponent } from "../../schema/hyperpbiSchema";
import type { MapToolbarPopover as MapToolbarPopoverState } from "../../render/stateStore";
import { Icon } from "../icons/Icon";

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
    onZoomToSelection: () => void;
    onSetPopover: (popover: MapToolbarPopoverState) => void;
    onClearSelection: () => void;
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
    onZoomToSelection,
    onSetPopover,
    onClearSelection,
}: MapToolbarProps) {
    const toolbar = component.toolbar ?? {};
    const actions: Array<{
        id: string;
        icon: string;
        label: string;
        show: boolean;
        action: () => void;
        popover?: Exclude<MapToolbarPopoverState, null>;
    }> = [
        { id: "home", icon: "home", label: "Reset view", show: toolbar.home !== false, action: onHome },
        { id: "layers", icon: "layers", label: "Layers", show: layerControlEnabled && toolbar.layers !== false, popover: "layers", action: () => onSetPopover(toggleMapToolbarPopover(activePopover, "layers")) },
        { id: "legend", icon: "list", label: "Legend", show: legendEnabled && toolbar.legend !== false, popover: "legend", action: () => onSetPopover(toggleMapToolbarPopover(activePopover, "legend")) },
        { id: "search", icon: "search", label: "Location search", show: searchEnabled && toolbar.search !== false, popover: "search", action: () => onSetPopover(toggleMapToolbarPopover(activePopover, "search")) },
        { id: "zoomToSelection", icon: "target", label: "Zoom to selected features", show: toolbar.zoomToSelection !== false, action: onZoomToSelection },
        { id: "clearSelection", icon: "close", label: "Clear selection", show: toolbar.clearSelection !== false, action: onClearSelection },
    ];
    const visibleActions = actions.filter(action => action.show);
    if (visibleActions.length === 0) return null;

    return (
        <div class="hp-map-toolbar" role="toolbar" aria-label="Map tools">
            {visibleActions.map(action => {
                const active = Boolean(action.popover && activePopover === action.popover);
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
                            aria-pressed={action.popover ? active : undefined}
                            onClick={action.action}
                        >
                            <Icon name={action.icon} size="xs" decorative />
                        </button>
                        {active && popoverContent}
                    </div>
                );
            })}
        </div>
    );
}
