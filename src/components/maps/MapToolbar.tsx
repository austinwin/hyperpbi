// ── Map Toolbar ──────────────────────────────────────────────────────
// Compact floating toolbar for map actions.

import { h } from "preact";
import { MapComponent } from "../../schema/hyperpbiSchema";
import { useRenderContext } from "../../render/RenderContext";
import { Icon } from "../icons/Icon";

export function MapToolbar({ component, mapId }: { component: MapComponent; mapId: string }) {
    const context = useRenderContext();
    const toolbar = component.toolbar ?? {};

    const actions: Array<{ id: string; icon: string; label: string; show: boolean; action: () => void }> = [
        {
            id: "home",
            icon: "home",
            label: "Reset view",
            show: toolbar.home !== false,
            action: () => {
                // Home action handled by LeafletMap
            },
        },
        {
            id: "layers",
            icon: "layers",
            label: "Toggle layers",
            show: toolbar.layers !== false,
            action: () => {
                context.executeUiAction({ type: "toggleState", target: `${mapId}_layer_panel` });
            },
        },
        {
            id: "legend",
            icon: "list",
            label: "Toggle legend",
            show: toolbar.legend !== false,
            action: () => {
                context.executeUiAction({ type: "toggleState", target: `${mapId}_legend` });
            },
        },
        {
            id: "clearSelection",
            icon: "close",
            label: "Clear selection",
            show: toolbar.clearSelection !== false,
            action: () => {
                context.dispatch({ type: "resetInteractions" });
            },
        },
        {
            id: "zoomToSelection",
            icon: "search",
            label: "Zoom to selection",
            show: toolbar.zoomToSelection !== false,
            action: () => {
                // Zoom handled by LeafletMap
            },
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
