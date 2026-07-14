import * as L from "leaflet";
import "leaflet.markercluster";
import { useEffect, useRef, useMemo } from "preact/hooks";
import { MapComponent } from "../../schema/hyperpbiSchema";
import { useRenderContext } from "../../render/RenderContext";
import {
  externalServiceAccess,
  resolveProviderPolicy,
} from "../../providers/providerPolicy";
import { executeComponentInteraction } from "../../interactions/componentInteraction";
import { createInteractionPayload } from "../../interactions/interactionPayload";
import { resolveInteractionPolicy } from "../../interactions/interactionPolicy";
import {
  featureStyle,
  featureStyleWithDomain,
  computeFeatureDomain,
} from "../../maps/renderers/mapFeatureSymbol";
import {
  createResolvedTooltipElement,
  renderResolvedPopup,
} from "./ResolvedMapPopup";
import {
  createResolvedMapLabels,
  type ResolvedMapLabelRuntime,
} from "./ResolvedMapLabels";
import {
  createArcGisDynamicLayer,
  buildArcGisTileUrl,
  type ArcGisDynamicLeafletLayer,
} from "../../maps/arcgis/arcGisDynamicLayer";
import { checkHostPolicy } from "../../maps/arcgis/arcGisHostPolicy";
import type { HostPolicyResult } from "../../maps/arcgis/arcGisHostPolicy";
import type {
  ResolvedMapLayer,
  ResolvedMapFeature,
  ResolvedMapRenderer,
} from "../../maps/model/resolvedMapTypes";
import type { LeafletFeatureStyle } from "../../maps/renderers/mapFeatureSymbol";
import type { MapViewportState } from "./MapBlock";
import type { GeocoderSearchResult } from "../../providers/providerTypes";
import { createLeafletPointLayer } from "./createLeafletPointLayer";
import { featureAttribute } from "../../maps/attributes/mapFeatureAttributes";
import { formatFeatureValue } from "../../maps/model/mapFeatureValue";
import { normalizeFitPadding } from "../../maps/view/mapFitPadding";

export interface LeafletMapController {
  home(): void;
  zoomToSelection(): void;
  zoomToLayer(layerId: string): void;
  goToBookmark(bookmarkId: string): void;
  showSearchResult(result: GeocoderSearchResult): void;
  clearSearchResult(): void;
  invalidateSize(): void;
}

