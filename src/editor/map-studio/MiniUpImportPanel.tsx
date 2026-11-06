import { useEffect, useRef, useState } from "preact/hooks";
import type { MapComponent } from "../../schema/hyperpbiSchema";
import type { ProviderAccessState } from "../../providers/providerTypes";
import type { MiniUpMapManifest, PublishedMiniUpMap } from "../../maps/miniup/miniupTypes";
import { loadMiniUpManifest } from "../../maps/miniup/miniupSourceAdapter";
import { parseMiniUpManifest, publicMapUrl } from "../../maps/miniup/miniupManifest";
import { importMiniUpMap } from "../../maps/miniup/miniupImport";

export function MiniUpImportPanel({ map, publishedMaps = [], providerAccess, webAccessAvailable, onApply, onClose }: {
    map: MapComponent; publishedMaps?: PublishedMiniUpMap[]; providerAccess?: ProviderAccessState; webAccessAvailable: boolean;
    onApply: (map: MapComponent, warnings: string[]) => boolean; onClose: () => void;
}) {
    const [url, setUrl] = useState("");
    const [mode, setMode] = useState<"snapshot" | "linked">("snapshot");
    const [preview, setPreview] = useState<{ manifest: MiniUpMapManifest; warnings: string[]; url?: string; refreshId?: string }>();
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const request = useRef<{ version: number; controller?: AbortController }>({ version: 0 });
    useEffect(() => () => { request.current.controller?.abort(); request.current.version++; }, []);
    const resolve = async (endpoint = url, refreshId?: string) => {
        request.current.controller?.abort();
        const version = ++request.current.version, controller = new AbortController(); request.current.controller = controller;
        setError(""); setLoading(true); setPreview(undefined);
        try {
            const result = await loadMiniUpManifest(endpoint, { providerAccess, webAccessAvailable, signal: controller.signal });
            if (request.current.version === version && !controller.signal.aborted) setPreview({ ...result, url: publicMapUrl(endpoint), refreshId });
        } catch (failure) { if (!controller.signal.aborted && request.current.version === version) setError(failure instanceof Error ? failure.message : String(failure)); }
        finally { if (request.current.version === version) setLoading(false); }
    };
    const readFile = async (file: File | undefined) => {
        if (!file) return;
        request.current.controller?.abort(); const version = ++request.current.version;
        setError(""); setLoading(false); setPreview(undefined);
        try {
            if (file.size > 12_000_000) throw new Error("Map manifest exceeds 12 MB.");
            const parsed = parseMiniUpManifest(JSON.parse(await file.text()));
            if (version === request.current.version) { setPreview(parsed); setMode("snapshot"); }
        } catch (failure) { if (version === request.current.version) setError(failure instanceof Error ? failure.message : String(failure)); }
    };
    return <section class="hp-miniup-import" aria-label="Import MiniUp map">
        <header><div><strong>Import a MiniUp map</strong><small>Reuse published layers in the native map.</small></div><button type="button" aria-label="Close MiniUp import" onClick={onClose}>×</button></header>
        <div class="hp-miniup-import-fields">
            <label><span>Select published map</span><select aria-label="Select published MiniUp map" value="" onChange={event => { const endpoint = event.currentTarget.value; if (endpoint) { setUrl(endpoint); void resolve(endpoint); } }}><option value="">{publishedMaps.length ? "Choose a published map…" : "No map catalog configured"}</option>{publishedMaps.map(item => <option value={item.manifestUrl}>{item.name}</option>)}</select></label>
            <label><span>Published manifest URL</span><input type="url" value={url} placeholder="https://your-map.miniup.app/map.hyperpbi.json" onInput={event => { setUrl(event.currentTarget.value); setPreview(undefined); request.current.controller?.abort(); request.current.version++; setLoading(false); }} /></label>
            <button type="button" disabled={!url.trim() || loading} onClick={() => void resolve()}>{loading ? "Loading…" : "Preview map"}</button>
            <label class="hp-miniup-file"><span>Or open an exported manifest</span><input type="file" accept=".json,application/json" aria-label="Open MiniUp manifest" onChange={event => void readFile(event.currentTarget.files?.[0])} /></label>
            <label><span>Import mode</span><select aria-label="MiniUp import mode" value={mode} onChange={event => setMode(event.currentTarget.value as "snapshot" | "linked")}><option value="snapshot">Snapshot · copy configuration</option><option value="linked">Linked · controlled refresh</option></select></label>
        </div>
        <p class="hp-miniup-help">Use the map’s exported hyperpbi.map 1.0 JSON asset. Website scripts are not imported. Catalogs are configured with Runtime Config → miniup.publishedMaps. Public data must allow CORS and Power BI WebAccess.</p>
        {(map.imports ?? []).filter(item => item.mode === "linked").length > 0 && <div class="hp-miniup-linked">{map.imports?.filter(item => item.mode === "linked").map(item => <button type="button" disabled={loading} onClick={() => { setUrl(item.manifestUrl ?? ""); setMode("linked"); void resolve(item.manifestUrl, item.id); }}>Refresh {item.name} · v{item.version}</button>)}</div>}
        {error && <div role="alert" class="hp-studio-inline-error">{error}</div>}
        {preview && <div class="hp-miniup-preview"><strong>{preview.manifest.name} <small>v{preview.manifest.version}</small></strong><ul>{preview.manifest.layers.map(layer => <li><span>{layer.name}</span><small>{layer.source.type} · {layer.visible === false ? "hidden" : "visible"} · {Math.round((layer.opacity ?? 1) * 100)}%</small></li>)}</ul>{preview.warnings.length > 0 && <details open><summary>{preview.warnings.length} import warnings</summary><ul>{preview.warnings.map(warning => <li>{warning}</li>)}</ul></details>}<button type="button" disabled={mode === "linked" && !preview.url} onClick={() => {
            try { const result = importMiniUpMap(map, preview.manifest, { mode: preview.refreshId ? "linked" : mode, manifestUrl: preview.url, refreshId: preview.refreshId }); if (onApply(result.map, [...preview.warnings, ...result.warnings])) onClose(); }
            catch (failure) { setError(failure instanceof Error ? failure.message : String(failure)); }
        }}>{preview.refreshId ? "Apply refreshed map" : `Import map and ${preview.manifest.layers.length} layers`}</button></div>}
    </section>;
}
