import * as L from "leaflet";
import "leaflet.markercluster";
import { useEffect, useRef, useMemo, useState } from "preact/hooks";
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
import {
  createLeafletPointLayer,
  updateLeafletPointLayerStyle,
} from "./createLeafletPointLayer";
import { featureAttribute } from "../../maps/attributes/mapFeatureAttributes";
import { formatFeatureValue } from "../../maps/model/mapFeatureValue";
import { normalizeFitPadding } from "../../maps/view/mapFitPadding";
import {
  synchronizeLeafletExternalLayer,
  type MountedDynamicLayer,
  type MountedTileLayer,
} from "./runtime/useLeafletExternalLayers";
import {
  resolvedLayerStructuralRevision,
  resolveMapFeatureRevision,
  stableMapRevision,
  type ResolvedMapFeatureRevision,
} from "./runtime/mapFeatureRevisions";
import {
  resolvedMapFeatureKey,
  type MapFeatureKey,
} from "../../maps/model/mapFeatureIdentity";
import {
  buildMapFeatureSpatialIndex,
  geometryGeographicBounds,
  LOCAL_MAP_FEATURE_CULL_THRESHOLD,
  queryMapFeatureSpatialIndex,
  resolvedFeatureGeographicBounds,
  type GeographicBounds,
} from "../../maps/performance/mapFeatureSpatialIndex";

export interface LeafletMapController {
  home(): void;
  zoomToSelection(): void;
  zoomToLayer(layerId: string): void;
  goToBookmark(bookmarkId: string): void;
  showSearchResult(result: GeocoderSearchResult): void;
  clearSearchResult(): void;
  invalidateSize(): void;
}

export interface LeafletMapClickEvent {
  anchor: {
    lat: number;
    lon: number;
    containerX: number;
    containerY: number;
  };
  viewport: MapViewportState;
}

interface MountedFeatureLayer {
  featureKey: MapFeatureKey;
  featureId: string;
  layerId: string;
  leafletLayer: L.Layer;
  parentGroup: L.LayerGroup;
  feature: ResolvedMapFeature;
  layer: ResolvedMapLayer;
  revision: ResolvedMapFeatureRevision;
  popupCleanup?: () => void;
  eventCleanup?: () => void;
}

interface OpenMapPopupState {
  layerId: string;
  featureKey: MapFeatureKey;
}

