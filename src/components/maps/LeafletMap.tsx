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
    const basemapRef = useRef<L.TileLayer | null>(null);
    const vectorLayerRefs = useRef<Map<string, L.LayerGroup>>(new Map());
    const arcGisTileRefs = useRef<Map<string, L.TileLayer>>(new Map());
    const dynamicLayerRefs = useRef<Map<string, L.Layer>>(new Map());
    const labelLayerRefs = useRef<Map<string, L.LayerGroup>>(new Map());
    const paneNamesRef = useRef<Map<string, string>>(new Map());
    const hasFitRef = useRef(false);
    const suppressViewportRef = useRef(false);
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

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

        const basemap = component.basemap ?? {};
        const view = component.view ?? {};
        const mapCenter: [number, number] = view.center ?? settings.map.center;
        const mapZoom = view.zoom ?? settings.map.zoom;
        const policy = resolveProviderPolicy(runtimeConfig.providers, webAccessAvailable);
        const enableTiles = policy.tilesAllowed;

        const map = L.map(ref.current, {
            zoomControl: true,
            attributionControl: true,
            preferCanvas: true,
        }).setView(mapCenter, mapZoom);

        // ── Basemap ─────────────────────────────────────────────
        const basemapType = basemap.type ?? "osm";
        if (basemapType !== "none" && enableTiles) {
            let basemapUrl = "";
            let basemapAttribution = basemap.attribution ?? "";
            const bmMaxZoom = basemap.maxZoom ?? 19;

            if (basemapType === "osm") {
                basemapUrl = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
                basemapAttribution = basemapAttribution || '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
            } else if (basemapType === "customTile" || basemapType === "arcgisTile") {
                basemapUrl = basemap.url ?? "";
            }

            if (basemapUrl && /^https:\/\//i.test(basemapUrl)) {
                const tileLayer = L.tileLayer(basemapUrl, {
                    maxZoom: bmMaxZoom,
                    attribution: basemapAttribution,
                }).addTo(map);
                basemapRef.current = tileLayer;
            }
        }

        mapRef.current = map;
        hasFitRef.current = false;

        // ── Controller ──────────────────────────────────────────
        const controller: LeafletMapController = {
            home() {
                map.setView(mapCenter, mapZoom);
            },
            zoomToSelection() {
                const selBounds = L.latLngBounds([]);
                const selRowKeys = context.state.componentSelectedRowKeys[id] ?? [];
                const selMapIds = context.state.mapSelectedFeatureIds[id] ?? [];
                for (const layer of resolvedLayers) {
                    for (const feat of layer.features) {
                        const isPbSelected = feat.powerBiRowKeys.some(k => selRowKeys.includes(k));
                        const isLocalSelected = selMapIds.includes(feat.id);
                        if (!isPbSelected && !isLocalSelected) continue;
                        if (feat.lat !== null && feat.lon !== null) {
                            selBounds.extend([feat.lat, feat.lon]);
                        } else if (feat.geometry) {
                            const geoLayer = L.geoJSON(feat.geometry);
                            const gb = geoLayer.getBounds();
                            if (gb.isValid()) selBounds.extend(gb);
                        }
                    }
                }
                if (selBounds.isValid()) {
                    const pad = view.fitPadding ?? 0.08;
                    map.fitBounds(selBounds.pad(pad), { maxZoom: view.maxZoom ?? 18 });
                }
            },
            invalidateSize() {
                map.invalidateSize();
            },
        };
        setTimeout(() => onControllerReady?.(controller), 0);

        // ── Viewport emission ───────────────────────────────────
        const emitViewport = () => {
            if (suppressViewportRef.current) return;
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = setTimeout(() => {
                const bounds = map.getBounds();
                const size = map.getSize ? map.getSize() : { x: 0, y: 0 };
                onViewportChange?.({
                    bounds: [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()],
                    zoom: map.getZoom(),
                    width: size.x,
                    height: size.y,
                });
            }, 250);
        };
        map.on("moveend", emitViewport);
        map.on("zoomend", emitViewport);
        map.on("resize", emitViewport);

        const observer = new ResizeObserver(() => map.invalidateSize());
        observer.observe(ref.current);

        return () => {
            observer.disconnect();
            map.off("moveend", emitViewport);
            map.off("zoomend", emitViewport);
            map.off("resize", emitViewport);
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
            for (const [, dl] of dynamicLayerRefs.current) {
                map.removeLayer(dl);
            }
            dynamicLayerRefs.current.clear();
            for (const [, tl] of arcGisTileRefs.current) {
                map.removeLayer(tl);
            }
            arcGisTileRefs.current.clear();
            map.remove();
            mapRef.current = null;
            vectorLayerRefs.current.clear();
            basemapRef.current = null;
            labelLayerRefs.current.clear();
            paneNamesRef.current.clear();
        };
    }, []);

    // ── Render resolved layers ───────────────────────────────────────
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        const dataBounds = L.latLngBounds([]);
        let hasAnyFeatures = false;

        // Clear existing vector layer groups
        for (const [, group] of vectorLayerRefs.current) {
            map.removeLayer(group);
        }
        vectorLayerRefs.current.clear();

        // Clear all label groups
        for (const [, group] of labelLayerRefs.current) {
            map.removeLayer(group);
        }
        labelLayerRefs.current.clear();

        // Clear dynamic layers that are no longer present
        for (const [key, dl] of dynamicLayerRefs.current) {
            const shouldKeep = resolvedLayers.some(l => l.sourceType === "arcgisDynamic" && l.id === key);
            if (!shouldKeep) {
                map.removeLayer(dl);
                dynamicLayerRefs.current.delete(key);
            }
        }

        // Clear tile layers that are no longer present
        for (const [key, tl] of arcGisTileRefs.current) {
            const shouldKeep = resolvedLayers.some(l => l.sourceType === "arcgisTile" && l.id === key);
            if (!shouldKeep) {
                map.removeLayer(tl);
                arcGisTileRefs.current.delete(key);
            }
        }

        // Resolve effective order (viewer order or layer order)
        const mapState = context.state.mapLayerState[id];
        const viewerOrder = mapState?.order;
        const sortedLayers = [...resolvedLayers].sort((a, b) => {
            if (viewerOrder) {
                const aIdx = viewerOrder.indexOf(a.id);
                const bIdx = viewerOrder.indexOf(b.id);
                if (aIdx >= 0 && bIdx >= 0) return aIdx - bIdx;
            }
            return a.order - b.order;
        });

        // Create panes for z-ordering
        let paneZ = 400;
        for (const layer of sortedLayers) {
            const paneName = `hp-${id}-${layer.id}`.replace(/[^a-zA-Z0-9_-]/g, "_");
            if (!paneNamesRef.current.has(layer.id)) {
                map.createPane(paneName);
                paneNamesRef.current.set(layer.id, paneName);
            }
            const pane = map.getPane(paneName);
            if (pane) {
                pane.style.zIndex = String(paneZ++);
            }
        }

        // Create a label pane above all vector panes
        const labelPaneName = `hp-${id}-labels`.replace(/[^a-zA-Z0-9_-]/g, "_");
        map.createPane(labelPaneName);
        const labelPane = map.getPane(labelPaneName);
        if (labelPane) labelPane.style.zIndex = String(paneZ++);

        for (const layer of sortedLayers) {
            const isVisible = mapState?.visibility?.[layer.id] ?? layer.visible ?? true;
            if (!isVisible) continue;

            const layerOpacity = mapState?.opacity?.[layer.id] ?? layer.opacity ?? 1;

            // ── Handle tile layers ───────────────────────────────
            if (layer.sourceType === "arcgisTile" && layer.tile) {
                const existingTile = arcGisTileRefs.current.get(layer.id);
                if (existingTile) {
                    existingTile.setOpacity(layerOpacity);
                    continue;
                }
                try {
                    const tileUrl = buildArcGisTileUrl(layer.tile.url);
                    const tileLayer = L.tileLayer(tileUrl, {
                        maxZoom: layer.tile.maxZoom ?? 19,
                        minZoom: layer.tile.minZoom,
                        opacity: layerOpacity,
                        attribution: layer.tile.attribution ?? "",
                        pane: paneNamesRef.current.get(layer.id),
                    }).addTo(map);
                    arcGisTileRefs.current.set(layer.id, tileLayer);
                } catch (err) {
                    const msg = err instanceof Error ? err.message : String(err);
                    layer.diagnostics.warnings.push(`Tile layer error: ${msg}`);
                }
                continue;
            }

            // ── Handle dynamic layers ────────────────────────────
            if (layer.sourceType === "arcgisDynamic" && layer.dynamic) {
                if (!dynamicLayerRefs.current.has(layer.id)) {
                    try {
                        const dynamicLayer = createArcGisDynamicLayer({
                            url: layer.dynamic.url,
                            layerIds: layer.dynamic.layerIds,
                            layerDefinitions: layer.dynamic.layerDefinitions,
                            format: layer.dynamic.format ?? "png",
                            transparent: layer.dynamic.transparent ?? true,
                            minZoom: layer.dynamic.minZoom,
                            maxZoom: layer.dynamic.maxZoom,
                            attribution: layer.dynamic.attribution ?? "",
                            debounceMs: layer.dynamic.debounceMs ?? 300,
                            opacity: layerOpacity,
                        }, (state) => {
                            layer.diagnostics.loading = state.loading;
                            if (state.error) layer.diagnostics.warnings.push(state.error);
                        });
                        dynamicLayer.addTo(map);
                        dynamicLayerRefs.current.set(layer.id, dynamicLayer);
                    } catch (err) {
                        const msg = err instanceof Error ? err.message : String(err);
                        layer.diagnostics.warnings.push(`Dynamic layer error: ${msg}`);
                    }
                }
                continue;
            }

            // ── Render vector features ───────────────────────────
            if (layer.features.length === 0) continue;

            const layerPane = paneNamesRef.current.get(layer.id);
            const layerGroup = L.featureGroup().addTo(map);
            const renderer = layer.renderer as ResolvedMapRenderer;
            const domain = rendererDomains.get(layer.id) ?? null;

            const useCluster = renderer.type === "cluster" &&
                (component.settings?.clusterPoints ?? settings.map.clusterPoints);

            const cluster = useCluster
                ? L.markerClusterGroup({ showCoverageOnHover: false, maxClusterRadius: 44 })
                : null;
            if (cluster) layerGroup.addLayer(cluster);

            // Selection state
            const selectedRowKeys = context.state.componentSelectedRowKeys[id] ?? [];
            const selectedMapIds = context.state.mapSelectedFeatureIds[id] ?? [];

            // ── Labels group for this layer ──────────────────────
            const labelsEnabled = mapState?.labels?.[layer.id] ?? layer.labels?.enabled ?? false;
            let labelsGroup: L.LayerGroup | null = null;
            if (labelsEnabled && layer.labels) {
                labelsGroup = L.layerGroup([], { pane: labelPaneName }).addTo(map);
                labelLayerRefs.current.set(layer.id, labelsGroup);
            }

            for (const feature of layer.features) {
                // Check selection: Power BI or map-local
                const isPbSelected = feature.powerBiRowKeys.some(k => selectedRowKeys.includes(k));
                const isLocalSelected = selectedMapIds.includes(feature.id);
                const isSelected = isPbSelected || isLocalSelected;

                // Compute style
                let style: LeafletFeatureStyle;
                if (domain && (renderer.type === "continuousColor" || renderer.type === "proportionalSize")) {
                    style = featureStyleWithDomain(feature, renderer, domain);
                } else {
                    style = featureStyle(feature, renderer);
                }

                if (isSelected) {
                    style = {
                        ...style,
                        color: settings.theme.accent,
                        weight: Math.max(style.weight + 2, 4),
                        radius: (style.radius || 6) + 3,
                    };
                }

                let leafletLayer: L.Layer | null = null;

                // Point features
                if (feature.lat !== null && feature.lon !== null && feature.geometryType === "point") {
                    leafletLayer = L.circleMarker([feature.lat, feature.lon], {
                        radius: style.radius || 6,
                        color: style.color,
                        fillColor: style.fillColor,
                        fillOpacity: style.fillOpacity,
                        opacity: style.opacity * layerOpacity,
                        weight: style.weight,
                        dashArray: style.dashArray,
                        pane: layerPane,
                    });
                    if (cluster) cluster.addLayer(leafletLayer);
                    else layerGroup.addLayer(leafletLayer);
                    dataBounds.extend([feature.lat, feature.lon]);
                    hasAnyFeatures = true;
                }
                // Geometry features
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
                                radius: style.radius || 6,
                                color: style.color,
                                fillColor: style.fillColor,
                                fillOpacity: style.fillOpacity,
                                opacity: style.opacity * layerOpacity,
                                weight: style.weight,
                                pane: layerPane,
                            }),
                        pane: layerPane,
                    }).addTo(layerGroup);
                    const geoBounds = (leafletLayer as L.GeoJSON).getBounds();
                    if (geoBounds.isValid()) dataBounds.extend(geoBounds);
                    hasAnyFeatures = true;
                }

                // ── Tooltip ──────────────────────────────────────
                if (leafletLayer && layer.tooltip?.enabled !== false) {
                    const tipFields = layer.tooltip?.fields ?? layer.popup?.fields?.slice(0, 2);
                    leafletLayer.bindTooltip(
                        createResolvedTooltipElement(feature, tipFields, layer.name)
                    );
                }

                // ── Popup ────────────────────────────────────────
                if (leafletLayer && layer.popup?.enabled) {
                    const { element: popupEl, cleanup: popupCleanup } = renderResolvedPopup(
                        layer.popup, feature,
                        {
                            executeAction: (action, _feat, _evt) => {
                                if (action.uiAction) {
                                    context.executeUiAction(action.uiAction);
                                }
                            },
                        }
                    );
                    leafletLayer.bindPopup(popupEl);
                    leafletLayer.on("popupclose", () => popupCleanup?.());
                }

                // ── Click interaction ────────────────────────────
                if (leafletLayer) {
                    leafletLayer.on("click", (event: L.LeafletMouseEvent) => {
                        const multiSelect = Boolean(event.originalEvent?.ctrlKey || event.originalEvent?.metaKey);

                        if (feature.powerBiRowIndices.length > 0 && feature.powerBiRowKeys.length > 0) {
                            // Power BI or joined feature
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
                            const mode = multiSelect ? "toggle" : "replace";
                            context.dispatch({
                                type: "selectMapFeatures",
                                mapId: id,
                                featureIds: [feature.id],
                                selectionMode: mode,
                            });
                        }
                    });
                }

                // ── Labels ────────────────────────────────────────
                if (labelsGroup && layer.labels && leafletLayer) {
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
                        let labelPos: [number, number];
                        if (feature.lat !== null && feature.lon !== null) {
                            labelPos = [feature.lat, feature.lon];
                        } else if (feature.geometry) {
                            labelPos = getGeometryCenter(feature.geometry);
                        } else {
                            labelPos = [0, 0];
                        }
                        const labelMarker = L.marker(labelPos, {
                            icon: labelIcon, interactive: false, keyboard: false,
                        });
                        labelsGroup.addLayer(labelMarker);
                    }
                }
            }

            vectorLayerRefs.current.set(layer.id, layerGroup);
        }

        // ── Fit bounds ───────────────────────────────────────────
        const viewDef = component.view ?? {};
        const fitMode = viewDef.fitMode ?? "data";
        if (fitMode !== "none" && dataBounds.isValid() && hasAnyFeatures && !hasFitRef.current) {
            suppressViewportRef.current = true;
            map.fitBounds(dataBounds.pad(viewDef.fitPadding ?? 0.08), { maxZoom: viewDef.maxZoom ?? 14 });
            hasFitRef.current = true;
            setTimeout(() => { suppressViewportRef.current = false; }, 500);
        }
    }, [
        resolvedLayers,
        component,
        settings.map,
        settings.theme.primary,
        settings.theme.accent,
        context.state.componentSelectedRowKeys[id],
        context.state.mapSelectedFeatureIds[id],
        context.state.mapLayerState[id],
        runtimeConfig.providers,
        webAccessAvailable,
        rendererDomains,
    ]);

    // Cleanup no longer needed — map instance tracked via ref
    // and cleaned up in the init effect's return.

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
