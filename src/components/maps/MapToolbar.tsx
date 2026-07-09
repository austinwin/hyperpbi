// ── Map Toolbar ──────────────────────────────────────────────────────
// Compact floating toolbar for map actions. Receives explicit callbacks.

import { h } from "preact";
import { MapComponent } from "../../schema/hyperpbiSchema";
import { Icon } from "../icons/Icon";

interface MapToolbarProps {
    component: MapComponent;
    mapId: string;
    onHome: () => void;
    onZoomToSelection: () => void;
    onToggleLayers: () => void;
    onToggleLegend: () => void;
    onClearSelection: () => void;
}

export function MapToolbar({
    component,
    mapId,
    onHome,
    onZoomToSelection,
    onToggleLayers,
    onToggleLegend,
    onClearSelection,
}: MapToolbarProps) {
    const toolbar = component.toolbar ?? {};

    const actions: Array<{ id: string; icon: string; label: string; show: boolean; action: () => void }> = [
        {
            id: "home",
            icon: "home",
            label: "Reset view",
            show: toolbar.home !== false,
            action: onHome,
        },
        {
            id: "layers",
            icon: "layers",
            label: "Toggle layers",
            show: toolbar.layers !== false,
            action: onToggleLayers,
        },
        {
            id: "legend",
            icon: "list",
            label: "Toggle legend",
            show: toolbar.legend !== false,
            action: onToggleLegend,
        },
        {
            id: "clearSelection",
            icon: "close",
            label: "Clear selection",
            show: toolbar.clearSelection !== false,
            action: onClearSelection,
        },
        {
            id: "zoomToSelection",
            icon: "search",
            label: "Zoom to selection",
            show: toolbar.zoomToSelection !== false,
            action: onZoomToSelection,
        },
    ];

    const visibleActions = actions.filter(a => a.show);
    if (visibleActions.length === 0) return null;

    return (
        <div class="hp-map-toolbar">
            {visibleActions.map(action => (
                <button
                    key={action.id}
                    type="button"
                    class="hp-map-toolbar-btn"
                    aria-label={action.label}
                    title={action.label}
                    onClick={action.action}
                >
                    <Icon name={action.icon} size="xs" decorative />
                </button>
            ))}
        </div>
    );
}