export function LeafletMap({
  component,
  resolvedLayers,
  onViewportChange,
  onControllerReady,
  onLayerRuntimeStateChange,
  onMapClick,
  identifyHighlight,
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
      featureObjectsCreated?: number;
      featureObjectsPatched?: number;
      fullLayerRebuilds?: number;
    },
  ) => void;
  /** Return true when the background click starts an owned interaction. */
  onMapClick?: (event: LeafletMapClickEvent) => boolean;
  identifyHighlight?: GeoJSON.GeoJsonObject | null;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const basemapRef = useRef<L.TileLayer | null>(null);
  const vectorLayerRefs = useRef<Map<string, L.LayerGroup>>(new Map());
  const vectorGroupSignatureRefs = useRef<Map<string, string>>(new Map());
  const clusterLayerRefs = useRef<Map<string, L.MarkerClusterGroup>>(new Map());
  const featureLayerRefs = useRef<
    Map<string, Map<string, MountedFeatureLayer>>
  >(new Map());
  const openMapPopupStateRef = useRef<OpenMapPopupState | null>(null);
  const arcGisTileRefs = useRef<Map<string, MountedTileLayer>>(new Map());
  const dynamicLayerRefs = useRef<Map<string, MountedDynamicLayer>>(
    new Map(),
  );
  const externalLayerGenerationRef = useRef(0);
  const externalWarningSignaturesRef = useRef(new Set<string>());
  const labelLayerRefs = useRef<Map<string, ResolvedMapLabelRuntime>>(
    new Map(),
  );
  const labelSignatureRefs = useRef<Map<string, string>>(new Map());
  const searchMarkerRef = useRef<L.CircleMarker | null>(null);
  const identifyHighlightRef = useRef<L.GeoJSON | null>(null);
  const paneNamesRef = useRef<Map<string, string>>(new Map());
  const reportedRenderSignaturesRef = useRef<Map<string, string>>(new Map());
  const runtimeMetricsRef = useRef(
    new Map<
      string,
      { featureObjectsCreated: number; featureObjectsPatched: number; fullLayerRebuilds: number }
    >(),
  );
  const authoredViewSignatureRef = useRef("");
  const hasFitRef = useRef(false);
  const programmaticMoveCountRef = useRef(0);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const context = useRenderContext();
  const { settings, config: runtimeConfig, webAccessAvailable } = context;
  const id = component.id ?? "map";
  const resolvedLayersRef = useRef(resolvedLayers);
  const componentRef = useRef(component);
  const selectedRowKeysRef = useRef<ReadonlySet<string>>(
    new Set(context.state.componentSelectedRowKeys[id] ?? []),
  );
  const selectedMapIdsRef = useRef<ReadonlySet<string>>(
    new Set(context.state.mapInteractionState[id]?.selectedFeatureKeys ??
      context.state.mapSelectedFeatureIds[id] ?? []),
  );
  const mapLayerStateRef = useRef(context.state.mapLayerState[id]);
  const onViewportChangeRef = useRef(onViewportChange);
  const onControllerReadyRef = useRef(onControllerReady);
  const onLayerRuntimeStateChangeRef = useRef(onLayerRuntimeStateChange);
  const onMapClickRef = useRef(onMapClick);
  const settingsMapRef = useRef(settings.map);
  const renderContextRef = useRef(context);
  const runtimeConfigRef = useRef(runtimeConfig);

  const popupPaneName = `hp-${id}-popup`.replace(/[^a-zA-Z0-9_-]/g, "_");
  const tooltipPaneName = `hp-${id}-tooltip`.replace(
    /[^a-zA-Z0-9_-]/g,
    "_",
  );

  resolvedLayersRef.current = resolvedLayers;
  componentRef.current = component;
  selectedRowKeysRef.current = new Set(context.state.componentSelectedRowKeys[id] ?? []);
  selectedMapIdsRef.current = new Set(
    context.state.mapInteractionState[id]?.selectedFeatureKeys ??
      context.state.mapSelectedFeatureIds[id] ??
      [],
  );
  mapLayerStateRef.current = context.state.mapLayerState[id];
  onViewportChangeRef.current = onViewportChange;
  onControllerReadyRef.current = onControllerReady;
  onLayerRuntimeStateChangeRef.current = onLayerRuntimeStateChange;
  onMapClickRef.current = onMapClick;
  settingsMapRef.current = settings.map;
  renderContextRef.current = context;
  runtimeConfigRef.current = runtimeConfig;

  const [renderViewport, setRenderViewport] = useState<GeographicBounds | null>(null);
  const featureSpatialIndexes = useMemo(
    () => new Map(resolvedLayers
      .filter(layer => !isExternalLeafletLayer(layer))
      .map(layer => [layer.id, buildMapFeatureSpatialIndex(layer.features)] as const)),
    [resolvedLayers],
  );
  const renderedLayers = useMemo(() => {
    const legacyCluster = !component.layers?.length &&
      (component.settings?.clusterPoints ?? settings.map.clusterPoints);
    return resolvedLayers.map(layer => {
      if (
        isExternalLeafletLayer(layer) ||
        layer.features.length <= LOCAL_MAP_FEATURE_CULL_THRESHOLD ||
        layer.renderer.type === "cluster" ||
        legacyCluster
      ) return layer;
      const index = featureSpatialIndexes.get(layer.id);
      const features = index && renderViewport
        ? queryMapFeatureSpatialIndex(index, renderViewport)
        : [];
      return features === layer.features ? layer : { ...layer, features };
    });
  }, [
    resolvedLayers,
    featureSpatialIndexes,
    renderViewport,
    component.layers?.length,
    component.settings?.clusterPoints,
    settings.map.clusterPoints,
  ]);

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
      // A canvas renderer fills its entire custom pane and intercepts clicks
      // intended for feature canvases in lower layer panes. SVG keeps pointer
      // hit-testing scoped to the rendered geometry while preserving pane order.
      preferCanvas: false,
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
    const identifyPaneName = `hp-${id}-identify-highlight`.replace(
      /[^a-zA-Z0-9_-]/g,
      "_",
    );
    if (!map.getPane(identifyPaneName)) map.createPane(identifyPaneName);
    const identifyPane = map.getPane(identifyPaneName);
    if (identifyPane) {
      identifyPane.style.zIndex = "var(--hp-map-z-identify)";
      identifyPane.style.pointerEvents = "none";
    }
    if (!map.getPane(tooltipPaneName)) map.createPane(tooltipPaneName);
    const tooltipPane = map.getPane(tooltipPaneName);
    if (tooltipPane) tooltipPane.style.zIndex = "850";
    if (!map.getPane(popupPaneName)) map.createPane(popupPaneName);
    const popupPane = map.getPane(popupPaneName);
    if (popupPane) popupPane.style.zIndex = "1000";

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
              selRowKeys.has(k),
            );
            const isLocalSelected = selMapIds.has(
              resolvedMapFeatureKey(id, layer, feat),
            ) || selMapIds.has(feat.id);
            if (!isPbSelected && !isLocalSelected) continue;
            if (feat.lat !== null && feat.lon !== null) {
              selBounds.extend([feat.lat, feat.lon]);
              selectedPoints.push([feat.lat, feat.lon]);
              selectedGeometryCount++;
            } else if (feat.geometry) {
              const geographicBounds = geometryGeographicBounds(feat.geometry);
              if (geographicBounds) {
                extendLeafletBounds(selBounds, geographicBounds);
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
    onControllerReadyRef.current?.(controller);

    // ── Viewport emission ───────────────────────────────────
    const updateRenderViewport = () => {
      const bounds = map.getBounds();
      const next: GeographicBounds = [
        bounds.getWest(),
        bounds.getSouth(),
        bounds.getEast(),
        bounds.getNorth(),
      ];
      setRenderViewport(previous => geographicBoundsEqual(previous, next) ? previous : next);
    };
    const emitViewport = () => {
      updateRenderViewport();
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
    updateRenderViewport();
    const initialViewportFrame = requestAnimationFrame(emitViewport);

    const onMapBackgroundClick = (event: L.LeafletMouseEvent) => {
      const bounds = map.getBounds();
      const size = map.getSize();
      const handled =
        onMapClickRef.current?.({
          anchor: {
            lat: event.latlng.lat,
            lon: event.latlng.lng,
            containerX: event.containerPoint.x,
            containerY: event.containerPoint.y,
          },
          viewport: {
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
          },
        }) === true;
      if (!componentRef.current.featureDetails?.clearSelectionOnBackgroundClick)
        return;
      const current = renderContextRef.current;
      current.dispatch({ type: "clearMapFeatures", mapId: id });
      current.dispatch({ type: "selectComponentRows", id, rows: [] });
      current.dispatch({ type: "selectComponentRowKeys", id, keys: [] });
      current.dispatch({ type: "interactionSignature", id });
      current.clearExternal({ componentId: id, componentType: "map" });
      if (!handled)
        current.dispatch({
          type: "closeMapFeatureDetails",
          mapId: id,
        });
    };
    map.on("click", onMapBackgroundClick);

    const observer = new ResizeObserver(() => map.invalidateSize());
    observer.observe(ref.current);

    return () => {
      observer.disconnect();
      map.off("moveend", emitViewport);
      map.off("resize", emitViewport);
      map.off("click", onMapBackgroundClick);
      cancelAnimationFrame(initialViewportFrame);
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
      for (const [, mounted] of dynamicLayerRefs.current) {
        map.removeLayer(mounted.layer);
      }
      dynamicLayerRefs.current.clear();
      for (const [, mounted] of arcGisTileRefs.current) {
        map.removeLayer(mounted.layer);
      }
      arcGisTileRefs.current.clear();
      for (const [, features] of featureLayerRefs.current) {
        for (const [, mounted] of features) disposeMountedFeature(mounted);
      }
      featureLayerRefs.current.clear();
      clusterLayerRefs.current.clear();
      vectorGroupSignatureRefs.current.clear();
      openMapPopupStateRef.current = null;
      if (identifyHighlightRef.current)
        map.removeLayer(identifyHighlightRef.current);
      identifyHighlightRef.current = null;
      map.remove();
      mapRef.current = null;
      vectorLayerRefs.current.clear();
      basemapRef.current = null;
      for (const [, runtime] of labelLayerRefs.current) runtime.cleanup();
      labelLayerRefs.current.clear();
      labelSignatureRefs.current.clear();
      paneNamesRef.current.clear();
      externalWarningSignaturesRef.current.clear();
      reportedRenderSignaturesRef.current.clear();
      runtimeMetricsRef.current.clear();
    };
  }, []);

  // Dynamic identify owns one temporary, non-interactive highlight outside the
  // persistent vector registry and selection lifecycle.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    if (identifyHighlightRef.current) {
      map.removeLayer(identifyHighlightRef.current);
      identifyHighlightRef.current = null;
    }
    if (!identifyHighlight) return;
    const pane = `hp-${id}-identify-highlight`.replace(
      /[^a-zA-Z0-9_-]/g,
      "_",
    );
    const accent = settings.theme.accent;
    const highlight = L.geoJSON(identifyHighlight, {
      pane,
      interactive: false,
      style: {
        pane,
        color: accent,
        weight: 5,
        opacity: 0.95,
        fillColor: accent,
        fillOpacity: 0.16,
        dashArray: "7 4",
        interactive: false,
      },
      pointToLayer: (_feature, latlng) =>
        L.circleMarker(latlng, {
          pane,
          interactive: false,
          radius: 11,
          color: "#ffffff",
          weight: 3,
          opacity: 1,
          fillColor: accent,
          fillOpacity: 0.7,
        }),
    }).addTo(map);
    highlight.eachLayer((candidate) => {
      const element = (candidate as L.Path).getElement?.();
      element?.setAttribute("data-hp-identify-highlight", "true");
    });
    identifyHighlightRef.current = highlight;
    return () => {
      if (identifyHighlightRef.current === highlight) {
        map.removeLayer(highlight);
        identifyHighlightRef.current = null;
      }
    };
  }, [identifyHighlight, id, settings.theme.accent]);

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

  const resolvedLayerStructuralSignature = useMemo(
    () =>
      resolvedLayerStructuralRevision(
        renderedLayers,
        !component.layers?.length &&
          (component.settings?.clusterPoints ?? settings.map.clusterPoints),
      ),
    [
      renderedLayers,
      component.layers?.length,
      component.settings?.clusterPoints,
      settings.map.clusterPoints,
    ],
  );

  // ── Structural feature lifecycle ─────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const mapState = mapLayerStateRef.current;
    const sortedLayers = effectiveLayerOrder(renderedLayers, mapState?.order);
    const activeVectorLayerIds = new Set(
      sortedLayers
        .filter((layer) => !isExternalLeafletLayer(layer))
        .map((layer) => layer.id),
    );

    for (const [layerId, group] of vectorLayerRefs.current) {
      if (activeVectorLayerIds.has(layerId)) continue;
      const registry = featureLayerRefs.current.get(layerId);
      if (registry) {
        for (const [, mounted] of registry) {
          disposeMountedFeature(mounted);
        }
      }
      if (map.hasLayer(group)) map.removeLayer(group);
      vectorLayerRefs.current.delete(layerId);
      vectorGroupSignatureRefs.current.delete(layerId);
      clusterLayerRefs.current.delete(layerId);
      featureLayerRefs.current.delete(layerId);
      reportedRenderSignaturesRef.current.delete(layerId);
      if (openMapPopupStateRef.current?.layerId === layerId)
        openMapPopupStateRef.current = null;
    }
    for (const [layerId, runtime] of labelLayerRefs.current) {
      if (activeVectorLayerIds.has(layerId)) continue;
      runtime.cleanup();
      labelLayerRefs.current.delete(layerId);
      labelSignatureRefs.current.delete(layerId);
    }

    for (const [key, mounted] of dynamicLayerRefs.current) {
      if (
        !resolvedLayers.some(
          (layer) => layer.sourceType === "arcgisDynamic" && layer.id === key,
        )
      ) {
        map.removeLayer(mounted.layer);
        dynamicLayerRefs.current.delete(key);
      }
    }
    for (const [key, mounted] of arcGisTileRefs.current) {
      if (
        !resolvedLayers.some(
          (layer) => layer.sourceType === "arcgisTile" && layer.id === key,
        )
      ) {
        map.removeLayer(mounted.layer);
        arcGisTileRefs.current.delete(key);
      }
    }

    const dataBounds = L.latLngBounds([]);
    let hasAnyFeatures = false;

    for (const [index, layer] of sortedLayers.entries()) {
      const paneName = `hp-${id}-${layer.id}`.replace(/[^a-zA-Z0-9_-]/g, "_");
      if (!paneNamesRef.current.has(layer.id)) {
        if (!map.getPane(paneName)) map.createPane(paneName);
        paneNamesRef.current.set(layer.id, paneName);
      }
      const pane = map.getPane(paneName);
      if (pane) pane.style.zIndex = String(400 + index);
      const labelPaneName = `${paneName}-labels`;
      if (!map.getPane(labelPaneName)) map.createPane(labelPaneName);
      const labelPane = map.getPane(labelPaneName);
      if (labelPane) labelPane.style.zIndex = String(600 + index);
    }

    for (const layer of sortedLayers) {
      const renderStarted = globalThis.performance?.now?.() ?? Date.now();
      const renderSignature = [
        layer.features.length,
        layer.diagnostics.sourceResolutionMs,
        layer.diagnostics.rendererCalculationMs,
        layer.diagnostics.requestMs,
        layer.diagnostics.joinMs,
      ].join(":");
      const reportLayerRender = () => {
        if (reportedRenderSignaturesRef.current.get(layer.id) === renderSignature)
          return;
        reportedRenderSignaturesRef.current.set(layer.id, renderSignature);
        onLayerRuntimeStateChangeRef.current?.(layer.id, {
          renderMs: (globalThis.performance?.now?.() ?? Date.now()) - renderStarted,
        });
      };
      const isVisible = mapState?.visibility?.[layer.id] ?? layer.visible ?? true;
      const visibleAtZoom = layerVisibleAtZoom(layer, map.getZoom());
      const layerOpacity = clampOpacity(
        mapState?.opacity?.[layer.id] ?? layer.opacity ?? 1,
      );

      if (isExternalLeafletLayer(layer)) {
        reportLayerRender();
        continue;
      }

      const renderer = layer.renderer as ResolvedMapRenderer;
      const useCluster =
        renderer.type === "cluster" ||
        (!component.layers?.length &&
          (component.settings?.clusterPoints ?? settings.map.clusterPoints));
      const groupSignature = stableSerialize({
        useCluster,
        clusterRadius: renderer.clusterRadius,
        disableAtZoom: renderer.disableAtZoom,
        showCoverageOnHover: renderer.showCoverageOnHover,
      });

      let group = vectorLayerRefs.current.get(layer.id);
      let registry = featureLayerRefs.current.get(layer.id);
      if (group && vectorGroupSignatureRefs.current.get(layer.id) !== groupSignature) {
        incrementRuntimeMetric(runtimeMetricsRef.current, layer.id, "fullLayerRebuilds");
        if (map.hasLayer(group)) map.removeLayer(group);
        if (registry)
          for (const [, mounted] of registry) disposeMountedFeature(mounted);
        vectorLayerRefs.current.delete(layer.id);
        clusterLayerRefs.current.delete(layer.id);
        featureLayerRefs.current.delete(layer.id);
        group = undefined;
        registry = undefined;
      }

      if (!group) {
        group = L.featureGroup();
        vectorLayerRefs.current.set(layer.id, group);
        vectorGroupSignatureRefs.current.set(layer.id, groupSignature);
        registry = new Map();
        featureLayerRefs.current.set(layer.id, registry);
        if (useCluster) {
          let clusterValueWarningReported = false;
          const cluster = L.markerClusterGroup({
            showCoverageOnHover: renderer.showCoverageOnHover ?? false,
            maxClusterRadius: renderer.clusterRadius ?? 44,
            disableClusteringAtZoom: renderer.disableAtZoom,
            iconCreateFunction: (clusterGroup) => {
              const currentLayer =
                resolvedLayersRef.current.find(
                  (candidate) => candidate.id === layer.id,
                ) ?? layer;
              const currentRenderer = currentLayer.renderer;
              const childMarkers = clusterGroup.getAllChildMarkers();
              let label = String(childMarkers.length);
              if (currentRenderer.clusterLabel === "sum") {
                const field = currentRenderer.aggregateField;
                const source =
                  currentRenderer.fieldSource ??
                  resolvedDefaultAttributeSource(currentLayer);
                const numeric = field
                  ? childMarkers
                      .map((marker) => {
                        const mountedFeature = (
                          marker as L.Marker & { __hpFeature?: ResolvedMapFeature }
                        ).__hpFeature;
                        const value = mountedFeature
                          ? featureAttribute(mountedFeature, field, source)
                          : undefined;
                        const number =
                          typeof value === "number" ? value : Number(value);
                        return Number.isFinite(number) ? number : undefined;
                      })
                      .filter((value): value is number => value !== undefined)
                  : [];
                if (!field || numeric.length !== childMarkers.length) {
                  if (!clusterValueWarningReported)
                    onLayerRuntimeStateChangeRef.current?.(layer.id, {
                      warning: `Cluster sum ignored ${childMarkers.length - numeric.length} missing or nonnumeric value(s)${field ? ` from ${source}.${field}` : " because aggregateField is missing"}.`,
                    });
                  clusterValueWarningReported = true;
                }
                label = formatFeatureValue(
                  numeric.reduce((total, value) => total + value, 0),
                  currentRenderer.format,
                  "number",
                ).slice(0, 24);
              }
              return L.divIcon({
                className: "hp-map-cluster-icon",
                html: `<span>${escapeClusterLabel(label)}</span>`,
              });
            },
          });
          clusterLayerRefs.current.set(layer.id, cluster);
          group.addLayer(cluster);
        }
      }
      registry ??= new Map();
      if (!featureLayerRefs.current.has(layer.id))
        featureLayerRefs.current.set(layer.id, registry);

      if (isVisible && visibleAtZoom) {
        if (!map.hasLayer(group)) group.addTo(map);
      } else if (map.hasLayer(group)) {
        map.removeLayer(group);
      }

      const activeFeatureKeys = new Set(
        layer.features.map((feature) => resolvedMapFeatureKey(id, layer, feature)),
      );
      for (const [featureKey, mounted] of registry) {
        if (activeFeatureKeys.has(featureKey)) continue;
        mounted.parentGroup.removeLayer(mounted.leafletLayer);
        disposeMountedFeature(mounted);
        registry.delete(featureKey);
        if (popupStateMatches(openMapPopupStateRef.current, layer.id, featureKey))
          openMapPopupStateRef.current = null;
      }

      const domain = rendererDomains.get(layer.id) ?? null;
      for (const feature of layer.features) {
        const featureKey = resolvedMapFeatureKey(id, layer, feature);
        const selected =
          (selectedMapIdsRef.current.has(featureKey) ||
            selectedMapIdsRef.current.has(feature.id)) ||
          feature.powerBiRowKeys.some((rowKey) =>
            selectedRowKeysRef.current.has(rowKey),
          );
        const style = resolvedFeatureStyle(
          feature,
          renderer,
          domain,
          selectedRowKeysRef.current,
          selectedMapIdsRef.current,
          settings.theme.accent,
          featureKey,
        );
        const featureRevision = resolveMapFeatureRevision(feature, layer, {
          pane: paneNamesRef.current.get(layer.id),
          clusterParent: useCluster,
          selected,
          effectiveOpacity: layerOpacity,
          visualStyle: style,
        });
        const existing = registry.get(featureKey);
        if (
          existing?.revision.structuralRevision ===
          featureRevision.structuralRevision
        ) {
          existing.feature = feature;
          existing.layer = layer;
          existing.revision = {
            ...existing.revision,
            structuralRevision: featureRevision.structuralRevision,
          };
          continue;
        }

        const shouldReopen = popupStateMatches(
          openMapPopupStateRef.current,
          layer.id,
          featureKey,
        );
        if (existing) {
          existing.parentGroup.removeLayer(existing.leafletLayer);
          disposeMountedFeature(existing);
          registry.delete(featureKey);
        }
        const paneName = paneNamesRef.current.get(layer.id);
        const pointPosition = resolvedPointPosition(feature);
        let leafletLayer: L.Layer | null = null;
        let parentGroup: L.LayerGroup = group;
        if (pointPosition) {
          leafletLayer = createLeafletPointLayer(
            pointPosition,
            style,
            paneName,
            layerOpacity,
            feature.labelValue ?? feature.id,
          );
          parentGroup = clusterLayerRefs.current.get(layer.id) ?? group;
          parentGroup.addLayer(leafletLayer);
          dataBounds.extend(pointPosition);
          hasAnyFeatures = true;
        } else if (feature.geometry) {
          leafletLayer = L.geoJSON(feature.geometry, {
            style: () => pathStyle(style, layerOpacity),
            bubblingMouseEvents: false,
            pointToLayer: (_geoFeature, latlng) =>
              createLeafletPointLayer(
                latlng,
                style,
                paneName,
                layerOpacity,
                feature.labelValue ?? feature.id,
              ) as L.Marker,
            pane: paneName,
          });
          parentGroup.addLayer(leafletLayer);
          const geometryBounds = (leafletLayer as L.GeoJSON).getBounds();
          if (geometryBounds.isValid()) dataBounds.extend(geometryBounds);
          hasAnyFeatures = true;
        }
        if (!leafletLayer) continue;
        incrementRuntimeMetric(runtimeMetricsRef.current, layer.id, "featureObjectsCreated");

        (
          leafletLayer as L.Layer & { __hpFeature?: ResolvedMapFeature }
        ).__hpFeature = feature;
        const mounted: MountedFeatureLayer = {
          featureKey,
          featureId: feature.id,
          layerId: layer.id,
          leafletLayer,
          parentGroup,
          feature,
          layer,
          revision: featureRevision,
        };
        registry.set(featureKey, mounted);
        const annotate = () =>
          annotateLeafletFeature(
            leafletLayer,
            featureKey,
            layer.id,
            feature.id,
            feature.labelValue ?? `${layer.name}: ${feature.id}`,
          );
        leafletLayer.on("add", annotate);
        annotate();
        reportRuntimeMetrics(
          ref.current,
          runtimeMetricsRef.current,
          layer.id,
          onLayerRuntimeStateChangeRef.current,
        );

        if (layer.tooltip?.enabled !== false) {
          leafletLayer.bindTooltip(
            createResolvedTooltipElement(feature, layer.tooltip, layer.name),
            { pane: tooltipPaneName },
          );
        }
        const onPopupOpen = () => {
          openMapPopupStateRef.current = {
            layerId: mounted.layerId,
            featureKey: mounted.featureKey,
          };
        };
        const onPopupClose = () => {
          cleanupMountedPopup(mounted);
          if (
            popupStateMatches(
              openMapPopupStateRef.current,
              mounted.layerId,
              mounted.featureKey,
            )
          )
            openMapPopupStateRef.current = null;
        };
        if (
          componentRef.current.featureDetails?.mode === "legacyPopup" &&
          layer.popup?.enabled
        ) {
          leafletLayer.bindPopup(
            () => {
              cleanupMountedPopup(mounted);
              const popup = mounted.layer.popup;
              if (!popup) return document.createElement("div");
              const rendered = renderResolvedPopup(popup, mounted.feature, {
                executeAction: (action) => {
                  if (action.uiAction)
                    renderContextRef.current.executeUiAction(action.uiAction);
                },
              });
              mounted.popupCleanup = rendered.cleanup;
              return rendered.element;
            },
            {
              pane: popupPaneName,
              autoPan: true,
              keepInView: true,
              closeButton: true,
              autoClose: true,
              closeOnEscapeKey: true,
              minWidth: 220,
              maxWidth: 420,
              autoPanPaddingTopLeft: [16, 56],
              autoPanPaddingBottomRight: [16, 16],
              className: "hp-map-popup-shell",
            },
          );
          leafletLayer.on("popupopen", onPopupOpen);
          leafletLayer.on("popupclose", onPopupClose);
        }

        const onClick = (event: L.LeafletMouseEvent) => {
          const currentFeature = mounted.feature;
          const currentLayer = mounted.layer;
          const currentContext = renderContextRef.current;
          const multiSelect = Boolean(
            event.originalEvent?.ctrlKey || event.originalEvent?.metaKey,
          );
          if (typeof event.originalEvent?.stopPropagation === "function")
            event.originalEvent.stopPropagation();
          const point = resolvedPointPosition(currentFeature);
          const anchorLat = event.latlng?.lat ?? point?.[0] ?? 0;
          const anchorLon = event.latlng?.lng ?? point?.[1] ?? 0;
          currentContext.dispatch({
            type: "activateMapFeature",
            mapId: id,
            feature: {
              featureKey: mounted.featureKey,
              layerId: mounted.layerId,
              featureId: mounted.featureId,
              anchor: {
                lat: anchorLat,
                lon: anchorLon,
                containerX: event.containerPoint?.x,
                containerY: event.containerPoint?.y,
              },
            },
            multiSelect,
          });
          if (
            currentFeature.powerBiRowIndices.length > 0 &&
            currentFeature.powerBiRowKeys.length > 0
          ) {
            const interactionPolicy = resolveInteractionPolicy(
              {
                ...componentRef.current,
                interaction:
                  currentLayer.interaction ?? componentRef.current.interaction,
              },
              runtimeConfigRef.current,
              "dataPoint",
            );
            const field = interactionPolicy.field;
            const interactionContext = currentContext.selectSourceRows
              ? {
                  ...currentContext,
                  sourceRows:
                    currentContext.powerBiSourceRows ?? currentContext.sourceRows,
                  sourceRowKeys:
                    currentContext.powerBiSourceRowKeys ?? currentContext.sourceRowKeys,
                  selectExternal: currentContext.selectSourceRows,
                }
              : currentContext;
            executeComponentInteraction(
              {
                ...interactionPolicy,
                selectionMode: multiSelect ? "toggle" : "replace",
                clearOnSecondClick: false,
              },
              createInteractionPayload(componentRef.current, {
                rowIndices: currentFeature.powerBiRowIndices,
                rowKeys: currentFeature.powerBiRowKeys,
                sourceRowKeys: interactionContext.sourceRowKeys,
                field,
                value: field
                  ? featureAttribute(
                      currentFeature,
                      field,
                      currentLayer.interaction?.fieldSource ??
                        resolvedDefaultAttributeSource(currentLayer),
                    )
                  : undefined,
                mapFeatureKey: mounted.featureKey,
                mapLayerId: mounted.layerId,
                mapFeatureId: mounted.featureId,
              }),
              interactionContext,
              { trigger: "click", multiSelect, event: event.originalEvent },
            );
          }
        };
        const onMouseOver = () =>
          renderContextRef.current.dispatch({
            type: "setMapHoveredFeature",
            mapId: id,
            featureKey: mounted.featureKey,
          });
        const onMouseOut = () =>
          renderContextRef.current.dispatch({
            type: "setMapHoveredFeature",
            mapId: id,
          });
        leafletLayer.on("click", onClick);
        leafletLayer.on("mouseover", onMouseOver);
        leafletLayer.on("mouseout", onMouseOut);
        mounted.eventCleanup = () => {
          leafletLayer.off("click", onClick);
          leafletLayer.off("mouseover", onMouseOver);
          leafletLayer.off("mouseout", onMouseOut);
          leafletLayer.off("add", annotate);
          leafletLayer.off("popupopen", onPopupOpen);
          leafletLayer.off("popupclose", onPopupClose);
        };
        if (
          componentRef.current.featureDetails?.mode === "legacyPopup" &&
          shouldReopen &&
          isVisible &&
          visibleAtZoom
        ) {
          leafletLayer.openPopup();
        }
      }

      if (
        isVisible &&
        !hasFitRef.current &&
        (componentRef.current.view?.fitMode ?? "data") !== "none"
      ) {
        const fullLayer = resolvedLayersRef.current.find(candidate => candidate.id === layer.id) ?? layer;
        const fullBounds = boundsForFeatures(fullLayer.features);
        if (fullBounds.isValid()) {
          dataBounds.extend(fullBounds);
          hasAnyFeatures = true;
        }
      }

      reportLayerRender();
    }

    const view = componentRef.current.view ?? {};
    const fitMode = view.fitMode ?? "data";
    const fullSortedLayers = effectiveLayerOrder(resolvedLayersRef.current, mapState?.order);
    const firstVisibleLayer = fullSortedLayers.find(
      (layer) =>
        (mapState?.visibility?.[layer.id] ?? layer.visible ?? true) &&
        layer.features.length > 0,
    );
    const effectiveBounds =
      fitMode === "firstLayer" && firstVisibleLayer
        ? boundsForFeatures(firstVisibleLayer.features)
        : dataBounds;
    if (
      fitMode !== "none" &&
      effectiveBounds.isValid() &&
      hasAnyFeatures &&
      !hasFitRef.current
    ) {
      runProgrammaticMove(map, programmaticMoveCountRef, () => {
        const minZoom = view.minZoom ?? 1;
        const maxZoom = view.maxZoom ?? 18;
        if (effectiveBounds.getSouthWest().equals(effectiveBounds.getNorthEast()))
          map.setView(
            effectiveBounds.getCenter(),
            Math.max(minZoom, Math.min(maxZoom, 14)),
            { animate: false },
          );
        else
          map.fitBounds(
            effectiveBounds.pad(normalizeFitPadding(view.fitPadding)),
            { maxZoom, animate: false },
          );
      });
      hasFitRef.current = true;
    }
  }, [
    resolvedLayerStructuralSignature,
    webAccessAvailable,
    context.providerAccess,
  ]);

  // External image layers have their own definition/access lifecycle. This
  // effect intentionally runs after every render so an access-policy recovery
  // can restore the retained newest definition without touching vectors.
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const active = new Set<string>();
    for (const layer of resolvedLayers) {
      if (!isExternalLeafletLayer(layer)) continue;
      active.add(layer.id);
      const visible =
        mapLayerStateRef.current?.visibility?.[layer.id] ?? layer.visible ?? true;
      synchronizeLeafletExternalLayer({
        map,
        layer,
        runtime: {
          tileLayers: arcGisTileRefs.current,
          dynamicLayers: dynamicLayerRefs.current,
          generation: externalLayerGenerationRef,
          warningSignatures: externalWarningSignaturesRef.current,
        },
        pane: paneNamesRef.current.get(layer.id),
        visible,
        visibleAtZoom: layerVisibleAtZoom(layer, map.getZoom()),
        opacity: clampOpacity(
          mapLayerStateRef.current?.opacity?.[layer.id] ?? layer.opacity ?? 1,
        ),
        providerAccess: renderContextRef.current.providerAccess,
        webAccessAvailable,
        onRuntimeStateChange: (update) =>
          onLayerRuntimeStateChangeRef.current?.(layer.id, update),
      });
    }
    for (const [layerId, mounted] of arcGisTileRefs.current) {
      if (active.has(layerId)) continue;
      map.removeLayer(mounted.layer);
      arcGisTileRefs.current.delete(layerId);
      clearExternalWarningSignatures(externalWarningSignaturesRef.current, layerId);
    }
    for (const [layerId, mounted] of dynamicLayerRefs.current) {
      if (active.has(layerId)) continue;
      map.removeLayer(mounted.layer);
      dynamicLayerRefs.current.delete(layerId);
      clearExternalWarningSignatures(externalWarningSignaturesRef.current, layerId);
    }
  });

  // Labels own independent noninteractive Leaflet layers; label/content edits do
  // not participate in feature geometry lifecycle.
  const resolvedLabelRevisions = useMemo(() => new Map(
    renderedLayers
      .filter(layer => Boolean(layer.labels))
      .map(layer => [layer.id, stableMapRevision({
        labels: layer.labels,
        features: layer.features.map(feature => ({
          key: feature.featureKey ?? feature.id,
          labelValue: feature.labelValue,
          lat: feature.lat,
          lon: feature.lon,
          geometry: feature.geometry,
          serviceAttributes: feature.serviceAttributes,
          powerBiAttributes: feature.powerBiAttributes,
          joinedAttributes: feature.joinedAttributes,
        })),
      })] as const),
  ), [renderedLayers]);
  const resolvedLabelSignature = useMemo(
    () => stableMapRevision([...resolvedLabelRevisions]),
    [resolvedLabelRevisions],
  );
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const activeIds = new Set(renderedLayers.map((layer) => layer.id));
    for (const [layerId, runtime] of labelLayerRefs.current) {
      if (activeIds.has(layerId)) continue;
      runtime.cleanup();
      labelLayerRefs.current.delete(layerId);
      labelSignatureRefs.current.delete(layerId);
    }
    for (const layer of renderedLayers) {
      const signature = resolvedLabelRevisions.get(layer.id);
      const current = labelLayerRefs.current.get(layer.id);
      if (!layer.labels || !signature) {
        current?.cleanup();
        labelLayerRefs.current.delete(layer.id);
        labelSignatureRefs.current.delete(layer.id);
        continue;
      }
      if (labelSignatureRefs.current.get(layer.id) === signature) continue;
      current?.cleanup();
      const pane = paneNamesRef.current.get(layer.id);
      if (!pane) continue;
      const runtime = createResolvedMapLabels(map, layer, {
        pane: `${pane}-labels`,
        visible:
          mapLayerStateRef.current?.labels?.[layer.id] ?? layer.labels.enabled,
      });
      labelLayerRefs.current.set(layer.id, runtime);
      labelSignatureRefs.current.set(layer.id, signature);
      for (const warning of runtime.warnings)
        onLayerRuntimeStateChangeRef.current?.(layer.id, { warning });
    }
  }, [resolvedLabelSignature, resolvedLabelRevisions, renderedLayers]);

  // ── Transient selection and opacity synchronization ──────────────
  useEffect(() => {
    const mapState = context.state.mapLayerState[id];
    const selectedRowKeySet = new Set(context.state.componentSelectedRowKeys[id] ?? []);
    const selectedFeatureKeySet = new Set(
      context.state.mapInteractionState[id]?.selectedFeatureKeys ??
        context.state.mapSelectedFeatureIds[id] ?? [],
    );
    for (const layer of renderedLayers) {
      const renderer = layer.renderer as ResolvedMapRenderer;
      const domain = rendererDomains.get(layer.id) ?? null;
      const opacity = clampOpacity(
        mapState?.opacity?.[layer.id] ?? layer.opacity ?? 1,
      );
      const registry = featureLayerRefs.current.get(layer.id);
      if (!registry) continue;
      for (const feature of layer.features) {
        const featureKey = resolvedMapFeatureKey(id, layer, feature);
        const mounted = registry.get(featureKey);
        if (!mounted) continue;
        mounted.feature = feature;
        mounted.layer = layer;
        const style = resolvedFeatureStyle(
          feature,
          renderer,
          domain,
          selectedRowKeySet,
          selectedFeatureKeySet,
          settings.theme.accent,
          featureKey,
        );
        const powerBiSelected = feature.powerBiRowKeys.some((rowKey) =>
          selectedRowKeySet.has(rowKey),
        );
        const locallySelected = selectedFeatureKeySet.has(featureKey);
        const revision = resolveMapFeatureRevision(feature, layer, {
          pane: paneNamesRef.current.get(layer.id),
          clusterParent:
            layer.renderer.type === "cluster" ||
            (!component.layers?.length &&
              (component.settings?.clusterPoints ?? settings.map.clusterPoints)),
          selected: powerBiSelected || locallySelected,
          effectiveOpacity: opacity,
          visualStyle: style,
        });
        if (mounted.revision.visualRevision !== revision.visualRevision) {
          applyMountedStyle(mounted.leafletLayer, style, opacity);
          incrementRuntimeMetric(
            runtimeMetricsRef.current,
            layer.id,
            "featureObjectsPatched",
          );
        }
        if (mounted.revision.contentRevision !== revision.contentRevision) {
          const tooltip = createResolvedTooltipElement(
            feature,
            layer.tooltip,
            layer.name,
          );
          const tooltipLayer = mounted.leafletLayer as L.Layer & {
            getTooltip?: () => unknown;
            bindTooltip: (
              content: string | HTMLElement,
              options?: L.TooltipOptions,
            ) => unknown;
            unbindTooltip?: () => unknown;
            setTooltipContent?: (content: string | HTMLElement) => unknown;
          };
          if (layer.tooltip?.enabled === false) tooltipLayer.unbindTooltip?.();
          else if (tooltipLayer.getTooltip?.())
            tooltipLayer.setTooltipContent?.(tooltip);
          else tooltipLayer.bindTooltip(tooltip, { pane: tooltipPaneName });
        }
        mounted.revision = revision;
      }
      clusterLayerRefs.current.get(layer.id)?.refreshClusters?.();
      reportRuntimeMetrics(
        ref.current,
        runtimeMetricsRef.current,
        layer.id,
        onLayerRuntimeStateChangeRef.current,
      );
    }
  }, [
    renderedLayers,
    rendererDomains,
    context.state.componentSelectedRowKeys[id],
    context.state.mapSelectedFeatureIds[id],
    context.state.mapInteractionState[id],
    context.state.mapLayerState[id]?.opacity,
    settings.theme.accent,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const sync = () => {
      const zoom = map.getZoom();
      const layers = effectiveLayerOrder(
        resolvedLayersRef.current,
        mapLayerStateRef.current?.order,
      );
      for (const [index, layer] of layers.entries()) {
        const paneName = paneNamesRef.current.get(layer.id);
        const pane = paneName ? map.getPane(paneName) : undefined;
        if (pane) pane.style.zIndex = String(400 + index);
        const labelPane = paneName ? map.getPane(`${paneName}-labels`) : undefined;
        if (labelPane) labelPane.style.zIndex = String(600 + index);
        const show =
          (mapLayerStateRef.current?.visibility?.[layer.id] ??
            layer.visible ??
            true) &&
          layerVisibleAtZoom(layer, zoom);
        const candidates: L.Layer[] = [];
        const vector = vectorLayerRefs.current.get(layer.id);
        if (vector) candidates.push(vector);
        const tile = arcGisTileRefs.current.get(layer.id)?.layer;
        if (tile) candidates.push(tile);
        const dynamic = dynamicLayerRefs.current.get(layer.id)?.layer;
        if (dynamic) candidates.push(dynamic);
        for (const candidate of candidates) {
          if (show && !map.hasLayer(candidate)) candidate.addTo(map);
          else if (!show && map.hasLayer(candidate)) map.removeLayer(candidate);
        }
        const opacity = clampOpacity(
          mapLayerStateRef.current?.opacity?.[layer.id] ?? layer.opacity ?? 1,
        );
        arcGisTileRefs.current.get(layer.id)?.layer.setOpacity(opacity);
        dynamicLayerRefs.current.get(layer.id)?.layer.setOpacity(opacity);
        const labelsVisible =
          show &&
          (mapLayerStateRef.current?.labels?.[layer.id] ??
            layer.labels?.enabled ??
            false);
        labelLayerRefs.current.get(layer.id)?.setVisible?.(labelsVisible);
      }
    };
    map.on("zoomend", sync);
    sync();
    return () => map.off("zoomend", sync);
  }, [resolvedLayers, context.state.mapLayerState[id]]);

  // Cleanup no longer needed — map instance tracked via ref
  // and cleaned up in the init effect's return.

  return (
    <div
      ref={ref}
      class="hp-leaflet-container"
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

function geographicBoundsEqual(
  left: GeographicBounds | null,
  right: GeographicBounds,
): boolean {
  return Boolean(left && left.every((value, index) =>
    Math.abs(value - right[index]) < 0.00001,
  ));
}

function clearExternalWarningSignatures(signatures: Set<string>, layerId: string): void {
  for (const signature of [...signatures])
    if (signature.startsWith(`tile:${layerId}:`) || signature.startsWith(`dynamic:${layerId}:`))
      signatures.delete(signature);
}

function stableSerialize(value: unknown): string {
  return JSON.stringify(value, (_key, next) => {
    if (next instanceof Map)
      return {
        __map: [...next.entries()].sort(([left], [right]) =>
          String(left).localeCompare(String(right)),
        ),
      };
    if (next instanceof Set)
      return { __set: [...next.values()].sort() };
    return next;
  });
}

function effectiveLayerOrder(
  layers: readonly ResolvedMapLayer[],
  viewerOrder?: readonly string[],
): ResolvedMapLayer[] {
  const authored = [...layers].sort((left, right) => left.order - right.order);
  if (!viewerOrder?.length) return authored;
  const rank = new Map(viewerOrder.map((layerId, index) => [layerId, index]));
  return authored.sort((left, right) => {
    const leftRank = rank.get(left.id);
    const rightRank = rank.get(right.id);
    if (leftRank === undefined && rightRank === undefined)
      return left.order - right.order;
    if (leftRank === undefined) return 1;
    if (rightRank === undefined) return -1;
    return leftRank - rightRank;
  });
}

function isExternalLeafletLayer(layer: ResolvedMapLayer): boolean {
  return layer.sourceType === "arcgisTile" || layer.sourceType === "arcgisDynamic";
}

function popupStateMatches(
  state: OpenMapPopupState | null,
  layerId: string,
  featureKey: MapFeatureKey,
): boolean {
  return state?.layerId === layerId && state.featureKey === featureKey;
}

function cleanupMountedPopup(mounted: MountedFeatureLayer): void {
  const cleanup = mounted.popupCleanup;
  mounted.popupCleanup = undefined;
  cleanup?.();
}

function disposeMountedFeature(mounted: MountedFeatureLayer): void {
  cleanupMountedPopup(mounted);
  mounted.eventCleanup?.();
  mounted.eventCleanup = undefined;
}

function resolvedPointPosition(
  feature: ResolvedMapFeature,
): [number, number] | null {
  if (
    feature.geometryType === "point" &&
    feature.lat !== null &&
    feature.lon !== null
  )
    return [feature.lat, feature.lon];
  if (feature.geometry?.type !== "Point") return null;
  const [longitude, latitude] = (feature.geometry as GeoJSON.Point).coordinates;
  return [latitude, longitude];
}

function pathStyle(
  style: LeafletFeatureStyle,
  layerOpacity: number,
): L.PathOptions {
  return {
    color: style.color,
    fillColor: style.fillColor,
    fillOpacity: clampOpacity(style.fillOpacity * layerOpacity),
    opacity: clampOpacity(style.opacity * layerOpacity),
    weight: style.weight,
    dashArray: style.dashArray,
  };
}

function resolvedFeatureStyle(
  feature: ResolvedMapFeature,
  renderer: ResolvedMapRenderer,
  domain: [number, number] | null,
  selectedRowKeys: ReadonlySet<string>,
  selectedMapIds: ReadonlySet<string>,
  accent: string,
  featureKey: MapFeatureKey,
): LeafletFeatureStyle {
  let style =
    domain &&
    (renderer.type === "continuousColor" ||
      renderer.type === "proportionalSize")
      ? featureStyleWithDomain(feature, renderer, domain)
      : featureStyle(feature, renderer);
  const selected =
    feature.powerBiRowKeys.some((rowKey) => selectedRowKeys.has(rowKey)) ||
    selectedMapIds.has(featureKey) ||
    selectedMapIds.has(feature.id);
  if (selected)
    style = {
      ...style,
      color: accent,
      weight: Math.max(style.weight + 2, 4),
      radius: (style.radius || 6) + 3,
    };
  return style;
}

function applyMountedStyle(
  layer: L.Layer,
  style: LeafletFeatureStyle,
  opacity: number,
): void {
  updateLeafletPointLayerStyle(layer, style, opacity);
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
    const featureBounds = resolvedFeatureGeographicBounds(feature);
    if (featureBounds) extendLeafletBounds(bounds, featureBounds);
  }
  return bounds;
}

