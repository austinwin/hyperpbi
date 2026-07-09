import { useEffect, useMemo, useState } from "preact/hooks";
import { MapComponent } from "../../schema/hyperpbiSchema";
import { useRenderContext } from "../../render/RenderContext";
import { resolveMapStyle } from "../../maps/mapStyleResolver";
import { Card } from "../layout/LayoutBlocks";
import { EmptyState } from "../system/EmptyState";
import { MapLayerPanel } from "./MapLayerPanel";
import { LeafletMap } from "./LeafletMap";
import { MapEmptyState } from "./MapEmptyState";
import { MapLegendPanel } from "./MapLegendPanel";
import { MapToolbar } from "./MapToolbar";
import { normalizeMapBindings } from "../../data/normalizeMapBindings";
import { resolveLegacyMapLayers } from "../../maps/model/legacyMapResolver";
import { resolvePowerBiLayer } from "../../maps/sources/mapSourceResolver";
import type { ResolvedMapLayer } from "../../maps/model/resolvedMapTypes";
import type { MapLayerDefinition } from "../../schema/mapSchema";

export function MapBlock({ component }: { component: MapComponent }) {
    const context = useRenderContext();
    const { data, sourceRows, settings, config } = context;
    const id = component.id ?? "map";
    const rows = context.getRowsForComponent(id);

    // Resolve layers (legacy or new)
    const layerDefinitions: MapLayerDefinition[] = useMemo(() => {
        return resolveLegacyMapLayers(component, config.bindings?.map);
    }, [component, config.bindings?.map]);

    // Legacy Power BI data normalization (for non-joined powerbi layers)
    const map = useMemo(() => normalizeMapBindings(rows, data.fields,
        config.bindings?.map,
        config.providers?.geocoder?.cacheEntries
    ), [rows, data.fields, config.bindings?.map, config.providers?.geocoder?.cacheEntries]);

    // Resolve layers
    const resolvedLayers: ResolvedMapLayer[] = useMemo(() => {
        return layerDefinitions.map(def => {
            if (def.source.type === "powerbi") {
                return resolvePowerBiLayer(def, {
                    rows,
                    rowKeys: data.rowKeys,
                    fields: data.fields,
                    runtimeBindings: config.bindings?.map,
                    geocodeCache: config.providers?.geocoder?.cacheEntries,
                });
            }
            // ArcGIS layers resolved asynchronously in LeafletMap
            return null as any;
        }).filter(Boolean);
    }, [layerDefinitions, rows, data.rowKeys, data.fields, config]);

    // Check legacy conditions
    const mapStyle = useMemo(() => resolveMapStyle(component, settings.theme.primary, map),
        [component, settings.theme.primary, map]);
    const sourceIndices = useMemo(() => new Map(sourceRows.map((row, index) => [row, index] as const)), [sourceRows]);
    const selectedRows = context.componentRows(id);
    const selected = map.layers.flatMap(layer => layer.features)
        .find(feature => selectedRows.includes(sourceIndices.get(feature.row) ?? -1));
    const coordinateSystem = component.settings?.coordinateSystem ?? "EPSG:4326";

    let content;
    if (!settings.map.enabled) {
        content = <EmptyState title="Maps are disabled in formatting settings" />;
    } else if (map.mode === "none") {
        content = <MapEmptyState reason={map.warnings[0]} />;
    } else if (map.mode === "address" && !map.layers.some(layer => layer.features.some(feature => feature.type === "point"))) {
        content = <MapEmptyState reason={map.warnings[0]} />;
    } else if (map.mode === "xy" && coordinateSystem.toUpperCase() !== "EPSG:4326") {
        content = <MapEmptyState reason={`Coordinate system ${coordinateSystem} requires an approved projection adapter.`} />;
    } else if (!map.layers.some(layer => layer.features.length)) {
        content = <MapEmptyState reason={map.warnings[0] ?? "Bound map fields contain no valid locations."} />;
    } else {
        const showToolbar = component.toolbar?.visible !== false;
        const showLayerPanel = component.layerPanel?.visible !== false;
        const showLegend = component.settings?.showLegend !== false;

        content = <>
            <div class="hp-map-frame">
                {showToolbar && <MapToolbar component={component} mapId={id} />}
                <LeafletMap component={component} mapData={map} layerDefinitions={layerDefinitions} resolvedLayers={resolvedLayers} />
                {showLegend && <MapLegendPanel map={map} component={component} style={mapStyle} />}
            </div>
            {map.warnings.length > 0 && <div class="hp-map-warning">{map.warnings.join(" ")}</div>}
            {selected && map.bindings.details.length > 0 && (
                <dl class="hp-map-details">
                    <div><dt>Selected</dt><dd>{selected.id}</dd></div>
                    {map.bindings.details.map(key =>
                        <div><dt>{data.fields[key]?.displayName ?? key}</dt><dd>{String(selected.row[key] ?? "—")}</dd></div>
                    )}
                </dl>
            )}
        </>;
    }

    return (
        <Card title={component.title}>
            {component.settings?.showLayerControl !== false && resolvedLayers.length > 1 && (
                <MapLayerPanel mapId={id} layers={resolvedLayers} />
            )}
            {content}
        </Card>
    );
}
