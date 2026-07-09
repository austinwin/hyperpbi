import * as L from "leaflet";
import "leaflet.markercluster";
import { useEffect, useRef, useMemo } from "preact/hooks";
import { NormalizedMapData, NormalizedMapFeature } from "../../data/normalizeData";
import { MapComponent, MapLayerDefinition } from "../../schema/hyperpbiSchema";
import { useRenderContext } from "../../render/RenderContext";
import { resolveMapStyle } from "../../maps/mapStyleResolver";
import { createTooltipNode, resolveMapTooltip } from "../../maps/mapTooltipResolver";
import { createMapPopup } from "./MapPopup";
import { resolveProviderPolicy } from "../../providers/providerPolicy";
import { getBasemapProvider } from "../../providers/basemapProviderRegistry";
import { executeComponentInteraction } from "../../interactions/componentInteraction";
import { createInteractionPayload } from "../../interactions/interactionPayload";
import { resolveInteractionPolicy } from "../../interactions/interactionPolicy";
import type { ResolvedMapLayer } from "../../maps/model/resolvedMapTypes";

function bindInteractions(
    layer: L.Layer,
    feature: NormalizedMapFeature,
    mapData: NormalizedMapData,
    component: MapComponent,
    fields: Record<string, any>,
    select: (rowIndex: number, rowKey: string, event?: MouseEvent) => void
): void {
    layer.bindTooltip(createTooltipNode(resolveMapTooltip(feature, mapData, fields)));
    if (component.popup?.html) {
        layer.bindPopup(createMapPopup(component.popup.html, feature));
    }
    layer.on("click", event => select(feature.rowIndex, feature.rowKey, (event as L.LeafletMouseEvent).originalEvent));
}

