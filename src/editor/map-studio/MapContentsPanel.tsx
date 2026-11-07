import { useEffect, useRef, useState } from "preact/hooks";
import type { MapComponent } from "../../schema/hyperpbiSchema";
import type { MapLayerDefinition } from "../../schema/mapSchema";
import type { MapLayerStatuses } from "../../maps/interactions/mapStudioCommands";
import { MAP_ORIGIN_GROUPS, mapLayerOrigin } from "../../maps/model/mapLayerOrigin";
import { StudioCheckbox } from "../ui/StudioCheckbox";
import { Icon } from "../../components/icons/Icon";
import { DraftInput } from "./MapDraftInput";
import { MapLayerSymbol } from "./MapLayerSymbol";
import { MapStudioPopover } from "./MapStudioPopover";

type Mutate = (fn: (map: MapComponent) => void) => boolean;
const ordered = <T extends { order?: number }>(items: T[]) => [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
const sourceLabel = (layer: MapLayerDefinition) => layer.provenance?.provider === "published" ? "Published" : ({ powerbi: "Power BI", geoJson: "GeoJSON", arcgisFeature: "ArcGIS features", arcgisDynamic: "ArcGIS map", arcgisTile: "ArcGIS tiles", xyz: layer.source.type === "xyz" && layer.source.wms ? "WMS" : "XYZ tiles" })[layer.source.type];

export function MapContentsPanel({ map, activeId, onOpen, onBasemap, onAdd, onFit, statuses, issues, mutate }: {
  map: MapComponent; activeId: string; onOpen: (id: string, section?: "source" | "renderer" | "popup") => void;
  onBasemap: () => void; onAdd: () => void; onFit?: (id: string) => void;
  statuses: MapLayerStatuses; issues: Record<string, { errors: number; warnings: number }>; mutate: Mutate;
}) {
  const [search, setSearch] = useState(""), [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<string[]>([]), [selecting, setSelecting] = useState(false);
  const [menu, setMenu] = useState(""), [dragging, setDragging] = useState("");
  const anchor = useRef<HTMLButtonElement>(null), lastSelected = useRef("");
  const layers = ordered(map.layers ?? []), groups = ordered(map.layerGroups ?? []);
  useEffect(() => { setSelected([]); setSearch(""); setFilter("all"); setMenu(""); }, [map.id]);
  useEffect(() => { setSelected(current => current.filter(id => layers.some(layer => layer.id === id))); }, [map.layers]);
  const matches = (layer: MapLayerDefinition) => {
    const status = statuses[layer.id], issue = issues[layer.id];
    const visible = layer.visible !== false && groups.find(group => group.id === layer.groupId)?.visible !== false;
    return `${layer.name} ${sourceLabel(layer)} ${groups.find(group => group.id === layer.groupId)?.name ?? ""}`.toLowerCase().includes(search.trim().toLowerCase()) &&
      (filter === "all" || filter === "visible" && visible || filter === "hidden" && !visible || filter === "issues" && (status?.error || status?.warnings.length || issue?.errors || issue?.warnings) || filter === layer.source.type || filter === "published" && layer.provenance?.provider === "published");
  };
  const filtered = layers.filter(matches);
  const select = (id: string, range = false) => {
    const start = filtered.findIndex(layer => layer.id === lastSelected.current), end = filtered.findIndex(layer => layer.id === id);
    setSelected(current => range && start >= 0 ? [...new Set([...current, ...filtered.slice(Math.min(start, end), Math.max(start, end) + 1).map(layer => layer.id)])] : current.includes(id) ? current.filter(value => value !== id) : [...current, id]);
    lastSelected.current = id;
  };
  const reorder = (id: string, targetId: string, groupId?: string) => mutate(candidate => {
    const list = ordered(candidate.layers ?? []), from = list.findIndex(layer => layer.id === id);
    if (from < 0 || id === targetId) return;
    const [layer] = list.splice(from, 1);
    const target = list.findIndex(item => item.id === targetId);
    layer.groupId = groupId;
    list.splice(target < 0 ? list.length : target, 0, layer);
    list.forEach((item, index) => item.order = index); candidate.layers = list;
  });
  const siblings = (layer: MapLayerDefinition) => layers.filter(item => item.groupId === layer.groupId && (layer.groupId || mapLayerOrigin(item) === mapLayerOrigin(layer)));
  const move = (layer: MapLayerDefinition, direction: number) => {
    const list = siblings(layer), index = list.findIndex(item => item.id === layer.id), other = list[index + direction];
    if (!other) return;
    mutate(candidate => {
      const all = ordered(candidate.layers ?? []), a = all.findIndex(item => item.id === layer.id), b = all.findIndex(item => item.id === other.id);
      [all[a], all[b]] = [all[b], all[a]]; all.forEach((item, order) => item.order = order); candidate.layers = all;
    });
  };
  const bulkVisibility = (visible: boolean) => mutate(candidate => {
    candidate.layers?.forEach(layer => { if (selected.includes(layer.id)) layer.visible = visible; });
    if (visible) candidate.layerGroups?.forEach(group => { if (candidate.layers?.some(layer => selected.includes(layer.id) && layer.groupId === group.id)) group.visible = true; });
  });
  const menuLayer = layers.find(layer => layer.id === menu);
  const menuGroup = groups.find(group => `group:${group.id}` === menu);
  const close = () => { setMenu(""); anchor.current?.focus(); };
  const row = (layer: MapLayerDefinition) => {
    const status = statuses[layer.id], issue = issues[layer.id];
    const error = status?.error || (issue?.errors ? `${issue.errors} validation errors` : "");
    const warning = [...status?.warnings ?? [], ...(issue?.warnings ? [`${issue.warnings} validation warnings`] : [])].join("\n");
    const state = status?.loading ? "loading" : error ? "error" : warning ? "warning" : status ? "ready" : "unknown";
    return <div key={layer.id} data-layer-id={layer.id} class={`hp-map-studio-layer hp-map-contents-row ${selected.includes(layer.id) || activeId === layer.id ? "is-selected" : ""}`} draggable
      onDragStart={event => { setDragging(layer.id); event.dataTransfer?.setData("text/plain", layer.id); if (event.dataTransfer) event.dataTransfer.effectAllowed = "move"; }} onDragEnd={() => setDragging("")}
      onDragOver={event => { if (dragging) event.preventDefault(); }} onDrop={event => { event.preventDefault(); event.stopPropagation(); if (dragging) reorder(dragging, layer.id, layer.groupId); setDragging(""); }}>
      {selecting ? <input type="checkbox" aria-label={`Select ${layer.name} for bulk actions`} checked={selected.includes(layer.id)} onChange={() => select(layer.id)} /> : <span class="hp-map-layer-drag" title="Drag to reorder" aria-hidden="true">⋮⋮</span>}
      <StudioCheckbox className="hp-map-layer-visibility" label={<span class="hp-visually-hidden">Show {layer.name}</span>} checked={layer.visible !== false} onChange={visible => mutate(candidate => { const found = candidate.layers?.find(item => item.id === layer.id); if (found) found.visible = visible; })} />
      <MapLayerSymbol layer={layer} geometryTypes={status?.geometryTypes} />
      <button type="button" class="hp-map-layer-name" aria-label={`Select layer ${layer.name}`} aria-pressed={activeId === layer.id} title="Open properties. Ctrl/Cmd-click or Shift-click for bulk selection. Alt+arrows to reorder."
        onClick={event => { if (selecting || event.ctrlKey || event.metaKey || event.shiftKey) select(layer.id, event.shiftKey); else onOpen(layer.id); }}
        onKeyDown={event => { if (event.altKey && ["ArrowUp", "ArrowDown"].includes(event.key)) { event.preventDefault(); move(layer, event.key === "ArrowUp" ? -1 : 1); } }}>
        <strong>{layer.name}</strong><small><span class="hp-map-source-badge">{sourceLabel(layer)}</span>{layer.join?.enabled ? " · Joined" : ""}{status && !["arcgisTile", "arcgisDynamic", "xyz"].includes(layer.source.type) ? ` · ${status.featureCount.toLocaleString()} feature${status.featureCount === 1 ? "" : "s"}` : !status ? " · Not previewed" : ""}</small>
      </button>
      <span class={`hp-map-layer-status is-${state}`} role="img" aria-label={`${layer.name}: ${state === "unknown" ? "Not previewed" : state}`} title={status?.loading ? "Loading source" : error || warning || (status ? "Ready" : "Runtime status is available after preview")}><Icon name={state === "error" || state === "warning" ? "alert" : state === "ready" ? "check" : "info"} size="xs" decorative /></span>
      <button type="button" class="hp-map-layer-menu-button" aria-label={`Actions for ${layer.name}`} aria-haspopup="dialog" aria-expanded={menu === layer.id} onClick={event => { anchor.current = event.currentTarget; setMenu(menu === layer.id ? "" : layer.id); }}><Icon name="dots" size="xs" decorative /></button>
    </div>;
  };
  return <div class="hp-map-contents">
    <div class="hp-map-contents-filter"><label class="hp-map-layer-search"><Icon name="search" size="xs" decorative /><input type="search" aria-label="Search layers" placeholder="Find layers or sources" value={search} onInput={event => setSearch(event.currentTarget.value)} /></label>
      <div><select aria-label="Filter layers" value={filter} onChange={event => setFilter(event.currentTarget.value)}><option value="all">All layers</option><option value="visible">Visible</option><option value="hidden">Hidden</option><option value="issues">With issues</option><option value="powerbi">Power BI</option><option value="arcgisFeature">ArcGIS features</option><option value="arcgisDynamic">ArcGIS map services</option><option value="arcgisTile">ArcGIS tiles</option><option value="geoJson">GeoJSON</option><option value="xyz">XYZ / WMS</option><option value="published">Published</option></select><button type="button" aria-pressed={selecting} onClick={() => { setSelecting(!selecting); if (selecting) setSelected([]); }}>Select layers</button></div>
      <div class="hp-map-contents-summary"><span aria-live="polite">{filtered.length === layers.length ? `${layers.length} layer${layers.length === 1 ? "" : "s"}` : `${filtered.length} of ${layers.length} layers`}</span><button type="button" onClick={onAdd}><Icon name="plus" size="xs" decorative /> Add</button></div>
      {(selecting || selected.length > 0) && <div class="hp-map-contents-bulk"><button type="button" onClick={() => setSelected(filtered.every(layer => selected.includes(layer.id)) ? [] : filtered.map(layer => layer.id))}>{filtered.length > 0 && filtered.every(layer => selected.includes(layer.id)) ? "Deselect all" : "Select all"}</button><span>{selected.length} selected</span><button type="button" disabled={!selected.length} onClick={() => bulkVisibility(true)}>Show selected</button><button type="button" disabled={!selected.length} onClick={() => bulkVisibility(false)}>Hide selected</button><label><span class="hp-visually-hidden">Move selected to group</span><select aria-label="Move selected to group" disabled={!selected.length} value="" onChange={event => { const groupId = event.currentTarget.value; mutate(candidate => candidate.layers?.forEach(layer => { if (selected.includes(layer.id)) layer.groupId = groupId === "__none__" ? undefined : groupId; })); }}><option value="" disabled>Move to group…</option><option value="__none__">Ungrouped</option>{groups.map(group => <option value={group.id}>{group.name}</option>)}</select></label></div>}
    </div>
    <div class="hp-map-contents-list" aria-label="Map layers">
      {groups.map(group => {
        const children = filtered.filter(layer => layer.groupId === group.id);
        if (!children.length && (search || filter !== "all")) return null;
        return <section key={group.id} class="hp-map-contents-group" data-group-id={group.id} onDragOver={event => { if (dragging) event.preventDefault(); }} onDrop={event => { event.preventDefault(); if (dragging) reorder(dragging, "", group.id); setDragging(""); }}><header>
          <button type="button" aria-label={`${group.collapsed ? "Expand" : "Collapse"} ${group.name}`} aria-expanded={!group.collapsed || !!search.trim() || filter !== "all"} onClick={() => mutate(candidate => { const found = candidate.layerGroups?.find(item => item.id === group.id); if (found) found.collapsed = !found.collapsed; })}><Icon name={group.collapsed && !search.trim() && filter === "all" ? "chevron-right" : "chevron-down"} size="xs" decorative /></button>
          <input type="checkbox" aria-label={`Show group ${group.name}`} checked={group.visible !== false} onChange={event => { const visible = event.currentTarget.checked; mutate(candidate => { const found = candidate.layerGroups?.find(item => item.id === group.id); if (found) found.visible = visible; }); }} />
          <strong title={group.name}>{group.name}</strong><small>{children.length}</small><button type="button" aria-label={`Actions for group ${group.name}`} aria-haspopup="dialog" aria-expanded={menu === `group:${group.id}`} onClick={event => { anchor.current = event.currentTarget; setMenu(`group:${group.id}`); }}><Icon name="dots" size="xs" decorative /></button>
        </header>{(!group.collapsed || !!search.trim() || filter !== "all") && children.map(row)}</section>;
      })}
      {MAP_ORIGIN_GROUPS.map(origin => { const children = filtered.filter(layer => (!layer.groupId || !groups.some(group => group.id === layer.groupId)) && mapLayerOrigin(layer) === origin); return children.length ? <section key={origin} class="hp-map-origin-group"><h4>{origin}</h4>{children.map(row)}</section> : null; })}
      {!filtered.length && <p class="hp-map-contents-empty">{layers.length ? "No layers match. Try another search or filter." : "Add a source to start building your map."}</p>}
    </div>
    <button type="button" class="hp-map-contents-basemap" onClick={onBasemap}><Icon name="map" size="xs" decorative /> Basemap & view</button>
    {(menuLayer || menuGroup) && <MapStudioPopover key={menu} anchor={anchor} title={`Actions for ${menuLayer?.name ?? menuGroup?.name}`} onClose={() => setMenu("")}>
      {menuLayer && <>
        <DraftInput label="Layer name" value={menuLayer.name} onCommit={name => mutate(candidate => { const found = candidate.layers?.find(layer => layer.id === menuLayer.id); if (found) found.name = name; })} />
        <button type="button" onClick={() => { onOpen(menuLayer.id); close(); }}>Layer settings</button>
        <button type="button" disabled={!onFit || !statuses[menuLayer.id]?.canFit} title={statuses[menuLayer.id]?.canFit ? "Zoom to available geometry" : "Available after feature geometry loads"} onClick={() => { onFit?.(menuLayer.id); close(); }}>Fit to this layer</button>
        <label><span>Layer group</span><select aria-label="Move layer to group" value={menuLayer.groupId ?? ""} onChange={event => { const groupId = event.currentTarget.value || undefined; mutate(candidate => { const found = candidate.layers?.find(layer => layer.id === menuLayer.id); if (found) found.groupId = groupId; }); close(); }}><option value="">Ungrouped</option>{groups.map(group => <option value={group.id}>{group.name}</option>)}</select></label>
        <button type="button" disabled={siblings(menuLayer)[0]?.id === menuLayer.id} aria-label={`Move ${menuLayer.name} up`} onClick={() => { move(menuLayer, -1); close(); }}>Move up <kbd>Alt ↑</kbd></button>
        <button type="button" disabled={siblings(menuLayer).at(-1)?.id === menuLayer.id} aria-label={`Move ${menuLayer.name} down`} onClick={() => { move(menuLayer, 1); close(); }}>Move down <kbd>Alt ↓</kbd></button>
        <button type="button" onClick={() => { mutate(candidate => { const ids = new Set(candidate.layers?.map(layer => layer.id)); let id = `${menuLayer.id}-copy`, i = 2; while (ids.has(id)) id = `${menuLayer.id}-copy-${i++}`; const list = ordered(candidate.layers ?? []); list.splice(list.findIndex(layer => layer.id === menuLayer.id) + 1, 0, { ...JSON.parse(JSON.stringify(menuLayer)), id, name: `${menuLayer.name} copy`, provenance: undefined }); list.forEach((layer, order) => layer.order = order); candidate.layers = list; }); close(); }}>Duplicate this layer</button>
        <button type="button" class="is-danger" onClick={() => { mutate(candidate => { candidate.layers = candidate.layers?.filter(layer => layer.id !== menuLayer.id); }); close(); }}>Delete this layer</button>
      </>}
      {menuGroup && <>
        <DraftInput label="Group name" value={menuGroup.name} onCommit={name => mutate(candidate => { const found = candidate.layerGroups?.find(group => group.id === menuGroup.id); if (found) found.name = name; })} />
        <label><span>Group opacity</span><input aria-label="Group opacity" type="range" min="0" max="1" step=".05" value={menuGroup.opacity ?? 1} onChange={event => { const opacity = Number(event.currentTarget.value); mutate(candidate => { const found = candidate.layerGroups?.find(group => group.id === menuGroup.id); if (found) found.opacity = opacity; }); }} /></label>
        {[-1, 1].map(direction => <button type="button" disabled={!groups[groups.indexOf(menuGroup) + direction]} onClick={() => { mutate(candidate => { const list = ordered(candidate.layerGroups ?? []), index = list.findIndex(group => group.id === menuGroup.id); [list[index], list[index + direction]] = [list[index + direction], list[index]]; list.forEach((group, order) => group.order = order); candidate.layerGroups = list; }); close(); }}>Move group {direction < 0 ? "up" : "down"}</button>)}
        <button type="button" class="is-danger" onClick={() => { mutate(candidate => { candidate.layerGroups = candidate.layerGroups?.filter(group => group.id !== menuGroup.id); candidate.layers?.forEach(layer => { if (layer.groupId === menuGroup.id) layer.groupId = undefined; }); }); close(); }}>Delete group · keep layers</button>
      </>}
    </MapStudioPopover>}
  </div>;
}
