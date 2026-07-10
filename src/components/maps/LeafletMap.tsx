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
import { createResolvedMapLabels, type ResolvedMapLabelRuntime } from "./ResolvedMapLabels";
import { createArcGisDynamicLayer, buildArcGisTileUrl, type ArcGisDynamicLeafletLayer } from "../../maps/arcgis/arcGisDynamicLayer";
import { checkHostPolicy } from "../../maps/arcgis/arcGisHostPolicy";
import type { HostPolicyResult } from "../../maps/arcgis/arcGisHostPolicy";
import type { ResolvedMapLayer, ResolvedMapFeature, ResolvedMapRenderer } from "../../maps/model/resolvedMapTypes";
import type { LeafletFeatureStyle } from "../../maps/renderers/mapFeatureSymbol";
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
    onLayerRuntimeStateChange,
}: {
    component: MapComponent;
    mapData: NormalizedMapData;
    resolvedLayers: ResolvedMapLayer[];
    onViewportChange?: (viewport: MapViewportState) => void;
    onControllerReady?: (controller: LeafletMapController) => void;
    onLayerRuntimeStateChange?: (
        layerId: string,
        update: { loading?: boolean; error?: string; warning?: string }
    ) => void;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const mapRef = useRef<L.Map | null>(null);
    const basemapRef = useRef<L.TileLayer | null>(null);
    const vectorLayerRefs = useRef<Map<string, L.LayerGroup>>(new Map());
    const arcGisTileRefs = useRef<Map<string, L.TileLayer>>(new Map());
    const dynamicLayerRefs = useRef<Map<string, ArcGisDynamicLeafletLayer>>(new Map());
    const labelLayerRefs = useRef<Map<string, ResolvedMapLabelRuntime>>(new Map());
    const paneNamesRef = useRef<Map<string, string>>(new Map());
    const hasFitRef = useRef(false);
    const programmaticMoveCountRef = useRef(0);
    const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const context = useRenderContext();
    const { settings, data, config: runtimeConfig, webAccessAvailable } = context;
    const id = component.id ?? "map";
    const resolvedLayersRef = useRef(resolvedLayers);
    const componentRef = useRef(component);
    const selectedRowKeysRef = useRef(context.state.componentSelectedRowKeys[id] ?? []);
    const selectedMapIdsRef = useRef(context.state.mapSelectedFeatureIds[id] ?? []);
    const mapLayerStateRef = useRef(context.state.mapLayerState[id]);
    const onViewportChangeRef = useRef(onViewportChange);
    const onControllerReadyRef = useRef(onControllerReady);
    const onLayerRuntimeStateChangeRef = useRef(onLayerRuntimeStateChange);

    resolvedLayersRef.current = resolvedLayers;
    componentRef.current = component;
    selectedRowKeysRef.current = context.state.componentSelectedRowKeys[id] ?? [];
    selectedMapIdsRef.current = context.state.mapSelectedFeatureIds[id] ?? [];
    mapLayerStateRef.current = context.state.mapLayerState[id];
    onViewportChangeRef.current = onViewportChange;
    onControllerReadyRef.current = onControllerReady;
    onLayerRuntimeStateChangeRef.current = onLayerRuntimeStateChange;

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

            const hostPolicy: HostPolicyResult = basemapType === "customTile" || basemapType === "arcgisTile"
                ? checkHostPolicy(basemapUrl)
                : { allowed: true, host: "" };
            if (basemapUrl && /^https:\/\//i.test(basemapUrl) && hostPolicy.allowed) {
                const tileLayer = L.tileLayer(basemapUrl, {
                    maxZoom: bmMaxZoom,
                    attribution: basemapAttribution,
                }).addTo(map);
                basemapRef.current = tileLayer;
            } else if (basemapUrl && !hostPolicy.allowed) {
                onLayerRuntimeStateChangeRef.current?.("__basemap__", {
                    warning: hostPolicy.reason ?? "Basemap host is blocked by the map host policy.",
                });
            } else if (basemapUrl && !/^https:\/\//i.test(basemapUrl)) {
                onLayerRuntimeStateChangeRef.current?.("__basemap__", {
                    warning: "Only HTTPS custom and ArcGIS tile basemaps are supported.",
                });
            }
        }

        mapRef.current = map;
        hasFitRef.current = false;

        // ── Controller ──────────────────────────────────────────
        const controller: LeafletMapController = {
            home() {
                const currentComponent = componentRef.current;
                const center = currentComponent.view?.center ?? settings.map.center;
                const zoom = currentComponent.view?.zoom ?? settings.map.zoom;
                runProgrammaticMove(map, programmaticMoveCountRef, () => {
                    map.setView(center, zoom, { animate: false });
                });
            },
            zoomToSelection() {
                const selBounds = L.latLngBounds([]);
                const selectedPoints: Array<[number, number]> = [];
                let selectedGeometryCount = 0;
                const selRowKeys = selectedRowKeysRef.current;
                const selMapIds = selectedMapIdsRef.current;
                for (const layer of resolvedLayersRef.current) {
                    for (const feat of layer.features) {
                        const isPbSelected = feat.powerBiRowKeys.some(k => selRowKeys.includes(k));
                        const isLocalSelected = selMapIds.includes(feat.id);
                        if (!isPbSelected && !isLocalSelected) continue;
                        if (feat.lat !== null && feat.lon !== null) {
                            selBounds.extend([feat.lat, feat.lon]);
                            selectedPoints.push([feat.lat, feat.lon]);
                            selectedGeometryCount++;
                        } else if (feat.geometry) {
                            const geoLayer = L.geoJSON(feat.geometry);
                            const gb = geoLayer.getBounds();
                            if (gb.isValid()) {
                                selBounds.extend(gb);
                                selectedGeometryCount++;
                                if (feat.geometry.type === "Point") {
                                    const coordinates = (feat.geometry as GeoJSON.Point).coordinates;
                                    selectedPoints.push([coordinates[1], coordinates[0]]);
                                }
                            }
                        }
                    }
                }
                if (selBounds.isValid()) {
                    const currentView = componentRef.current.view ?? {};
                    const maxZoom = currentView.maxZoom ?? 18;
                    runProgrammaticMove(map, programmaticMoveCountRef, () => {
                        if (selectedGeometryCount === 1 && selectedPoints.length === 1) {
                            map.setView(selectedPoints[0], Math.min(maxZoom, Math.max(map.getZoom(), 14)), { animate: false });
                        } else {
                            map.fitBounds(selBounds.pad(currentView.fitPadding ?? 0.08), { maxZoom, animate: false });
                        }
                    });
                }
            },
            invalidateSize() {
                map.invalidateSize();
            },
        };
        setTimeout(() => onControllerReadyRef.current?.(controller), 0);

        // ── Viewport emission ───────────────────────────────────
        const emitViewport = () => {
            if (programmaticMoveCountRef.current > 0) {
                programmaticMoveCountRef.current--;
                return;
            }
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
            debounceTimerRef.current = setTimeout(() => {
                const bounds = map.getBounds();
                const size = map.getSize ? map.getSize() : { x: 0, y: 0 };
                onViewportChangeRef.current?.({
                    bounds: [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()],
                    zoom: map.getZoom(),
                    width: size.x,
                    height: size.y,
                });
            }, 250);
        };
        map.on("moveend", emitViewport);
        map.on("resize", emitViewport);
        const initialViewportTimer = setTimeout(emitViewport, 0);

        const observer = new ResizeObserver(() => map.invalidateSize());
        observer.observe(ref.current);

        return () => {
            observer.disconnect();
            map.off("moveend", emitViewport);
            map.off("resize", emitViewport);
            clearTimeout(initialViewportTimer);
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
            for (const [, runtime] of labelLayerRefs.current) runtime.cleanup();
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
        for (const [, runtime] of labelLayerRefs.current) runtime.cleanup();
        labelLayerRefs.current.clear();

        // Clear dynamic layers that are no longer present
        for (const [key, dl] of dynamicLayerRefs.current) {
            const definition = resolvedLayers.find(l => l.sourceType === "arcgisDynamic" && l.id === key);
            const shouldKeep = definition &&
                (mapLayerStateRef.current?.visibility?.[key] ?? definition.visible ?? true);
            if (!shouldKeep) {
                map.removeLayer(dl);
                dynamicLayerRefs.current.delete(key);
            }
        }

        // Clear tile layers that are no longer present
        for (const [key, tl] of arcGisTileRefs.current) {
            const definition = resolvedLayers.find(l => l.sourceType === "arcgisTile" && l.id === key);
            const shouldKeep = definition &&
                (mapLayerStateRef.current?.visibility?.[key] ?? definition.visible ?? true);
            if (!shouldKeep) {
                map.removeLayer(tl);
                arcGisTileRefs.current.delete(key);
            }
        }

        // Resolve effective order (viewer order or layer order)
        const mapState = context.state.mapLayerState[id];
        const viewerOrder = mapState?.order;
        const completeViewerOrder = viewerOrder
            ? [
                ...viewerOrder.filter(layerId => resolvedLayers.some(layer => layer.id === layerId)),
                ...resolvedLayers
                    .filter(layer => !viewerOrder.includes(layer.id))
                    .sort((a, b) => a.order - b.order)
                    .map(layer => layer.id),
            ]
            : undefined;
        const sortedLayers = [...resolvedLayers].sort((a, b) => {
            if (!completeViewerOrder) return a.order - b.order;
            return completeViewerOrder.indexOf(a.id) - completeViewerOrder.indexOf(b.id);
        });

        // Create deterministic layer and label panes for z-ordering.
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
            const labelPaneName = `${paneName}-labels`;
            if (!map.getPane(labelPaneName)) map.createPane(labelPaneName);
            const labelPane = map.getPane(labelPaneName);
            if (labelPane) labelPane.style.zIndex = String(paneZ++);
        }

        for (const layer of sortedLayers) {
            const isVisible = mapState?.visibility?.[layer.id] ?? layer.visible ?? true;
            if (!isVisible) continue;

            const layerOpacity = mapState?.opacity?.[layer.id] ?? layer.opacity ?? 1;

            // ── Handle tile layers ───────────────────────────────
            if (layer.sourceType === "arcgisTile" && layer.tile) {
                const existingTile = arcGisTileRefs.current.get(layer.id);
                if (existingTile) {
                    existingTile.setOpacity(layerOpacity);
                    if (!map.hasLayer(existingTile)) existingTile.addTo(map);
                    continue;
                }
                try {
                    const policy = checkHostPolicy(layer.tile.url);
                    if (!policy.allowed) throw new Error(policy.reason ?? "Tile host is blocked.");
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
                    onLayerRuntimeStateChangeRef.current?.(layer.id, { warning: `Tile layer error: ${msg}` });
                }
                continue;
            }

            // ── Handle dynamic layers ────────────────────────────
            if (layer.sourceType === "arcgisDynamic" && layer.dynamic) {
                const existingDynamic = dynamicLayerRefs.current.get(layer.id);
                if (existingDynamic) {
                    existingDynamic.setOpacity(layerOpacity);
                    if (!map.hasLayer(existingDynamic)) existingDynamic.addTo(map);
                } else {
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
                            pane: paneNamesRef.current.get(layer.id),
                        }, (state) => {
                            onLayerRuntimeStateChangeRef.current?.(layer.id, {
                                loading: state.loading,
                                ...(state.error ? { error: state.error, warning: state.error } : {}),
                            });
                        });
                        dynamicLayer.addTo(map);
                        dynamicLayerRefs.current.set(layer.id, dynamicLayer);
                    } catch (err) {
                        const msg = err instanceof Error ? err.message : String(err);
                        onLayerRuntimeStateChangeRef.current?.(layer.id, { error: msg, warning: `Dynamic layer error: ${msg}` });
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

            const layerInteractionPolicy = resolveInteractionPolicy({
                ...component,
                interaction: layer.interaction ?? component.interaction,
            }, runtimeConfig, "dataPoint");

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
                    leafletLayer.bindTooltip(
                        createResolvedTooltipElement(feature, layer.tooltip, layer.name)
                    );
                }

                // ── Popup ────────────────────────────────────────
                if (leafletLayer && layer.popup?.enabled) {
                    let popupCleanup: (() => void) | undefined;
                    leafletLayer.bindPopup(() => {
                        popupCleanup?.();
                        const rendered = renderResolvedPopup(layer.popup!, feature, {
                            executeAction: (action) => {
                                if (action.uiAction) context.executeUiAction(action.uiAction);
                            },
                        });
                        popupCleanup = rendered.cleanup;
                        return rendered.element;
                    });
                    leafletLayer.on("popupclose", () => {
                        popupCleanup?.();
                        popupCleanup = undefined;
                    });
                }

                // ── Click interaction ────────────────────────────
                if (leafletLayer) {
                    leafletLayer.on("click", (event: L.LeafletMouseEvent) => {
                        const multiSelect = Boolean(event.originalEvent?.ctrlKey || event.originalEvent?.metaKey);

                        if (feature.powerBiRowIndices.length > 0 && feature.powerBiRowKeys.length > 0) {
                            // Power BI or joined feature
                            const field = layerInteractionPolicy.field;
                            executeComponentInteraction(
                                layerInteractionPolicy,
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
                            const alreadySelected = selectedMapIdsRef.current.includes(feature.id);
                            const mode = multiSelect || alreadySelected ? "toggle" : "replace";
                            context.dispatch({
                                type: "selectMapFeatures",
                                mapId: id,
                                featureIds: [feature.id],
                                selectionMode: mode,
                            });
                        }
                    });
                }

            }

            vectorLayerRefs.current.set(layer.id, layerGroup);

            if (layer.labels) {
                const labelsEnabled = mapState?.labels?.[layer.id] ?? layer.labels.enabled;
                const paneName = `${paneNamesRef.current.get(layer.id)}-labels`;
                const labelRuntime = createResolvedMapLabels(map, layer, {
                    pane: paneName,
                    visible: labelsEnabled,
                });
                labelLayerRefs.current.set(layer.id, labelRuntime);
                for (const warning of labelRuntime.warnings) {
                    onLayerRuntimeStateChangeRef.current?.(layer.id, { warning });
                }
            }
        }

        // ── Fit bounds ───────────────────────────────────────────
        const viewDef = component.view ?? {};
        const fitMode = viewDef.fitMode ?? "data";
        if (fitMode !== "none" && dataBounds.isValid() && hasAnyFeatures && !hasFitRef.current) {
            runProgrammaticMove(map, programmaticMoveCountRef, () => {
                map.fitBounds(dataBounds.pad(viewDef.fitPadding ?? 0.08), {
                    maxZoom: viewDef.maxZoom ?? 14,
                    animate: false,
                });
            });
            hasFitRef.current = true;
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

function runProgrammaticMove(
    map: L.Map,
    counter: { current: number },
    move: () => void
): void {
    const beforeCenter = map.getCenter();
    const beforeZoom = map.getZoom();
    counter.current++;
    move();
    const afterCenter = map.getCenter();
    if (beforeZoom === map.getZoom() && beforeCenter.equals(afterCenter) && counter.current > 0) {
        counter.current--;
    }
}
