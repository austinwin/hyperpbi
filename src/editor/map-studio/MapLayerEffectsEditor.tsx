import type { MapLayerDefinition } from "../../schema/mapSchema";

export function MapLayerEffectsEditor({ layer, mutate }: { layer: MapLayerDefinition; mutate: (fn: (layer: MapLayerDefinition) => void) => boolean }) {
    const renderer = layer.renderer;
    const symbol = renderer && "symbol" in renderer ? renderer.symbol : undefined;
    return <div class="hp-map-form-grid"><label><span>Layer transparency</span><input type="range" aria-label="Layer transparency" min="0" max="100" value={Math.round((1 - (layer.opacity ?? 1)) * 100)} onInput={event => mutate(candidate => { candidate.opacity = 1 - Number(event.currentTarget.value) / 100; })} /><small>{Math.round((1 - (layer.opacity ?? 1)) * 100)}% transparent</small></label>{renderer && "symbol" in renderer && <label><span>Unselected feature opacity</span><input type="number" aria-label="Unselected feature opacity" min="0" max="1" step="0.05" value={symbol?.dimmedOpacity ?? 0.25} onChange={event => mutate(candidate => { if (candidate.renderer && "symbol" in candidate.renderer) candidate.renderer.symbol = { ...candidate.renderer.symbol, dimmedOpacity: Number(event.currentTarget.value) }; })} /></label>}<p>Effects reflect the current renderer. Transparency and selection dimming work with native layers; bloom and GPU effects are unavailable in this Leaflet renderer.</p></div>;
}
