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

export interface LeafletMapController {
  home(): void;
  zoomToSelection(): void;
  zoomToLayer(layerId: string): void;
  goToBookmark(bookmarkId: string): void;
  showSearchResult(result: GeocoderSearchResult): void;
  clearSearchResult(): void;
  invalidateSize(): void;
}

interface MountedFeatureLayer {
  featureId: string;
  layerId: string;
  leafletLayer: L.Layer;
  parentGroup: L.LayerGroup;
  feature: ResolvedMapFeature;
  layer: ResolvedMapLayer;
  structuralSignature: string;
  popupCleanup?: () => void;
  eventCleanup?: () => void;
  replacing?: boolean;
}

interface OpenMapPopupState {
  layerId: string;
  featureId: string;
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
  const renderContextRef = useRef(context);
  const runtimeConfigRef = useRef(runtimeConfig);

  const popupPaneName = `hp-${id}-popup`.replace(/[^a-zA-Z0-9_-]/g, "_");
  const tooltipPaneName = `hp-${id}-tooltip`.replace(
    /[^a-zA-Z0-9_-]/g,
    "_",
  );

  resolvedLayersRef.current = resolvedLayers;
  componentRef.current = component;
  selectedRowKeysRef.current = context.state.componentSelectedRowKeys[id] ?? [];
  selectedMapIdsRef.current = context.state.mapSelectedFeatureIds[id] ?? [];
  mapLayerStateRef.current = context.state.mapLayerState[id];
  onViewportChangeRef.current = onViewportChange;
  onControllerReadyRef.current = onControllerReady;
  onLayerRuntimeStateChangeRef.current = onLayerRuntimeStateChange;
  settingsMapRef.current = settings.map;
  renderContextRef.current = context;
  runtimeConfigRef.current = runtimeConfig;

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
      map.remove();
      mapRef.current = null;
      vectorLayerRefs.current.clear();
      basemapRef.current = null;
      for (const [, runtime] of labelLayerRefs.current) runtime.cleanup();
      labelLayerRefs.current.clear();
      labelSignatureRefs.current.clear();
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

