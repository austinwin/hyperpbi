import { useEffect, useRef, useState } from "preact/hooks";
import { validateGeoJson } from "../../maps/sources/publicGeoJson";
import type { MapLayerDefinition } from "../../schema/mapSchema";

export function MapGeoJsonInput({ layer, mutate }: { layer: MapLayerDefinition; mutate: (fn: (layer: MapLayerDefinition) => void) => boolean }) {
  const [draft, setDraft] = useState(""), [error, setError] = useState("");
  const request = useRef(0);
  useEffect(() => () => { request.current++; }, []);
  const apply = (text: string) => {
    try {
      if (text.length > 25_000_000) throw new Error("GeoJSON exceeds 25 MB. Use a FeatureServer for larger data.");
      const data = validateGeoJson(JSON.parse(text));
      if (mutate(candidate => { if (candidate.source.type === "geoJson") { candidate.source.data = data; delete candidate.source.url; } })) { setDraft(""); setError(""); }
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Could not read GeoJSON."); }
  };
  return <details class="hp-map-geojson-input"><summary>Import a GeoJSON file or paste data</summary>
    <label><span>GeoJSON file</span><input aria-label="Import GeoJSON file" type="file" accept=".geojson,.json,application/geo+json,application/json" onChange={async event => {
      const file = event.currentTarget.files?.[0], revision = ++request.current;
      if (!file) return;
      if (file.size > 25_000_000) { setError("GeoJSON exceeds 25 MB. Use a FeatureServer for larger data."); return; }
      try { const text = await file.text(); if (request.current === revision) apply(text); } catch { setError("The file could not be read. Choose it again."); }
    }} /></label>
    <label><span>GeoJSON data</span><textarea aria-label="Paste GeoJSON data" placeholder="Paste a FeatureCollection, Feature, or geometry" value={draft} onInput={event => setDraft(event.currentTarget.value)} /></label>
    <button type="button" disabled={!draft.trim()} onClick={() => apply(draft)}>Apply GeoJSON data</button>
    {layer.source.type === "geoJson" && layer.source.data && <small>Inline data is saved with the map. Importing replaces this source's URL.</small>}
    {error && <p role="alert">{error}</p>}
  </details>;
}
