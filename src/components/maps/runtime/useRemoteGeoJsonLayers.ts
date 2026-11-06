import { useEffect, useRef, useState } from "preact/hooks";
import type { MapComponent } from "../../../schema/hyperpbiSchema";
import type { MapLayerDefinition } from "../../../schema/mapSchema";
import { loadPublicGeoJson } from "../../../maps/sources/publicGeoJson";

export interface RemoteGeoJsonState { data?: GeoJSON.GeoJsonObject; loading: boolean; error?: string; }
export function useRemoteGeoJsonLayers(definitions: MapLayerDefinition[], groups: MapComponent["layerGroups"], visibility: Readonly<Record<string, boolean>> | undefined, access: (url: string) => { allowed: boolean; reason?: string }): Record<string, RemoteGeoJsonState> {
    const [state, setState] = useState<Record<string, RemoteGeoJsonState>>({});
    const cache = useRef(new Map<string, { data: GeoJSON.GeoJsonObject; time: number }>());
    const generation = useRef(0);
    const active = definitions.filter(layer => layer.source.type === "geoJson" && layer.source.url && !layer.source.data && (visibility?.[layer.id] ?? ((layer.visible ?? true) && (groups?.find(group => group.id === layer.groupId)?.visible ?? true))));
    const revision = JSON.stringify(active.map(layer => ({ id: layer.id, source: layer.source })));
    useEffect(() => {
        const version = ++generation.current;
        const controllers = new Map<string, AbortController>();
        const timers: ReturnType<typeof setInterval>[] = [];
        const resources = new Map<string, MapLayerDefinition[]>();
        for (const layer of active) if (layer.source.type === "geoJson" && layer.source.url) resources.set(layer.source.url, [...(resources.get(layer.source.url) ?? []), layer]);
        const update = (layers: MapLayerDefinition[], patch: Partial<RemoteGeoJsonState>) => {
            if (version !== generation.current) return;
            setState(previous => { const next = { ...previous }; layers.forEach(layer => next[layer.id] = { ...previous[layer.id], ...patch, loading: patch.loading ?? previous[layer.id]?.loading ?? false }); return next; });
        };
        setState(previous => Object.fromEntries(definitions.filter(layer => layer.source.type === "geoJson").map(layer => [layer.id, { ...previous[layer.id], loading: false }])));
        const load = async (url: string, layers: MapLayerDefinition[], refresh = false) => {
            const permission = access(url);
            if (!permission.allowed) { update(layers, { loading: false, error: permission.reason ?? "Remote GeoJSON WebAccess is unavailable." }); return; }
            const cached = cache.current.get(url);
            if (!refresh && cached && Date.now() - cached.time < 60_000) { update(layers, { data: cached.data, loading: false, error: undefined }); return; }
            controllers.get(url)?.abort(); const controller = new AbortController(); controllers.set(url, controller);
            update(layers, { data: cached?.data, loading: true, error: undefined });
            try {
                const data = await loadPublicGeoJson(url, controller.signal);
                if (controller.signal.aborted || version !== generation.current) return;
                cache.current.delete(url); cache.current.set(url, { data, time: Date.now() });
                while (cache.current.size > 32) cache.current.delete(cache.current.keys().next().value!);
                update(layers, { data, loading: false, error: undefined });
            } catch (error) {
                if (!controller.signal.aborted && version === generation.current) update(layers, { loading: false, error: error instanceof Error ? error.message : String(error) });
            }
        };
        for (const [url, layers] of resources) {
            void load(url, layers);
            const intervals = layers.flatMap(layer => layer.source.type === "geoJson" && (layer.source.refreshIntervalMinutes ?? 0) >= 1 ? [layer.source.refreshIntervalMinutes!] : []);
            if (intervals.length) timers.push(setInterval(() => void load(url, layers, true), Math.min(...intervals) * 60_000));
        }
        return () => { generation.current++; controllers.forEach(controller => controller.abort()); timers.forEach(clearInterval); };
    }, [revision, access]);
    return state;
}
