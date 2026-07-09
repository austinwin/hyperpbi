import * as L from "leaflet";
import "leaflet.markercluster";
import { useEffect, useRef, useMemo } from "preact/hooks";
import { NormalizedMapData } from "../../data/normalizeData";
import { MapComponent } from "../../schema/hyperpbiSchema";
import { useRenderContext } from "../../render/RenderContext";
import { resolveMapStyle } from "../../maps/mapStyleResolver";
import { resolveProviderPolicy } from "../../providers/providerPolicy";
import { getBasemapProvider } from "../../providers/basemapProviderRegistry";
import { executeComponentInteraction } from "../../interactions/componentInteraction";
import { createInteractionPayload } from "../../interactions/interactionPayload";
import { resolveInteractionPolicy } from "../../interactions/interactionPolicy";
import { featureStyle, featureStyleWithDomain, computeFeatureDomain } from "../../maps/renderers/mapFeatureSymbol";
import { createResolvedTooltipElement, renderResolvedPopup } from "./ResolvedMapPopup";
import { createArcGisDynamicLayer, buildArcGisTileUrl } from "../../maps/arcgis/arcGisDynamicLayer";
import type { ResolvedMapLayer, ResolvedMapFeature, ResolvedMapRenderer } from "../../maps/model/resolvedMapTypes";
import type { LeafletFeatureStyle } from "../../maps/renderers/mapFeatureSymbol";
import { mergedFeatureAttributes } from "../../maps/model/mapFeatureValue";
import type { MapViewportState } from "./MapBlock";

export interface LeafletMapController {
    home(): void;
    zoomToSelection(): void;
    invalidateSize(): void;
}