  const resolvedLayerStructuralSignature = useMemo(
    () =>
      stableSerialize({
        legacyCluster:
          !component.layers?.length &&
          (component.settings?.clusterPoints ?? settings.map.clusterPoints),
        layers: resolvedLayers.map(({ diagnostics: _diagnostics, loading: _loading, error: _error, ...layer }) => layer),
      }),
    [
      resolvedLayers,
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
    const sortedLayers = effectiveLayerOrder(resolvedLayers, mapState?.order);
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
          mounted.replacing = false;
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

      if (
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
          visible: isVisible,
          visibleAtZoom,
          opacity: layerOpacity,
          providerAccess: renderContextRef.current.providerAccess,
          webAccessAvailable,
          onRuntimeStateChange: (update) =>
            onLayerRuntimeStateChangeRef.current?.(layer.id, update),
        })
      ) {
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
        clusterLabel: renderer.clusterLabel,
        aggregateField: renderer.aggregateField,
        fieldSource: renderer.fieldSource,
        format: renderer.format,
      });

      let group = vectorLayerRefs.current.get(layer.id);
      let registry = featureLayerRefs.current.get(layer.id);
      if (group && vectorGroupSignatureRefs.current.get(layer.id) !== groupSignature) {
        if (registry) {
          for (const [, mounted] of registry) {
            mounted.replacing = popupStateMatches(
              openMapPopupStateRef.current,
              mounted.layerId,
              mounted.featureId,
            );
          }
        }
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
              const childMarkers = clusterGroup.getAllChildMarkers();
              let label = String(childMarkers.length);
              if (renderer.clusterLabel === "sum") {
                const field = renderer.aggregateField;
                const source =
                  renderer.fieldSource ?? resolvedDefaultAttributeSource(layer);
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
                  renderer.format,
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

      const activeFeatureIds = new Set(layer.features.map((feature) => feature.id));
      for (const [featureId, mounted] of registry) {
        if (activeFeatureIds.has(featureId)) continue;
        mounted.replacing = false;
        mounted.parentGroup.removeLayer(mounted.leafletLayer);
        disposeMountedFeature(mounted);
        registry.delete(featureId);
        if (popupStateMatches(openMapPopupStateRef.current, layer.id, featureId))
          openMapPopupStateRef.current = null;
      }

      const domain = rendererDomains.get(layer.id) ?? null;
      for (const feature of layer.features) {
        const featureSignature = stableSerialize({
          feature,
          renderer,
          popup: layer.popup,
          tooltip: layer.tooltip,
          pane: paneNamesRef.current.get(layer.id),
          useCluster,
        });
        const existing = registry.get(feature.id);
        if (existing?.structuralSignature === featureSignature) {
          existing.feature = feature;
          existing.layer = layer;
          continue;
        }

        const shouldReopen = popupStateMatches(
          openMapPopupStateRef.current,
          layer.id,
          feature.id,
        );
        if (existing) {
          existing.replacing = shouldReopen;
          existing.parentGroup.removeLayer(existing.leafletLayer);
          disposeMountedFeature(existing);
          registry.delete(feature.id);
        }

        const style = resolvedFeatureStyle(
          feature,
          renderer,
          domain,
          selectedRowKeysRef.current,
          selectedMapIdsRef.current,
          settings.theme.accent,
        );
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

        (
          leafletLayer as L.Layer & { __hpFeature?: ResolvedMapFeature }
        ).__hpFeature = feature;
        const mounted: MountedFeatureLayer = {
          featureId: feature.id,
          layerId: layer.id,
          leafletLayer,
          parentGroup,
          feature,
          layer,
          structuralSignature: featureSignature,
        };
        registry.set(feature.id, mounted);

        if (layer.tooltip?.enabled !== false) {
          leafletLayer.bindTooltip(
            createResolvedTooltipElement(feature, layer.tooltip, layer.name),
            { pane: tooltipPaneName },
          );
        }
        const onPopupOpen = () => {
          openMapPopupStateRef.current = {
            layerId: mounted.layerId,
            featureId: mounted.featureId,
          };
        };
        const onPopupClose = () => {
          cleanupMountedPopup(mounted);
          if (
            !mounted.replacing &&
            popupStateMatches(
              openMapPopupStateRef.current,
              mounted.layerId,
              mounted.featureId,
            )
          )
            openMapPopupStateRef.current = null;
        };
        if (layer.popup?.enabled) {
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
              interactionPolicy,
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
              }),
              interactionContext,
              { trigger: "click", multiSelect, event: event.originalEvent },
            );
          } else {
            const alreadySelected = selectedMapIdsRef.current.includes(
              currentFeature.id,
            );
            currentContext.dispatch({
              type: "selectMapFeatures",
              mapId: id,
              featureIds: [currentFeature.id],
              selectionMode:
                multiSelect || alreadySelected ? "toggle" : "replace",
            });
          }
        };
        leafletLayer.on("click", onClick);
        mounted.eventCleanup = () => {
          leafletLayer.off("click", onClick);
          leafletLayer.off("popupopen", onPopupOpen);
          leafletLayer.off("popupclose", onPopupClose);
        };
        if (shouldReopen && isVisible && visibleAtZoom) {
          mounted.replacing = false;
          leafletLayer.openPopup();
        }
      }

      for (const feature of layer.features) {
        const point = resolvedPointPosition(feature);
        if (point) {
          if (isVisible) dataBounds.extend(point);
          if (isVisible) hasAnyFeatures = true;
        } else if (feature.geometry && isVisible) {
          const geometryBounds = L.geoJSON(feature.geometry).getBounds();
          if (geometryBounds.isValid()) dataBounds.extend(geometryBounds);
          hasAnyFeatures = true;
        }
      }

      const labelSignature = stableSerialize({ labels: layer.labels, features: layer.features });
      const currentLabelRuntime = labelLayerRefs.current.get(layer.id);
      if (!layer.labels) {
        currentLabelRuntime?.cleanup();
        labelLayerRefs.current.delete(layer.id);
        labelSignatureRefs.current.delete(layer.id);
      } else if (labelSignatureRefs.current.get(layer.id) !== labelSignature) {
        currentLabelRuntime?.cleanup();
        const labelRuntime = createResolvedMapLabels(map, layer, {
          pane: `${paneNamesRef.current.get(layer.id)}-labels`,
          visible: mapState?.labels?.[layer.id] ?? layer.labels.enabled,
        });
        labelLayerRefs.current.set(layer.id, labelRuntime);
        labelSignatureRefs.current.set(layer.id, labelSignature);
        for (const warning of labelRuntime.warnings)
          onLayerRuntimeStateChangeRef.current?.(layer.id, { warning });
      }
      reportLayerRender();
    }

    const view = componentRef.current.view ?? {};
    const fitMode = view.fitMode ?? "data";
    const firstVisibleLayer = sortedLayers.find(
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
    rendererDomains,
    webAccessAvailable,
    context.providerAccess,
  ]);

  // ── Transient selection and opacity synchronization ──────────────
  useEffect(() => {
    const mapState = context.state.mapLayerState[id];
    for (const layer of resolvedLayers) {
      const renderer = layer.renderer as ResolvedMapRenderer;
      const domain = rendererDomains.get(layer.id) ?? null;
      const opacity = clampOpacity(
        mapState?.opacity?.[layer.id] ?? layer.opacity ?? 1,
      );
      const registry = featureLayerRefs.current.get(layer.id);
      if (!registry) continue;
      for (const feature of layer.features) {
        const mounted = registry.get(feature.id);
        if (!mounted) continue;
        mounted.feature = feature;
        mounted.layer = layer;
        const style = resolvedFeatureStyle(
          feature,
          renderer,
          domain,
          context.state.componentSelectedRowKeys[id] ?? [],
          context.state.mapSelectedFeatureIds[id] ?? [],
          settings.theme.accent,
        );
        applyMountedStyle(mounted.leafletLayer, style, opacity);
      }
    }
  }, [
    resolvedLayers,
    rendererDomains,
    context.state.componentSelectedRowKeys[id],
    context.state.mapSelectedFeatureIds[id],
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
  featureId: string,
): boolean {
  return state?.layerId === layerId && state.featureId === featureId;
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
  selectedRowKeys: readonly string[],
  selectedMapIds: readonly string[],
  accent: string,
): LeafletFeatureStyle {
  let style =
    domain &&
    (renderer.type === "continuousColor" ||
      renderer.type === "proportionalSize")
      ? featureStyleWithDomain(feature, renderer, domain)
      : featureStyle(feature, renderer);
  const selected =
    feature.powerBiRowKeys.some((rowKey) => selectedRowKeys.includes(rowKey)) ||
    selectedMapIds.includes(feature.id);
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
    if (feature.lat !== null && feature.lon !== null)
      bounds.extend([feature.lat, feature.lon]);
    else if (feature.geometry) {
      const geometryBounds = L.geoJSON(feature.geometry).getBounds();
      if (geometryBounds.isValid()) bounds.extend(geometryBounds);
    }
  }
  return bounds;
}
