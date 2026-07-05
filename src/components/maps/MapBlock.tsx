import { useEffect, useMemo, useState } from "preact/hooks";
import { MapComponent } from "../../schema/hyperpbiSchema";
import { useRenderContext } from "../../render/RenderContext";
import { resolveMapStyle } from "../../maps/mapStyleResolver";
import { Card } from "../layout/LayoutBlocks";
import { EmptyState } from "../system/EmptyState";
import { LayerControl } from "./LayerControl";
import { LeafletMap } from "./LeafletMap";
import { MapEmptyState } from "./MapEmptyState";
import { MapLegend } from "./MapLegend";

export function MapBlock({ component }: { component: MapComponent }) {
    const { data, sourceRows, settings, state } = useRenderContext(); const map = data.map; const layerNames = map.layers.map(layer => layer.name); const layerSignature = layerNames.join("\u0000");
    const [visibleLayers, setVisibleLayers] = useState<Set<string>>(() => new Set(layerNames));
    useEffect(() => setVisibleLayers(new Set(layerNames)), [layerSignature]);
    const mapStyle = useMemo(() => resolveMapStyle(component, settings.theme.primary, map), [component, settings.theme.primary, map]);
    const selected = map.layers.flatMap(layer => layer.features).find(feature => sourceRows.indexOf(feature.row) === state.selectedMapFeature);
    const coordinateSystem = component.settings?.coordinateSystem ?? "EPSG:4326";
    const toggleLayer = (name: string, enabled: boolean) => setVisibleLayers(current => { const next = new Set(current); if (enabled) next.add(name); else next.delete(name); return next; });
    let content;
    if (!settings.map.enabled) content = <EmptyState title="Maps are disabled in formatting settings" />;
    else if (map.mode === "none") content = <MapEmptyState reason={map.warnings[0]} />;
    else if (map.mode === "address" && !map.layers.some(layer => layer.features.some(feature => feature.type === "point"))) content = <MapEmptyState reason={map.warnings[0]} />;
    else if (map.mode === "xy" && coordinateSystem.toUpperCase() !== "EPSG:4326") content = <MapEmptyState reason={`Coordinate system ${coordinateSystem} requires an approved projection adapter. Bind EPSG:4326 X/Y values or use geometry.`} />;
    else if (!map.layers.some(layer => layer.features.length)) content = <MapEmptyState reason={map.warnings[0] ?? "Bound map fields contain no valid locations."} />;
    else content = <>
        <div class="hp-map-frame"><LeafletMap component={component} mapData={map} visibleLayers={visibleLayers} />
            {component.settings?.showLegend !== false && <MapLegend map={map} component={component} style={mapStyle} />}
        </div>
        {map.warnings.length > 0 && <div class="hp-map-warning">{map.warnings.join(" ")}</div>}
        {selected && map.bindings.details.length > 0 && <dl class="hp-map-details"><div><dt>Selected</dt><dd>{selected.id}</dd></div>{map.bindings.details.map(key => <div><dt>{data.fields[key]?.displayName ?? key}</dt><dd>{String(selected.row[key] ?? "—")}</dd></div>)}</dl>}
    </>;
    return <Card title={component.title}>{component.settings?.showLayerControl !== false && layerNames.length > 1 && <LayerControl layers={layerNames} visible={visibleLayers} onChange={toggleLayer} />}{content}</Card>;
}
