// ── Map Legend Panel ─────────────────────────────────────────────────
// Shows per-layer legends. Supports simple, unique-value, class-break,
// and continuous color legends.

import { h } from "preact";
import { NormalizedMapData } from "../../data/normalizeData";
import { MapComponent } from "../../schema/hyperpbiSchema";
import { ResolvedMapStyle } from "../../maps/mapStyleResolver";

export function MapLegendPanel({ map, component, style }: {
    map: NormalizedMapData;
    component: MapComponent;
    style: ResolvedMapStyle;
}) {
    if (!map.bindings.color) return null;

    const features = map.layers.flatMap(layer => layer.features);
    const numeric = component.style?.colorMode === "gradient" &&
        features.some(feature => typeof feature.colorValue === "number");

    if (numeric) {
        const ordered = [...features]
            .filter(feature => Number.isFinite(Number(feature.colorValue)))
            .sort((a, b) => Number(a.colorValue) - Number(b.colorValue));
        const values = ordered.map(feature => Number(feature.colorValue));
        if (values.length === 0) return null;

        return (
            <div class="hp-map-legend">
                <strong>Color</strong>
                <div class="hp-map-gradient" style={{
                    background: `linear-gradient(90deg, ${style.colorFor(ordered[0])}, ${style.colorFor(ordered[ordered.length - 1])})`
                }} />
                <div class="hp-map-legend-range">
                    <span>{Math.min(...values).toLocaleString()}</span>
                    <span>{Math.max(...values).toLocaleString()}</span>
                </div>
            </div>
        );
    }

    const samples = Array.from(
        new Map(features.map(feature => [String(feature.colorValue ?? "(Blank)"), feature])).values()
    ).slice(0, 12);

    if (samples.length === 0) return null;

    return (
        <div class="hp-map-legend">
            <strong>Color</strong>
            {samples.map(feature =>
                <div>
                    <i style={{ background: style.colorFor(feature) }} />
                    <span>{String(feature.colorValue ?? "(Blank)")}</span>
                </div>
            )}
        </div>
    );
}
