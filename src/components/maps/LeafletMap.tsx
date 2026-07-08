import * as L from "leaflet";
import "leaflet.markercluster";
import { useEffect, useRef } from "preact/hooks";
import { NormalizedMapData, NormalizedMapFeature } from "../../data/normalizeData";
import { MapComponent } from "../../schema/hyperpbiSchema";
import { useRenderContext } from "../../render/RenderContext";
import { resolveMapStyle } from "../../maps/mapStyleResolver";
import { createTooltipNode, resolveMapTooltip } from "../../maps/mapTooltipResolver";
import { createMapPopup } from "./MapPopup";
import { resolveProviderPolicy } from "../../providers/providerPolicy";
import { getBasemapProvider } from "../../providers/basemapProviderRegistry";
import { executeComponentInteraction } from "../../interactions/componentInteraction";
import { createInteractionPayload } from "../../interactions/interactionPayload";
import { resolveInteractionPolicy } from "../../interactions/interactionPolicy";

function bindInteractions(layer: L.Layer, feature: NormalizedMapFeature, mapData: NormalizedMapData, component: MapComponent, fields: ReturnType<typeof useRenderContext>["data"]["fields"], select: (rowIndex: number, rowKey: string, event?:MouseEvent) => void): void {
    layer.bindTooltip(createTooltipNode(resolveMapTooltip(feature, mapData, fields)));
    if (component.popup?.html) layer.bindPopup(createMapPopup(component.popup.html, feature));
    layer.on("click", event => select(feature.rowIndex, feature.rowKey, (event as L.LeafletMouseEvent).originalEvent));
}

export function LeafletMap({ component, mapData, visibleLayers }: { component: MapComponent; mapData: NormalizedMapData; visibleLayers: Set<string> }) {
    const ref = useRef<HTMLDivElement>(null); const context=useRenderContext();const { settings, data, sourceRows, config: runtimeConfig, webAccessAvailable } = context;const id=component.id??"map";const interactionPolicy=resolveInteractionPolicy(component,runtimeConfig,"dataPoint");const selectedRows=context.componentRows(id);
    useEffect(() => {
        if (!ref.current) return;
        const sourceIndices = new Map(sourceRows.map((row,index)=>[row,index] as const));
        const config = component.settings ?? {}; const policy = resolveProviderPolicy(runtimeConfig.providers,webAccessAvailable); const providerConfig = runtimeConfig.providers?.basemap; const provider = getBasemapProvider(providerConfig?.provider ?? "none"); const enableTiles = policy.tilesAllowed && provider.external;
        const tileUrl = providerConfig?.tileUrl?.trim() || provider.defaults.tileUrl || "";
        const map = L.map(ref.current, { zoomControl: true, attributionControl: enableTiles, preferCanvas: true }).setView(settings.map.center, settings.map.zoom);
        if (enableTiles && /^https:\/\//i.test(tileUrl)) L.tileLayer(tileUrl, { maxZoom: providerConfig?.maxZoom ?? provider.defaults.maxZoom ?? 19, attribution: providerConfig?.attribution ?? provider.defaults.attribution }).addTo(map);
        const style = resolveMapStyle(component, settings.theme.primary, mapData); const dataBounds = L.latLngBounds([]);
        mapData.layers.filter(layer => visibleLayers.has(layer.name)).forEach(normalizedLayer => {
            const layerGroup = L.featureGroup().addTo(map); const cluster = (config.clusterPoints ?? settings.map.clusterPoints) ? L.markerClusterGroup({ showCoverageOnHover: false, maxClusterRadius: 44 }) : null;
            if (cluster) layerGroup.addLayer(cluster);
            normalizedLayer.features.forEach(feature => {
                const color = style.colorFor(feature);const sourceIndex=sourceIndices.get(feature.row);const selected=feature.rowKey && context.state.componentSelectedRowKeys[id]?.includes(feature.rowKey); let layer: L.Layer | null = null;
                if (feature.type === "point" && feature.lat !== null && feature.lon !== null) {
                    layer = L.circleMarker([feature.lat, feature.lon], { radius: style.radiusFor(feature)+(selected?3:0), color:selected?settings.theme.accent:color, fillColor: color, fillOpacity: style.fillOpacity, opacity: style.opacity, weight:selected?4:1.5 });
                    if (cluster) cluster.addLayer(layer); else layerGroup.addLayer(layer);
                    dataBounds.extend([feature.lat, feature.lon]);
                } else if (feature.geometry) {
                    const geometryLayer = L.geoJSON(feature.geometry, {
                        style: () => ({ color:selected?settings.theme.accent:color, fillColor: color, fillOpacity: style.fillOpacity, opacity: style.opacity, weight: style.weightFor(feature)+(selected?3:0) }),
                        pointToLayer: (_geoFeature, latlng) => L.circleMarker(latlng, { radius: style.radiusFor(feature), color, fillColor: color, fillOpacity: style.fillOpacity, opacity: style.opacity, weight: 1.5 })
                    }).addTo(layerGroup);
                    layer = geometryLayer; const geometryBounds = geometryLayer.getBounds(); if (geometryBounds.isValid()) dataBounds.extend(geometryBounds);
                }
                if (layer) bindInteractions(layer, feature, mapData, component, data.fields, (_rowIndex,rowKey,event) => { const field=interactionPolicy.field;executeComponentInteraction(interactionPolicy,createInteractionPayload(component,{rowIndices:sourceIndex!==undefined?[sourceIndex]:[],rowKeys:[rowKey],sourceRowKeys:context.sourceRowKeys,field,value:field?feature.row[field]:undefined}),context,{trigger:"click",multiSelect:Boolean(event?.ctrlKey||event?.metaKey),event}); });
            });
        });
        if ((config.fitBounds ?? true) && dataBounds.isValid()) map.fitBounds(dataBounds.pad(.08), { maxZoom: 14 });
        const observer = new ResizeObserver(() => map.invalidateSize()); observer.observe(ref.current);
        return () => { observer.disconnect(); map.remove(); };
    }, [mapData, component, settings.map, settings.theme.primary, settings.theme.accent, visibleLayers, sourceRows, JSON.stringify(context.state.componentSelectedRowKeys[id]), runtimeConfig.providers,webAccessAvailable]);
    const external = resolveProviderPolicy(runtimeConfig.providers,webAccessAvailable).tilesAllowed;
    return <div ref={ref} class={`hp-map-canvas ${external ? "hp-map-tiled" : "hp-map-neutral"}`} style={{ height: `${component.height ?? 320}px` }} />;
}
