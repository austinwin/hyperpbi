import { useState } from "preact/hooks";
import { Icon } from "../../components/icons/Icon";
import type { IconName } from "../../schema/uiSchema";
import type { MapStudioCommand } from "../../maps/interactions/mapStudioCommands";

export type MapStudioDrawer = "layers" | "properties" | "sources" | null;
export function MapStudioRail({ drawer, onDrawer, onBasemap, onCommand, onPreview, onUndo, onRedo, canUndo, canRedo }: {
    drawer: MapStudioDrawer; onDrawer: (drawer: MapStudioDrawer) => void; onBasemap: () => void;
    onCommand: (command: MapStudioCommand) => void; onPreview?: () => void;
    onUndo: () => void; onRedo: () => void; canUndo: boolean; canRedo: boolean;
}) {
    const [collapsed, setCollapsed] = useState(false);
    const button = (label: string, icon: IconName, action: () => void, active = false, disabled = false) => <button type="button" title={label} aria-label={label} aria-pressed={active} disabled={disabled} onClick={action}><Icon name={icon} size="sm" decorative /></button>;
    return <nav class="hp-map-studio-rail" aria-label="Map authoring tools">
        {button(collapsed ? "Expand map tools" : "Collapse map tools", "menu", () => { setCollapsed(!collapsed); if (!collapsed) onDrawer(null); })}
        {!collapsed && <>
            {button("Layers", "layers", () => onDrawer(drawer === "layers" ? null : "layers"), drawer === "layers")}
            {button("Add source", "plus", () => onDrawer(drawer === "sources" ? null : "sources"), drawer === "sources")}
            {button("Layer properties", "settings", () => onDrawer(drawer === "properties" ? null : "properties"), drawer === "properties")}
            {button("Basemap", "map", onBasemap)}
            {button("Search", "search", () => { onDrawer(null); onCommand("search"); })}
            {button("Select features", "select-rectangle", () => { onDrawer(null); onCommand("selection"); })}
            {button("Fit to extent", "target", () => onCommand("fit"))}
            {button("Bookmarks", "bookmark", () => { onDrawer(null); onCommand("bookmarks"); })}
            {button("Legend", "list", () => { onDrawer(null); onCommand("legend"); })}
            {button("Reset selection", "refresh", () => onCommand("clear"))}
            {button("Undo", "chevron-left", onUndo, false, !canUndo)}
            {button("Redo", "chevron-right", onRedo, false, !canRedo)}
            {onPreview && button("Preview", "eye", onPreview)}
        </>}
    </nav>;
}