export function LeafletMap({
    component,
    mapData,
    resolvedLayers,
    onViewportChange,
    onControllerReady,
}: {
    component: MapComponent;
    mapData: NormalizedMapData;
    resolvedLayers: ResolvedMapLayer[];
    onViewportChange?: (viewport: MapViewportState) => void;
    onControllerReady?: (controller: LeafletMapController) => void;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const layerGroupRef = useRef<Map<string, L.LayerGroup>>(new Map());
    const tileRef = useRef<L.TileLayer | null>(null);
    const dynamicRef = useRef<Map<string, L.Layer>>(new Map());
    const labelGroupRef = useRef<L.LayerGroup | null>(null);
    const hasFitRef = useRef(false);

    const context = useRenderContext();
    const { settings, data, config: runtimeConfig, webAccessAvailable } = context;
    const id = component.id ?? "map";
    const interactionPolicy = resolveInteractionPolicy(component, runtimeConfig, "dataPoint");

    // ── Precompute renderer domains ──────────────────────────────────
    const rendererDomains = useMemo(() => {
        const domains = new Map<string, [number, number] | null>();
        for (const layer of resolvedLayers) {
            const r = layer.renderer as ResolvedMapRenderer;
            if (r.type === "continuousColor" || r.type === "proportionalSize") {
                const field = r.field ?? r.weightField;
                if (field) {
                    domains.set(layer.id, computeFeatureDomain(layer.features, field, r.fieldSource ?? "joined"));
                }
            }
        }
        return domains;
    }, [resolvedLayers]);

    // ── Initialize map once ──────────────────────────────────────────
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
            const tileLayer = L.tileLayer(tileUrl, {
                maxZoom: providerConfig?.maxZoom ?? provider.defaults.maxZoom ?? 19,
                attribution: providerConfig?.attribution ?? provider.defaults.attribution,
            }).addTo(map);
            tileRef.current = tileLayer;
        }

        mapRef.current = map;
        hasFitRef.current = false;

        const observer = new ResizeObserver(() => map.invalidateSize());
        observer.observe(ref.current);

        return () => {
            observer.disconnect();
            // Clean up dynamic layers
            for (const [, dl] of dynamicRef.current) {
                map.removeLayer(dl);
            }
            dynamicRef.current.clear();
            map.remove();
            mapRef.current = null;
            layerGroupRef.current.clear();
            tileRef.current = null;
            labelGroupRef.current = null;
        };
    }, []);

    // ── Render resolved layers ───────────────────────────────────────
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        const config = component.settings ?? {};
        const dataBounds = L.latLngBounds([]);
        let hasAnyFeatures = false;

        // Clear existing vector layer groups
        for (const [, group] of layerGroupRef.current) {
            map.removeLayer(group);
        }
        layerGroupRef.current.clear();

        // Clear label group
        if (labelGroupRef.current) {
            map.removeLayer(labelGroupRef.current);
            labelGroupRef.current = null;
        }

        // Clear existing dynamic layers
        for (const [key, dl] of dynamicRef.current) {
            // Keep dynamic layers that should persist
            const shouldKeep = resolvedLayers.some(l => l.sourceType === "arcgisDynamic" && l.id === key);
            if (!shouldKeep) {
                map.removeLayer(dl);
                dynamicRef.current.delete(key);
            }
        }

        // Sort layers by order
        const sortedLayers = [...resolvedLayers].sort((a, b) => a.order - b.order);

        // Create label group (on top of all vector layers)
        const labelsGroup = L.layerGroup().addTo(map);
        labelGroupRef.current = labelsGroup;

        for (const layer of sortedLayers) {
            // Check visibility
            const mapState = context.state.mapLayerState[id];
            const isVisible = mapState?.visibility?.[layer.id] ?? layer.visible ?? true;
            if (!isVisible) continue;

            const layerOpacity = mapState?.opacity?.[layer.id] ?? layer.opacity ?? 1;

            // ── Handle tile layers ───────────────────────────────
            if (layer.sourceType === "arcgisTile") {
                const source = layer as any;
                const url = source._sourceUrl || (source.source && (source as any).source?.url) || "";
                if (url && !tileRef.current) {
                    try {
                        const tileUrl = buildArcGisTileUrl(url);
                        const tileLayer = L.tileLayer(tileUrl, {
                            maxZoom: 19,
                            opacity: layerOpacity,
                            attribution: "",
                        }).addTo(map);
                        dynamicRef.current.set(layer.id, tileLayer);
                    } catch { /* silently skip invalid tile URLs */ }
                }
                continue;
            }

            // ── Handle dynamic layers ────────────────────────────
            if (layer.sourceType === "arcgisDynamic") {
                const sourceUrl = (layer as any)._sourceUrl ||
                    (layer as any).source?.url ||
                    layer.diagnostics?.sourceUrl || "";
                if (sourceUrl && !dynamicRef.current.has(layer.id)) {
                    try {
                        const dynamicLayer = createArcGisDynamicLayer({
                            url: sourceUrl,
                            opacity: layerOpacity,
                            debounceMs: 300,
                        });
                        dynamicLayer.addTo(map);
                        dynamicRef.current.set(layer.id, dynamicLayer);
                    } catch { /* silently skip */ }
                }
                continue;
            }

            // ── Render vector features ───────────────────────────
            if (layer.features.length === 0) continue;

            const layerGroup = L.featureGroup().addTo(map);
            const renderer = layer.renderer as ResolvedMapRenderer;
            const domain = rendererDomains.get(layer.id) ?? null;

            // Check for clustering
            const useCluster = renderer.type === "cluster" &&
                (config.clusterPoints ?? settings.map.clusterPoints);

            const cluster = useCluster
                ? L.markerClusterGroup({ showCoverageOnHover: false, maxClusterRadius: 44 })
                : null;
            if (cluster) layerGroup.addLayer(cluster);

            for (const feature of layer.features) {
                // Check selection state
                const selectedRowKeys = context.state.componentSelectedRowKeys[id] ?? [];
                const isSelected = feature.powerBiRowKeys.some(k => selectedRowKeys.includes(k));

                // Compute style
                let style: LeafletFeatureStyle;
                if (domain && (renderer.type === "continuousColor" || renderer.type === "proportionalSize")) {
                    style = featureStyleWithDomain(feature, renderer, domain);
                } else {
                    style = featureStyle(feature, renderer);
                }

                // Apply selection highlight
                if (isSelected) {
                    style = {
                        ...style,
                        color: settings.theme.accent,
                        weight: Math.max(style.weight + 2, 4),
                        radius: style.radius + 3,
                    };
                }

                let leafletLayer: L.Layer | null = null;

                // ── Point features ────────────────────────────────
                if (feature.lat !== null && feature.lon !== null &&
                    feature.geometryType === "point") {
                    leafletLayer = L.circleMarker([feature.lat, feature.lon], {
                        radius: style.radius,
                        color: style.color,
                        fillColor: style.fillColor,
                        fillOpacity: style.fillOpacity,
                        opacity: style.opacity * layerOpacity,
                        weight: style.weight,
                        dashArray: style.dashArray,
                    });
                    if (cluster) cluster.addLayer(leafletLayer);
                    else layerGroup.addLayer(leafletLayer);
                    dataBounds.extend([feature.lat, feature.lon]);
                    hasAnyFeatures = true;
                }
                // ── Geometry features ─────────────────────────────
                else if (feature.geometry) {
                    leafletLayer = L.geoJSON(feature.geometry, {
                        style: () => ({
                            color: style.color,
                            fillColor: style.fillColor,
                            fillOpacity: style.fillOpacity,
                            opacity: style.opacity * layerOpacity,
                            weight: style.weight,
                            dashArray: style.dashArray,
                        }),
                        pointToLayer: (_geoFeature, latlng) =>
                            L.circleMarker(latlng, {
                                radius: style.radius,
                                color: style.color,
                                fillColor: style.fillColor,
                                fillOpacity: style.fillOpacity,
                                opacity: style.opacity * layerOpacity,
                                weight: style.weight,
                            }),
                    }).addTo(layerGroup);
                    const geoBounds = (leafletLayer as L.GeoJSON).getBounds();
                    if (geoBounds.isValid()) dataBounds.extend(geoBounds);
                    hasAnyFeatures = true;
                }

                // ── Bind interactions ─────────────────────────────
                if (leafletLayer) {
                    // Tooltip
                    const tooltipFields = layer.labels?.field
                        ? [{ field: layer.labels.field, fieldSource: layer.labels.fieldSource ?? "service" as const, label: layer.labels.field }]
                        : undefined;
                    leafletLayer.bindTooltip(
                        createResolvedTooltipElement(feature, tooltipFields, layer.name)
                    );

                    // Popup
                    if (layer.popup?.enabled) {
                        leafletLayer.bindPopup(
                            renderResolvedPopup(layer.popup, feature)
                        );
                    }

                    // Click interaction
                    leafletLayer.on("click", (event: L.LeafletMouseEvent) => {
                        const multiSelect = Boolean(event.originalEvent?.ctrlKey || event.originalEvent?.metaKey);

                        if (feature.powerBiRowIndices.length > 0) {
                            // Joined or Power BI feature: select Power BI rows
                            const field = interactionPolicy.field;
                            executeComponentInteraction(
                                interactionPolicy,
                                createInteractionPayload(component, {
                                    rowIndices: feature.powerBiRowIndices,
                                    rowKeys: feature.powerBiRowKeys,
                                    sourceRowKeys: context.sourceRowKeys,
                                    field,
                                    value: field ? feature.powerBiAttributes[field] : undefined,
                                }),
                                context,
                                { trigger: "click", multiSelect, event: event.originalEvent }
                            );
                        } else {
                            // Reference-only feature: map-local selection
                            context.dispatch({
                                type: "selectMapFeatures",
                                mapId: id,
                                featureIds: [feature.id],
                            });
                        }
                    });
                }

                // ── Labels ────────────────────────────────────────
                const labelsEnabled = context.state.mapLayerState[id]?.labels?.[layer.id] ??
                    layer.labels?.enabled ?? false;
                if (labelsEnabled && layer.labels && leafletLayer) {
                    const labelText = feature.labelValue ??
                        (layer.labels.field
                            ? String(mergedFeatureAttributes(feature)[layer.labels.field] ?? "")
                            : feature.id);
                    if (labelText) {
                        const labelIcon = L.divIcon({
                            className: "hp-map-label",
                            html: `<span style="color:${layer.labels.color};font-size:${layer.labels.size}px;font-weight:${layer.labels.weight}">${escapeHtml(String(labelText))}</span>`,
                            iconSize: [0, 0],
                            iconAnchor: [0, 0],
                        });
                        const labelMarker = L.marker(
                            feature.lat && feature.lon ? [feature.lat, feature.lon] :
                                feature.geometry ? getGeometryCenter(feature.geometry) : [0, 0],
                            { icon: labelIcon, interactive: false, keyboard: false }
                        );
                        labelsGroup.addLayer(labelMarker);
                    }
                }
            }

            layerGroupRef.current.set(layer.id, layerGroup);
        }

        // ── Fit bounds ───────────────────────────────────────────
        if ((config.fitBounds ?? true) && dataBounds.isValid() && hasAnyFeatures && !hasFitRef.current) {
            map.fitBounds(dataBounds.pad(0.08), { maxZoom: 14 });
            hasFitRef.current = true;
        }
    }, [
        resolvedLayers,
        component,
        settings.map,
        settings.theme.primary,
        settings.theme.accent,
        JSON.stringify(context.state.componentSelectedRowKeys[id]),
        JSON.stringify(context.state.mapLayerState[id]),
        runtimeConfig.providers,
        webAccessAvailable,
        rendererDomains,
    ]);

    // ── Handle toolbar actions externally ────────────────────────────
    // Store map reference for toolbar access
    useEffect(() => {
        if (mapRef.current) {
            (mapRef.current as any).__hyperpbi_mapId = id;
            (mapRef.current as any).__hyperpbi_component = component;
        }
    }, [id, component]);

    return <div ref={ref} class="hp-leaflet-container" />;
}

// ── Helpers ───────────────────────────────────────────────────────────

function getGeometryCenter(geometry: GeoJSON.GeoJsonObject): [number, number] {
    if (!geometry) return [0, 0];
    switch (geometry.type) {
        case "Point": {
            const coords = (geometry as GeoJSON.Point).coordinates;
            return [coords[1], coords[0]];
        }
        case "Polygon": {
            const coords = (geometry as GeoJSON.Polygon).coordinates[0];
            if (coords) {
                const lats = coords.map(c => c[1]);
                const lons = coords.map(c => c[0]);
                return [
                    (Math.min(...lats) + Math.max(...lats)) / 2,
                    (Math.min(...lons) + Math.max(...lons)) / 2,
                ];
            }
            return [0, 0];
        }
        default:
            return [0, 0];
    }
}

function escapeHtml(text: string): string {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
}
