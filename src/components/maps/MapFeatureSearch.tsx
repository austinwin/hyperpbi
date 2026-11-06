import { useMemo, useState } from "preact/hooks";
import type { ResolvedMapFeature, ResolvedMapLayer } from "../../maps/model/resolvedMapTypes";

export function MapFeatureSearch({ layers, onSelect }: { layers: ResolvedMapLayer[]; onSelect: (layer: ResolvedMapLayer, feature: ResolvedMapFeature) => void }) {
    const [query, setQuery] = useState("");
    const results = useMemo(() => {
        const needle = query.trim().toLocaleLowerCase();
        if (!needle) return [];
        const found: { layer: ResolvedMapLayer; feature: ResolvedMapFeature; label: string }[] = [];
        for (const layer of layers) {
            if (!layer.visible) continue;
            for (const feature of layer.features) {
                const values = [feature.id, ...Object.values(feature.serviceAttributes), ...Object.values(feature.powerBiAttributes), ...Object.values(feature.joinedAttributes)].filter(value => ["string", "number"].includes(typeof value));
                const match = values.find(value => String(value).toLocaleLowerCase().includes(needle));
                if (match !== undefined) found.push({ layer, feature, label: String(match) });
                if (found.length >= 30) return found;
            }
        }
        return found;
    }, [query, layers]);
    return <section class="hp-map-feature-search"><label><span>Search loaded features</span><input type="search" aria-label="Search loaded map features" value={query} placeholder="Name, ID or attribute…" onInput={event => setQuery(event.currentTarget.value)} /></label><div role="status" class="hp-map-search-summary">{query.trim() ? `${results.length}${results.length === 30 ? "+" : ""} matching features` : "Search visible layers without a geocoder."}</div><div class="hp-map-feature-results">{results.map(({ layer, feature, label }) => <button type="button" key={`${layer.id}-${feature.id}`} onClick={() => onSelect(layer, feature)}><strong>{label}</strong><small>{layer.name} · {feature.id}</small></button>)}</div></section>;
}
