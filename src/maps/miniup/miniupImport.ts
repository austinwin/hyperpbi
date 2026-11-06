import type { MapComponent } from "../../schema/hyperpbiSchema";
import type { MapLayerDefinition } from "../../schema/mapSchema";
import type { MiniUpMapImport, MiniUpMapManifest } from "./miniupTypes";

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const equal = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);
/** Keep explicitly changed/deleted local properties; accept upstream changes elsewhere. */
export function mergeMapOverrides<T>(baseline: T, local: T, upstream: T): T {
    if (equal(local, baseline)) return upstream;
    if (baseline && local && upstream && typeof baseline === "object" && typeof local === "object" && typeof upstream === "object" && !Array.isArray(baseline) && !Array.isArray(local) && !Array.isArray(upstream)) {
        const result: Record<string, unknown> = {};
        for (const key of new Set([...Object.keys(baseline), ...Object.keys(local), ...Object.keys(upstream)])) {
            const value = mergeMapOverrides((baseline as Record<string, unknown>)[key], (local as Record<string, unknown>)[key], (upstream as Record<string, unknown>)[key]);
            if (value !== undefined) result[key] = value;
        }
        return result as T;
    }
    return local;
}

export function importMiniUpMap(current: MapComponent, manifest: MiniUpMapManifest, options: { mode: "snapshot" | "linked"; manifestUrl?: string; refreshId?: string; now?: string }): { map: MapComponent; warnings: string[] } {
    if (options.mode === "linked" && !options.manifestUrl) throw new Error("Linked imports require a published manifest URL.");
    const map = clone(current), warnings: string[] = [];
    const previous = map.imports?.find(item => item.id === options.refreshId);
    if (options.refreshId && (!previous || previous.mode !== "linked")) throw new Error("Only an existing linked map can be refreshed.");
    if (previous && previous.mapId !== manifest.id) throw new Error("The published map id changed. Import it as a new source to protect existing layers.");
    let importId = previous?.id ?? `miniup-${manifest.id}`;
    let suffix = 2;
    const usedIds = new Set([...(map.imports ?? []).map(item => item.id), ...(map.layers ?? []).map(item => item.id), ...(map.layerGroups ?? []).map(item => item.id)]);
    while (!previous && (usedIds.has(importId) || manifest.layers.some(layer => usedIds.has(`${importId}-${layer.id}`)))) importId = `miniup-${manifest.id}-${suffix++}`;
    const scoped = (id: string) => `${importId}-${id}`;
    const layers: MapLayerDefinition[] = manifest.layers.map(({ fields, geometryType, ...layer }, index) => ({ ...clone(layer), id: scoped(layer.id), groupId: layer.groupId ? scoped(layer.groupId) : undefined, order: (previous?.baseline.layers?.[index]?.order ?? (map.layers?.length ?? 0) + index), provenance: { provider: "miniup", importId, mapId: manifest.id, mapName: manifest.name, mapVersion: manifest.version, layerId: layer.id, sourceUrl: manifest.sourceUrl ?? options.manifestUrl, fields, geometryType } }));
    const baseline: MiniUpMapImport["baseline"] = {
        layers,
        layerGroups: manifest.layerGroups?.map(group => ({ ...clone(group), id: scoped(group.id) })),
        bookmarks: manifest.bookmarks?.map(bookmark => ({ ...clone(bookmark), id: scoped(bookmark.id) })),
        view: manifest.view ?? (manifest.extent ? extentView(manifest.extent) : undefined), basemap: manifest.basemap, legend: manifest.legend,
    };
    if (previous) {
        const owned = (map.layers ?? []).filter(layer => layer.provenance?.importId === importId);
        const old = new Map(previous.baseline.layers?.map(layer => [layer.id, layer]));
        const local = new Map(owned.map(layer => [layer.id, layer]));
        const refreshed = layers.flatMap(layer => {
            const before = old.get(layer.id), edited = local.get(layer.id);
            if (before && !edited) return []; // Local deletion is an override.
            return [before && edited ? { ...mergeMapOverrides(before, edited, layer), provenance: layer.provenance } : layer];
        });
        for (const layer of owned) if (!layers.some(item => item.id === layer.id) && !equal(layer, old.get(layer.id))) { refreshed.push(layer); warnings.push(`${layer.name}: removed upstream; retained because it has local changes.`); }
        map.layers = [...(map.layers ?? []).filter(layer => layer.provenance?.importId !== importId), ...refreshed];
        for (const key of ["view", "basemap", "legend"] as const) Object.assign(map, { [key]: mergeMapOverrides(previous.baseline[key], map[key], baseline[key]) });
        map.layerGroups = mergeOwned(previous.baseline.layerGroups ?? [], map.layerGroups ?? [], baseline.layerGroups ?? []);
        map.bookmarks = mergeOwned(previous.baseline.bookmarks ?? [], map.bookmarks ?? [], baseline.bookmarks ?? []);
    } else {
        map.layers = [...(map.layers ?? []), ...layers];
        map.layerGroups = [...(map.layerGroups ?? []), ...(baseline.layerGroups ?? [])];
        map.bookmarks = [...(map.bookmarks ?? []), ...(baseline.bookmarks ?? [])];
        for (const key of ["view", "basemap", "legend"] as const) if (baseline[key] !== undefined) Object.assign(map, { [key]: baseline[key] });
        if (manifest.interactions) map.tools = { ...map.tools, rectangleSelection: manifest.interactions.rectangle ?? map.tools?.rectangleSelection, lassoSelection: manifest.interactions.lasso ?? map.tools?.lassoSelection };
    }
    map.layerPanel = { ...map.layerPanel, visible: true };
    const reference: MiniUpMapImport = { id: importId, mapId: manifest.id, name: manifest.name, version: manifest.version, mode: options.mode, manifestUrl: options.manifestUrl, sourceUrl: manifest.sourceUrl, importedAt: options.now ?? new Date().toISOString(), refresh: manifest.refresh, baseline: clone(baseline) };
    map.imports = [...(map.imports ?? []).filter(item => item.id !== importId), reference];
    return { map, warnings };
}
function mergeOwned<T extends { id: string }>(before: T[], local: T[], upstream: T[]): T[] {
    const old = new Map(before.map(item => [item.id, item])), edited = new Map(local.map(item => [item.id, item]));
    return [...local.filter(item => !old.has(item.id)), ...upstream.flatMap(item => old.has(item.id) && !edited.has(item.id) ? [] : [old.has(item.id) && edited.has(item.id) ? mergeMapOverrides(old.get(item.id)!, edited.get(item.id)!, item) : item])];
}
function extentView([west, south, east, north]: [number, number, number, number]): NonNullable<MapComponent["view"]> {
    return { center: [(south + north) / 2, (west + east) / 2], zoom: Math.max(0, Math.min(18, Math.floor(Math.log2(360 / Math.max(east - west, north - south, 0.001))))), fitMode: "none" };
}