function extendLeafletBounds(bounds: L.LatLngBounds, value: GeographicBounds): void {
  bounds.extend([value[1], value[0]]);
  if (value[0] !== value[2] || value[1] !== value[3])
    bounds.extend([value[3], value[2]]);
}

function annotateLeafletFeature(
  layer: L.Layer,
  featureKey: MapFeatureKey,
  layerId: string,
  featureId: string,
  label: string,
): void {
  const candidate = layer as L.Layer & {
    getElement?: () => HTMLElement | SVGElement | null;
    eachLayer?: (visit: (child: L.Layer) => void) => void;
  };
  const element = candidate.getElement?.();
  if (element) {
    element.setAttribute("data-hp-feature-key", featureKey);
    element.setAttribute("data-hp-layer-id", layerId);
    element.setAttribute("data-hp-feature-id", featureId);
    element.setAttribute("aria-label", label.slice(0, 180));
  }
  candidate.eachLayer?.((child) =>
    annotateLeafletFeature(child, featureKey, layerId, featureId, label),
  );
}

type RuntimeMetricName =
  | "featureObjectsCreated"
  | "featureObjectsPatched"
  | "fullLayerRebuilds";
type RuntimeMetricValues = Record<RuntimeMetricName, number>;

function incrementRuntimeMetric(
  metrics: Map<string, RuntimeMetricValues>,
  layerId: string,
  name: RuntimeMetricName,
): void {
  const current = metrics.get(layerId) ?? {
    featureObjectsCreated: 0,
    featureObjectsPatched: 0,
    fullLayerRebuilds: 0,
  };
  current[name]++;
  metrics.set(layerId, current);
}

function reportRuntimeMetrics(
  host: HTMLDivElement | null,
  metrics: Map<string, RuntimeMetricValues>,
  layerId: string,
  report:
    | ((
        layerId: string,
        update: Partial<RuntimeMetricValues>,
      ) => void)
    | undefined,
): void {
  const layerMetrics = metrics.get(layerId);
  if (!layerMetrics) return;
  report?.(layerId, layerMetrics);
  if (!host) return;
  const totals = [...metrics.values()].reduce<RuntimeMetricValues>(
    (sum, item) => ({
      featureObjectsCreated:
        sum.featureObjectsCreated + item.featureObjectsCreated,
      featureObjectsPatched:
        sum.featureObjectsPatched + item.featureObjectsPatched,
      fullLayerRebuilds: sum.fullLayerRebuilds + item.fullLayerRebuilds,
    }),
    {
      featureObjectsCreated: 0,
      featureObjectsPatched: 0,
      fullLayerRebuilds: 0,
    },
  );
  host.dataset.featureObjectsCreated = String(totals.featureObjectsCreated);
  host.dataset.featureObjectsPatched = String(totals.featureObjectsPatched);
  host.dataset.fullLayerRebuilds = String(totals.fullLayerRebuilds);
}