export function LeafletMap({
    component,
    mapData,
    layerDefinitions,
    resolvedLayers,
}: {
    component: MapComponent;
    mapData: NormalizedMapData;
    layerDefinitions: MapLayerDefinition[];
    resolvedLayers: ResolvedMapLayer[];
}) {
    const ref = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const layerGroupRef = useRef<Map<string, L.LayerGroup>>(new Map());
    const context = useRenderContext();
    const { settings, data, sourceRows, config: runtimeConfig, webAccessAvailable } = context;
    const id = component.id ?? "map";
    const interactionPolicy = resolveInteractionPolicy(component, runtimeConfig, "dataPoint");
    const selectedRows = context.componentRows(id);

    const sourceIndices = useMemo(
        () => new Map(sourceRows.map((row, index) => [row, index] as const)),
        [sourceRows]
    );

    // Initialize map once
    useEffect(() => {
        if (!ref.current) return;

        const config = component.settings ?? {};
        const policy = resolveProviderPolicy(runtimeConfig.providers, webAccessAvailable);
        const providerConfig = runtimeConfig.providers?.basemap;
        const provider = getBasemapProvider(providerConfig?.provider ?? "none");
        const enableTiles = policy.tilesAllowed && provider.external;
        const tileUrl = providerConfig?.tileUrl?.trim() || provider.defaults.tileUrl || "";

        const map = L.map(ref.current, {
            zoomControl: true,
            attributionControl: enableTiles,
            preferCanvas: true,
        }).setView(settings.map.center, settings.map.zoom);

        if (enableTiles && /^https:\/\//i.test(tileUrl)) {
            L.tileLayer(tileUrl, {
                maxZoom: providerConfig?.maxZoom ?? provider.defaults.maxZoom ?? 19,
                attribution: providerConfig?.attribution ?? provider.defaults.attribution,
            }).addTo(map);
        }

        mapRef.current = map;

        const observer = new ResizeObserver(() => map.invalidateSize());
        observer.observe(ref.current);

        return () => {
            observer.disconnect();
            map.remove();
            mapRef.current = null;
            layerGroupRef.current.clear();
        };
    }, []); // Only initialize once

    // Update layers when data/layers change
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        const config = component.settings ?? {};
        const style = resolveMapStyle(component, settings.theme.primary, mapData);
        const dataBounds = L.latLngBounds([]);

        // Clear existing layer groups
        for (const [, group] of layerGroupRef.current) {
            map.removeLayer(group);
        }
        layerGroupRef.current.clear();

        // Render each normalized layer
        mapData.layers.forEach(normalizedLayer => {
            const layerGroup = L.featureGroup().addTo(map);
            const cluster = (config.clusterPoints ?? settings.map.clusterPoints)
                ? L.markerClusterGroup({ showCoverageOnHover: false, maxClusterRadius: 44 })
                : null;
            if (cluster) layerGroup.addLayer(cluster);

            normalizedLayer.features.forEach(feature => {
                const color = style.colorFor(feature);
                const sourceIndex = sourceIndices.get(feature.row);
                const selected = feature.rowKey &&
                    context.state.componentSelectedRowKeys[id]?.includes(feature.rowKey);

                let layer: L.Layer | null = null;

                if (feature.type === "point" && feature.lat !== null && feature.lon !== null) {
                    layer = L.circleMarker([feature.lat, feature.lon], {
                        radius: style.radiusFor(feature) + (selected ? 3 : 0),
                        color: selected ? settings.theme.accent : color,
                        fillColor: color,
                        fillOpacity: style.fillOpacity,
                        opacity: style.opacity,
                        weight: selected ? 4 : 1.5,
                    });
                    if (cluster) cluster.addLayer(layer);
                    else layerGroup.addLayer(layer);
                    dataBounds.extend([feature.lat, feature.lon]);
                } else if (feature.geometry) {
                    const geometryLayer = L.geoJSON(feature.geometry, {
                        style: () => ({
                            color: selected ? settings.theme.accent : color,
                            fillColor: color,
                            fillOpacity: style.fillOpacity,
                            opacity: style.opacity,
                            weight: style.weightFor(feature) + (selected ? 3 : 0),
                        }),
                        pointToLayer: (_geoFeature, latlng) =>
                            L.circleMarker(latlng, {
                                radius: style.radiusFor(feature),
                                color,
                                fillColor: color,
                                fillOpacity: style.fillOpacity,
                                opacity: style.opacity,
                                weight: 1.5,
                            }),
                    }).addTo(layerGroup);
                    layer = geometryLayer;
                    const geometryBounds = geometryLayer.getBounds();
                    if (geometryBounds.isValid()) dataBounds.extend(geometryBounds);
                }

                if (layer) {
                    bindInteractions(layer, feature, mapData, component, data.fields,
                        (_rowIndex, rowKey, event) => {
                            const field = interactionPolicy.field;
                            executeComponentInteraction(
                                interactionPolicy,
                                createInteractionPayload(component, {
                                    rowIndices: sourceIndex !== undefined ? [sourceIndex] : [],
                                    rowKeys: [rowKey],
                                    sourceRowKeys: context.sourceRowKeys,
                                    field,
                                    value: field ? feature.row[field] : undefined,
                                }),
                                context,
                                { trigger: "click", multiSelect: Boolean(event?.ctrlKey || event?.metaKey), event }
                            );
                        }
                    );
                }
            });

            layerGroupRef.current.set(normalizedLayer.name, layerGroup);
        });

        if ((config.fitBounds ?? true) && dataBounds.isValid()) {
            map.fitBounds(dataBounds.pad(.08), { maxZoom: 14 });
        }
    }, [
        mapData,
        component,
        settings.map,
        settings.theme.primary,
        settings.theme.accent,
        sourceRows,
        JSON.stringify(context.state.componentSelectedRowKeys[id]),
        runtimeConfig.providers,
        webAccessAvailable,
    ]);

    const external = resolveProviderPolicy(runtimeConfig.providers, webAccessAvailable).tilesAllowed;

    return (
        <div
            ref={ref}
            class={`hp-map-canvas ${external ? "hp-map-tiled" : "hp-map-neutral"}`}
            style={{ height: `${component.height ?? 320}px` }}
        />
    );
}