export function LeafletMap({
  component,
  resolvedLayers,
  onViewportChange,
  onControllerReady,
  onLayerRuntimeStateChange,
}: {
  component: MapComponent;
  resolvedLayers: ResolvedMapLayer[];
  onViewportChange?: (viewport: MapViewportState) => void;
  onControllerReady?: (controller: LeafletMapController) => void;
  onLayerRuntimeStateChange?: (
    layerId: string,
    update: {
      loading?: boolean;
      error?: string;
      warning?: string;
      renderMs?: number;
    },
  ) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const basemapRef = useRef<L.TileLayer | null>(null);
  const vectorLayerRefs = useRef<Map<string, L.LayerGroup>>(new Map());
  const arcGisTileRefs = useRef<Map<string, L.TileLayer>>(new Map());
  const dynamicLayerRefs = useRef<Map<string, ArcGisDynamicLeafletLayer>>(
    new Map(),
  );
  const labelLayerRefs = useRef<Map<string, ResolvedMapLabelRuntime>>(
    new Map(),
  );
  const searchMarkerRef = useRef<L.CircleMarker | null>(null);
  const paneNamesRef = useRef<Map<string, string>>(new Map());
  const reportedRenderSignaturesRef = useRef<Map<string, string>>(new Map());
  const authoredViewSignatureRef = useRef("");
  const hasFitRef = useRef(false);
  const programmaticMoveCountRef = useRef(0);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const context = useRenderContext();
  const { settings, config: runtimeConfig, webAccessAvailable } = context;
  const id = component.id ?? "map";
  const resolvedLayersRef = useRef(resolvedLayers);
  const componentRef = useRef(component);
  const selectedRowKeysRef = useRef(
    context.state.componentSelectedRowKeys[id] ?? [],
  );
  const selectedMapIdsRef = useRef(
    context.state.mapSelectedFeatureIds[id] ?? [],
  );
  const mapLayerStateRef = useRef(context.state.mapLayerState[id]);
  const onViewportChangeRef = useRef(onViewportChange);
  const onControllerReadyRef = useRef(onControllerReady);
  const onLayerRuntimeStateChangeRef = useRef(onLayerRuntimeStateChange);
  const settingsMapRef = useRef(settings.map);

  resolvedLayersRef.current = resolvedLayers;
  componentRef.current = component;
  selectedRowKeysRef.current = context.state.componentSelectedRowKeys[id] ?? [];
  selectedMapIdsRef.current = context.state.mapSelectedFeatureIds[id] ?? [];
  mapLayerStateRef.current = context.state.mapLayerState[id];
  onViewportChangeRef.current = onViewportChange;
  onControllerReadyRef.current = onControllerReady;
  onLayerRuntimeStateChangeRef.current = onLayerRuntimeStateChange;
  settingsMapRef.current = settings.map;

  // ── Precompute renderer domains ──────────────────────────────────
  const rendererDomains = useMemo(() => {
    const domains = new Map<string, [number, number] | null>();
    for (const layer of resolvedLayers) {
      const r = layer.renderer as ResolvedMapRenderer;
      if (r.type === "continuousColor" || r.type === "proportionalSize") {
        const field = r.field ?? r.weightField;
        if (field) {
          domains.set(
            layer.id,
            computeFeatureDomain(
              layer.features,
              field,
              r.fieldSource ?? "joined",
            ),
          );
        }
      }
    }
    return domains;
  }, [resolvedLayers]);

  // ── Initialize map once ──────────────────────────────────────────
  useEffect(() => {
    if (!ref.current) return;

    const view = component.view ?? {};
    const mapCenter: [number, number] = view.center ?? settings.map.center;
    const mapZoom = view.zoom ?? settings.map.zoom;
    const map = L.map(ref.current, {
      zoomControl: true,
      attributionControl: true,
      preferCanvas: true,
      minZoom: view.minZoom,
      maxZoom: view.maxZoom,
    }).setView(mapCenter, mapZoom);

    mapRef.current = map;
    authoredViewSignatureRef.current = JSON.stringify([
      mapCenter[0],
      mapCenter[1],
      mapZoom,
    ]);
    hasFitRef.current = false;
    const searchPaneName = `hp-${id}-search-result`.replace(
      /[^a-zA-Z0-9_-]/g,
      "_",
    );
    if (!map.getPane(searchPaneName)) map.createPane(searchPaneName);
    const searchPane = map.getPane(searchPaneName);
    if (searchPane) searchPane.style.zIndex = "900";

    // ── Controller ──────────────────────────────────────────
    const controller: LeafletMapController = {
      home() {
        const currentComponent = componentRef.current;
        const center =
          currentComponent.view?.center ?? settingsMapRef.current.center;
        const zoom = currentComponent.view?.zoom ?? settingsMapRef.current.zoom;
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
            const isPbSelected = feat.powerBiRowKeys.some((k) =>
              selRowKeys.includes(k),
            );
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
                  const coordinates = (feat.geometry as GeoJSON.Point)
                    .coordinates;
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
              map.setView(
                selectedPoints[0],
                Math.min(maxZoom, Math.max(map.getZoom(), 14)),
                { animate: false },
              );
            } else {
              map.fitBounds(
                selBounds.pad(normalizeFitPadding(currentView.fitPadding)),
                { maxZoom, animate: false },
              );
            }
          });
        }
      },
      zoomToLayer(layerId) {
        const layer = resolvedLayersRef.current.find(
          (candidate) => candidate.id === layerId,
        );
        if (!layer) return;
        const bounds = boundsForFeatures(layer.features);
        if (!bounds.isValid()) return;
        const currentView = componentRef.current.view ?? {};
        runProgrammaticMove(map, programmaticMoveCountRef, () => {
          if (bounds.getSouthWest().equals(bounds.getNorthEast()))
            map.setView(
              bounds.getCenter(),
              Math.min(currentView.maxZoom ?? 18, 14),
              { animate: false },
            );
          else
            map.fitBounds(
              bounds.pad(normalizeFitPadding(currentView.fitPadding)),
              { maxZoom: currentView.maxZoom ?? 18, animate: false },
            );
        });
      },
      goToBookmark(bookmarkId) {
        const bookmark = componentRef.current.bookmarks?.find(
          (candidate) => candidate.id === bookmarkId,
        );
        if (!bookmark) return;
        runProgrammaticMove(map, programmaticMoveCountRef, () =>
          map.setView(bookmark.center, bookmark.zoom, { animate: false }),
        );
      },
      showSearchResult(result) {
        if (
          !Number.isFinite(result.latitude) ||
          !Number.isFinite(result.longitude)
        )
          return;
        if (searchMarkerRef.current) map.removeLayer(searchMarkerRef.current);
        searchMarkerRef.current = null;
        if (componentRef.current.search?.showResultMarker !== false) {
          const marker = L.circleMarker([result.latitude, result.longitude], {
            radius: 7,
            color: "#ffffff",
            weight: 2,
            fillColor: "#d63939",
            fillOpacity: 1,
            opacity: 1,
            interactive: false,
            pane: searchPaneName,
          }).addTo(map);
          if (result.label)
            marker.bindTooltip(result.label, {
              direction: "top",
              permanent: true,
              offset: [0, -8],
            });
          searchMarkerRef.current = marker;
        }
        const bounds = result.bounds;
        const validBounds =
          bounds &&
          bounds.length === 4 &&
          bounds.every(Number.isFinite) &&
          bounds[0] < bounds[2] &&
          bounds[1] < bounds[3];
        runProgrammaticMove(map, programmaticMoveCountRef, () => {
          if (validBounds) {
            const resultBounds = L.latLngBounds([]);
            resultBounds.extend([bounds[1], bounds[0]]);
            resultBounds.extend([bounds[3], bounds[2]]);
            map.fitBounds(resultBounds, {
              animate: false,
              maxZoom: componentRef.current.view?.maxZoom ?? 18,
            });
          } else {
            const requestedZoom = componentRef.current.search?.zoom ?? 16;
            const minZoom = componentRef.current.view?.minZoom ?? 0;
            const maxZoom = componentRef.current.view?.maxZoom ?? 18;
            map.setView(
              [result.latitude, result.longitude],
              Math.max(minZoom, Math.min(maxZoom, requestedZoom)),
              { animate: false },
            );
          }
        });
      },
      clearSearchResult() {
        if (searchMarkerRef.current) map.removeLayer(searchMarkerRef.current);
        searchMarkerRef.current = null;
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
      if (searchMarkerRef.current) map.removeLayer(searchMarkerRef.current);
      searchMarkerRef.current = null;
      debounceTimerRef.current = setTimeout(() => {
        const bounds = map.getBounds();
        const size = map.getSize ? map.getSize() : { x: 0, y: 0 };
        onViewportChangeRef.current?.({
          bounds: [
            bounds.getWest(),
            bounds.getSouth(),
            bounds.getEast(),
            bounds.getNorth(),
          ],
          center: [map.getCenter().lat, map.getCenter().lng],
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

  // ── Reactive basemap synchronization ────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (basemapRef.current) {
      map.removeLayer(basemapRef.current);
      basemapRef.current = null;
    }
    const basemap = component.basemap ?? {};
    const basemapType = basemap.type ?? "osm";
    if (basemap.visible === false || basemapType === "none") return;
    const providerPolicy = resolveProviderPolicy(
      runtimeConfig.providers,
      context.providerAccess ?? webAccessAvailable,
    );
    if (!providerPolicy.tilesAllowed) {
      onLayerRuntimeStateChangeRef.current?.("__basemap__", {
        warning:
          "Basemap tiles are unavailable under the current provider-access policy.",
      });
      return;
    }
    let url = "";
    let attribution = basemap.attribution ?? "";
    if (basemapType === "osm") {
      url = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
      attribution ||=
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';
    } else {
      url = basemap.url ?? "";
      if (!/^https:\/\//i.test(url)) {
        if (url)
          onLayerRuntimeStateChangeRef.current?.("__basemap__", {
            warning:
              "Only HTTPS custom and ArcGIS tile basemaps are supported.",
          });
        return;
      }
      const access = externalServiceAccess(
        context.providerAccess,
        url,
        webAccessAvailable,
      );
      const hostPolicy: HostPolicyResult = checkHostPolicy(url);
      if (!access.allowed || !hostPolicy.allowed) {
        onLayerRuntimeStateChangeRef.current?.("__basemap__", {
          warning:
            "The configured basemap origin is unavailable under the current access policy.",
        });
        return;
      }
    }
    if (!url) return;
    const tile = L.tileLayer(url, {
      maxZoom: basemap.maxZoom ?? 19,
      attribution,
    });
    tile.addTo(map);
    basemapRef.current = tile;
    return () => {
      if (basemapRef.current === tile) basemapRef.current = null;
      if (map.hasLayer(tile)) map.removeLayer(tile);
    };
  }, [
    component.basemap?.type,
    component.basemap?.url,
    component.basemap?.attribution,
    component.basemap?.maxZoom,
    component.basemap?.visible,
    runtimeConfig.providers,
    context.providerAccess,
    webAccessAvailable,
  ]);

  // ── Reactive authored view synchronization ─────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const center = component.view?.center ?? settings.map.center;
    const zoom = component.view?.zoom ?? settings.map.zoom;
    map.setMinZoom?.(component.view?.minZoom ?? 0);
    map.setMaxZoom?.(component.view?.maxZoom ?? 18);
    const signature = JSON.stringify([center[0], center[1], zoom]);
    if (authoredViewSignatureRef.current === signature) return;
    authoredViewSignatureRef.current = signature;
    hasFitRef.current = true;
    runProgrammaticMove(map, programmaticMoveCountRef, () =>
      map.setView(center, zoom, { animate: false }),
    );
  }, [
    component.view?.center?.[0],
    component.view?.center?.[1],
    component.view?.zoom,
    component.view?.minZoom,
    component.view?.maxZoom,
    settings.map.center[0],
    settings.map.center[1],
    settings.map.zoom,
  ]);

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
      const definition = resolvedLayers.find(
        (l) => l.sourceType === "arcgisDynamic" && l.id === key,
      );
      const shouldKeep =
        definition &&
        (mapLayerStateRef.current?.visibility?.[key] ??
          definition.visible ??
          true);
      if (!shouldKeep) {
        map.removeLayer(dl);
        dynamicLayerRefs.current.delete(key);
      }
    }

    // Clear tile layers that are no longer present
    for (const [key, tl] of arcGisTileRefs.current) {
      const definition = resolvedLayers.find(
        (l) => l.sourceType === "arcgisTile" && l.id === key,
      );
      const shouldKeep =
        definition &&
        (mapLayerStateRef.current?.visibility?.[key] ??
          definition.visible ??
          true);
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
          ...viewerOrder.filter((layerId) =>
            resolvedLayers.some((layer) => layer.id === layerId),
          ),
          ...resolvedLayers
            .filter((layer) => !viewerOrder.includes(layer.id))
            .sort((a, b) => a.order - b.order)
            .map((layer) => layer.id),
        ]
      : undefined;
    const sortedLayers = [...resolvedLayers].sort((a, b) => {
      if (!completeViewerOrder) return a.order - b.order;
      return (
        completeViewerOrder.indexOf(a.id) - completeViewerOrder.indexOf(b.id)
      );
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
      const isVisible =
        mapState?.visibility?.[layer.id] ?? layer.visible ?? true;
      if (!isVisible) continue;
      const layerRenderStarted = globalThis.performance?.now?.() ?? Date.now();
      const renderSignature = [
        layer.features.length,
        layer.diagnostics.sourceResolutionMs,
        layer.diagnostics.rendererCalculationMs,
        layer.diagnostics.requestMs,
        layer.diagnostics.joinMs,
      ].join(":");
      const reportLayerRender = () => {
        if (
          reportedRenderSignaturesRef.current.get(layer.id) === renderSignature
        )
          return;
        reportedRenderSignaturesRef.current.set(layer.id, renderSignature);
        onLayerRuntimeStateChangeRef.current?.(layer.id, {
          renderMs:
            (globalThis.performance?.now?.() ?? Date.now()) -
            layerRenderStarted,
        });
      };
      const visibleAtZoom = layerVisibleAtZoom(layer, map.getZoom());

      const layerOpacity = clampOpacity(
        mapState?.opacity?.[layer.id] ?? layer.opacity ?? 1,
      );

      // ── Handle tile layers ───────────────────────────────
      if (layer.sourceType === "arcgisTile" && layer.tile) {
        const existingTile = arcGisTileRefs.current.get(layer.id);
        if (existingTile) {
          existingTile.setOpacity(layerOpacity);
          if (visibleAtZoom && !map.hasLayer(existingTile))
            existingTile.addTo(map);
          else if (!visibleAtZoom && map.hasLayer(existingTile))
            map.removeLayer(existingTile);
          reportLayerRender();
          continue;
        }
        try {
          const access = externalServiceAccess(
            context.providerAccess,
            layer.tile.url,
            webAccessAvailable,
          );
          if (!access.allowed)
            throw new Error(
              access.reason ?? "ArcGIS tile service access is unavailable.",
            );
          const policy = checkHostPolicy(layer.tile.url);
          if (!policy.allowed)
            throw new Error(policy.reason ?? "Tile host is blocked.");
          const tileUrl = buildArcGisTileUrl(layer.tile.url);
          const tileLayer = L.tileLayer(tileUrl, {
            maxZoom: layer.tile.maxZoom ?? 19,
            minZoom: layer.tile.minZoom,
            opacity: layerOpacity,
            attribution: layer.tile.attribution ?? "",
            pane: paneNamesRef.current.get(layer.id),
          });
          if (visibleAtZoom) tileLayer.addTo(map);
          arcGisTileRefs.current.set(layer.id, tileLayer);
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          onLayerRuntimeStateChangeRef.current?.(layer.id, {
            warning: `Tile layer error: ${msg}`,
          });
        }
        reportLayerRender();
        continue;
      }

      // ── Handle dynamic layers ────────────────────────────
      if (layer.sourceType === "arcgisDynamic" && layer.dynamic) {
        const existingDynamic = dynamicLayerRefs.current.get(layer.id);
        if (existingDynamic) {
          existingDynamic.setOpacity(layerOpacity);
          if (visibleAtZoom && !map.hasLayer(existingDynamic))
            existingDynamic.addTo(map);
          else if (!visibleAtZoom && map.hasLayer(existingDynamic))
            map.removeLayer(existingDynamic);
        } else {
          try {
            const access = externalServiceAccess(
              context.providerAccess,
              layer.dynamic.url,
              webAccessAvailable,
            );
            if (!access.allowed)
              throw new Error(
                access.reason ??
                  "ArcGIS dynamic service access is unavailable.",
              );
            const dynamicLayer = createArcGisDynamicLayer(
              {
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
              },
              (state) => {
                onLayerRuntimeStateChangeRef.current?.(layer.id, {
                  loading: state.loading,
                  ...(state.error
                    ? { error: state.error, warning: state.error }
                    : {}),
                });
              },
            );
            if (visibleAtZoom) dynamicLayer.addTo(map);
            dynamicLayerRefs.current.set(layer.id, dynamicLayer);
          } catch (err) {
            const msg = err instanceof Error ? err.message : String(err);
            onLayerRuntimeStateChangeRef.current?.(layer.id, {
              error: msg,
              warning: `Dynamic layer error: ${msg}`,
            });
          }
        }
        reportLayerRender();
        continue;
      }

      // ── Render vector features ───────────────────────────
      if (layer.features.length === 0) {
        reportLayerRender();
        continue;
      }

      const layerPane = paneNamesRef.current.get(layer.id);
      const layerGroup = L.featureGroup();
      if (visibleAtZoom) layerGroup.addTo(map);
      const renderer = layer.renderer as ResolvedMapRenderer;
      const domain = rendererDomains.get(layer.id) ?? null;

      const explicitLayers = Boolean(component.layers?.length);
      const useCluster =
        renderer.type === "cluster" ||
        (!explicitLayers &&
          (component.settings?.clusterPoints ?? settings.map.clusterPoints));
      let clusterValueWarningReported = false;

      const cluster = useCluster
        ? L.markerClusterGroup({
            showCoverageOnHover: renderer.showCoverageOnHover ?? false,
            maxClusterRadius: renderer.clusterRadius ?? 44,
            disableClusteringAtZoom: renderer.disableAtZoom,
            iconCreateFunction: (clusterGroup) => {
              const childMarkers = clusterGroup.getAllChildMarkers();
              let label = String(childMarkers.length);
              if (renderer.clusterLabel === "sum") {
                const field = renderer.aggregateField;
                const source =
                  renderer.fieldSource ?? resolvedDefaultAttributeSource(layer);
                const values = field
                  ? childMarkers.map((marker) => {
                      const feature = (
                        marker as L.Marker & {
                          __hpFeature?: ResolvedMapFeature;
                        }
                      ).__hpFeature;
                      const value = feature
                        ? featureAttribute(feature, field, source)
                        : undefined;
                      const numeric =
                        typeof value === "number" ? value : Number(value);
                      return Number.isFinite(numeric) ? numeric : undefined;
                    })
                  : [];
                const numeric = values.filter(
                  (value): value is number => value !== undefined,
                );
                if (!field || numeric.length !== childMarkers.length) {
                  if (!clusterValueWarningReported)
                    onLayerRuntimeStateChangeRef.current?.(layer.id, {
                      warning: `Cluster sum ignored ${childMarkers.length - numeric.length} missing or nonnumeric value(s)${field ? ` from ${source}.${field}` : " because aggregateField is missing"}.`,
                    });
                  clusterValueWarningReported = true;
                }
                const sum = numeric.reduce((total, value) => total + value, 0);
                label = formatFeatureValue(
                  sum,
                  renderer.format,
                  "number",
                ).slice(0, 24);
              }
              return L.divIcon({
                className: "hp-map-cluster-icon",
                html: `<span>${escapeClusterLabel(label)}</span>`,
              });
            },
          })
        : null;
      if (cluster) layerGroup.addLayer(cluster);

      // Selection state
      const selectedRowKeys = context.state.componentSelectedRowKeys[id] ?? [];
      const selectedMapIds = context.state.mapSelectedFeatureIds[id] ?? [];

      const layerInteractionPolicy = resolveInteractionPolicy(
        {
          ...component,
          interaction: layer.interaction ?? component.interaction,
        },
        runtimeConfig,
        "dataPoint",
      );

      for (const feature of layer.features) {
        // Check selection: Power BI or map-local
        const isPbSelected = feature.powerBiRowKeys.some((k) =>
          selectedRowKeys.includes(k),
        );
        const isLocalSelected = selectedMapIds.includes(feature.id);
        const isSelected = isPbSelected || isLocalSelected;

        // Compute style
        let style: LeafletFeatureStyle;
        if (
          domain &&
          (renderer.type === "continuousColor" ||
            renderer.type === "proportionalSize")
        ) {
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
        if (
          feature.lat !== null &&
          feature.lon !== null &&
          feature.geometryType === "point"
        ) {
          leafletLayer = createLeafletPointLayer(
            [feature.lat, feature.lon],
            style,
            layerPane,
            layerOpacity,
            feature.labelValue ?? feature.id,
          );
          (
            leafletLayer as L.Layer & { __hpFeature?: ResolvedMapFeature }
          ).__hpFeature = feature;
          if (cluster) cluster.addLayer(leafletLayer);
          else layerGroup.addLayer(leafletLayer);
          dataBounds.extend([feature.lat, feature.lon]);
          hasAnyFeatures = true;
        }
        // Geometry features
        else if (feature.geometry?.type === "Point") {
          const coordinates = (
            feature.geometry as unknown as { coordinates: [number, number] }
          ).coordinates;
          leafletLayer = createLeafletPointLayer(
            [coordinates[1], coordinates[0]],
            style,
            layerPane,
            layerOpacity,
            feature.labelValue ?? feature.id,
          );
          (
            leafletLayer as L.Layer & { __hpFeature?: ResolvedMapFeature }
          ).__hpFeature = feature;
          if (cluster) cluster.addLayer(leafletLayer);
          else layerGroup.addLayer(leafletLayer);
          dataBounds.extend([coordinates[1], coordinates[0]]);
          hasAnyFeatures = true;
        } else if (feature.geometry) {
          leafletLayer = L.geoJSON(feature.geometry, {
            style: () => ({
              color: style.color,
              fillColor: style.fillColor,
              fillOpacity: clampOpacity(style.fillOpacity * layerOpacity),
              opacity: clampOpacity(style.opacity * layerOpacity),
              weight: style.weight,
              dashArray: style.dashArray,
            }),
            pointToLayer: (_geoFeature, latlng) => {
              const point = createLeafletPointLayer(
                latlng,
                style,
                layerPane,
                layerOpacity,
                feature.labelValue ?? feature.id,
              );
              (
                point as L.Layer & { __hpFeature?: ResolvedMapFeature }
              ).__hpFeature = feature;
              return point as L.Marker;
            },
            pane: layerPane,
          }).addTo(layerGroup);
          const geoBounds = (leafletLayer as L.GeoJSON).getBounds();
          if (geoBounds.isValid()) dataBounds.extend(geoBounds);
          hasAnyFeatures = true;
        }

        // ── Tooltip ──────────────────────────────────────
        if (leafletLayer && layer.tooltip?.enabled !== false) {
          leafletLayer.bindTooltip(
            createResolvedTooltipElement(feature, layer.tooltip, layer.name),
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
            const multiSelect = Boolean(
              event.originalEvent?.ctrlKey || event.originalEvent?.metaKey,
            );

            if (
              feature.powerBiRowIndices.length > 0 &&
              feature.powerBiRowKeys.length > 0
            ) {
              // Power BI or joined feature
              const field = layerInteractionPolicy.field;
              const interactionContext = context.selectSourceRows
                ? {
                    ...context,
                    sourceRows: context.powerBiSourceRows ?? context.sourceRows,
                    sourceRowKeys:
                      context.powerBiSourceRowKeys ?? context.sourceRowKeys,
                    selectExternal: context.selectSourceRows,
                  }
                : context;
              executeComponentInteraction(
                layerInteractionPolicy,
                createInteractionPayload(component, {
                  rowIndices: feature.powerBiRowIndices,
                  rowKeys: feature.powerBiRowKeys,
                  sourceRowKeys: interactionContext.sourceRowKeys,
                  field,
                  value: field
                    ? featureAttribute(
                        feature,
                        field,
                        layer.interaction?.fieldSource ??
                          resolvedDefaultAttributeSource(layer),
                      )
                    : undefined,
                }),
                interactionContext,
                { trigger: "click", multiSelect, event: event.originalEvent },
              );
            } else {
              // Reference-only feature: map-local selection
              const alreadySelected = selectedMapIdsRef.current.includes(
                feature.id,
              );
              const mode =
                multiSelect || alreadySelected ? "toggle" : "replace";
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
        const labelsEnabled =
          mapState?.labels?.[layer.id] ?? layer.labels.enabled;
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
      reportLayerRender();
    }

    // ── Fit bounds ───────────────────────────────────────────
    const viewDef = component.view ?? {};
    const fitMode = viewDef.fitMode ?? "data";
    const firstVisibleLayer = sortedLayers.find(
      (layer) =>
        (mapState?.visibility?.[layer.id] ?? layer.visible ?? true) &&
        layer.features.length > 0,
    );
    const effectiveFitBounds =
      fitMode === "firstLayer" && firstVisibleLayer
        ? boundsForFeatures(firstVisibleLayer.features)
        : dataBounds;
    if (
      fitMode !== "none" &&
      effectiveFitBounds.isValid() &&
      hasAnyFeatures &&
      !hasFitRef.current
    ) {
      runProgrammaticMove(map, programmaticMoveCountRef, () => {
        const minZoom = viewDef.minZoom ?? 1;
        const maxZoom = viewDef.maxZoom ?? 18;
        if (
          effectiveFitBounds
            .getSouthWest()
            .equals(effectiveFitBounds.getNorthEast())
        )
          map.setView(
            effectiveFitBounds.getCenter(),
            Math.max(minZoom, Math.min(maxZoom, 14)),
            { animate: false },
          );
        else
          map.fitBounds(
            effectiveFitBounds.pad(normalizeFitPadding(viewDef.fitPadding)),
            { maxZoom, animate: false },
          );
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
    context.providerAccess,
    webAccessAvailable,
    rendererDomains,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const sync = () => {
      const zoom = map.getZoom();
      for (const layer of resolvedLayersRef.current) {
        const show =
          (mapLayerStateRef.current?.visibility?.[layer.id] ??
            layer.visible ??
            true) &&
          layerVisibleAtZoom(layer, zoom);
        const candidates: L.Layer[] = [];
        const vector = vectorLayerRefs.current.get(layer.id);
        if (vector) candidates.push(vector);
        const tile = arcGisTileRefs.current.get(layer.id);
        if (tile) candidates.push(tile);
        const dynamic = dynamicLayerRefs.current.get(layer.id);
        if (dynamic) candidates.push(dynamic);
        for (const candidate of candidates) {
          if (show && !map.hasLayer(candidate)) candidate.addTo(map);
          else if (!show && map.hasLayer(candidate)) map.removeLayer(candidate);
        }
      }
    };
    map.on("zoomend", sync);
    sync();
    return () => map.off("zoomend", sync);
  }, [resolvedLayers, context.state.mapLayerState[id]]);

  // Cleanup no longer needed — map instance tracked via ref
  // and cleaned up in the init effect's return.

  const height = Math.max(220, Math.min(2000, component.height ?? 420));
  return (
    <div
      ref={ref}
      class="hp-leaflet-container"
      style={{ height: `${height}px`, minHeight: "220px", width: "100%" }}
    />
  );
}

// ── Helpers ───────────────────────────────────────────────────────────

function runProgrammaticMove(
  map: L.Map,
  counter: { current: number },
  move: () => void,
): void {
  const beforeCenter = map.getCenter();
  const beforeZoom = map.getZoom();
  counter.current++;
  move();
  const afterCenter = map.getCenter();
  if (
    beforeZoom === map.getZoom() &&
    beforeCenter.equals(afterCenter) &&
    counter.current > 0
  ) {
    counter.current--;
  }
}

function clampOpacity(value: number): number {
  return Math.max(0, Math.min(1, Number.isFinite(value) ? value : 1));
}

function resolvedDefaultAttributeSource(
  layer: ResolvedMapLayer,
): "powerbi" | "service" | "joined" {
  if (layer.sourceType === "powerbi") return "powerbi";
  if (
    layer.sourceType === "arcgisFeature" &&
    layer.features.some((feature) => feature.powerBiRowIndices.length > 0)
  )
    return "joined";
  return "service";
}

function escapeClusterLabel(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function layerVisibleAtZoom(layer: ResolvedMapLayer, zoom: number): boolean {
  const min = layer.visibility?.minZoom;
  const max = layer.visibility?.maxZoom;
  return (
    (min === undefined || zoom >= min) && (max === undefined || zoom <= max)
  );
}

function boundsForFeatures(
  features: readonly ResolvedMapFeature[],
): L.LatLngBounds {
  const bounds = L.latLngBounds([]);
  for (const feature of features) {
    if (feature.lat !== null && feature.lon !== null)
      bounds.extend([feature.lat, feature.lon]);
    else if (feature.geometry) {
      const geometryBounds = L.geoJSON(feature.geometry).getBounds();
      if (geometryBounds.isValid()) bounds.extend(geometryBounds);
    }
  }
  return bounds;
}
