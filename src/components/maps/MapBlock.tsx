import {
  useEffect,
  useMemo,
  useState,
  useRef,
  useCallback,
} from "preact/hooks";
import { MapComponent } from "../../schema/hyperpbiSchema";
import { useRenderContext } from "../../render/RenderContext";
import { Card } from "../layout/LayoutBlocks";
import { EmptyState } from "../system/EmptyState";
import { MapLayerPanel } from "./MapLayerPanel";
import { LeafletMap, type LeafletMapController } from "./LeafletMap";
import { MapEmptyState } from "./MapEmptyState";
import { MapLegendPanel } from "./MapLegendPanel";
import { MapToolbar } from "./MapToolbar";
import { mapToolbarPopoverId } from "./MapToolbar";
import { MapToolbarPopover } from "./MapToolbarPopover";
import { MapSearchPanel } from "./MapSearchPanel";
import { normalizeMapBindings } from "../../data/normalizeMapBindings";
import { resolveLegacyMapLayers } from "../../maps/model/legacyMapResolver";
import {
  effectiveMapLayerDataset,
  geometryAnalysis,
  resolvePowerBiLayer,
  type MapSourceContext,
} from "../../maps/sources/mapSourceResolver";
import {
  executeArcGisFeatureQuery,
  type ArcGisFeatureQueryRequest,
} from "../../maps/arcgis/arcGisFeatureQuery";
import { executeMapJoin } from "../../maps/join/mapJoinEngine";
import {
  adaptArcGisRenderer,
  adaptArcGisLabels,
} from "../../maps/renderers/arcGisRendererAdapter";
import { resolveRenderer } from "../../maps/renderers/mapRendererResolver";
import type {
  ResolvedMapLayer,
  ResolvedMapFeature,
  MapJoinDiagnostics,
  MapLayerDiagnosticIssue,
} from "../../maps/model/resolvedMapTypes";
import type {
  MapLayerDefinition,
  ArcGisFeatureLayerSource,
  ArcGisTileLayerSource,
  ArcGisDynamicLayerSource,
} from "../../schema/mapSchema";
import type { MapToolbarPopover as MapToolbarPopoverState } from "../../render/stateStore";
import { externalServiceAccess } from "../../providers/providerPolicy";
import { applyGlobalMapFeatureBudget } from "../../maps/performance/mapFeatureBudget";
import { collectArcGisQueryFields } from "../../maps/arcgis/mapArcGisQueryFields";
import {
  attributeSourceAvailable,
  defaultAttributeSource,
  featureAttribute,
} from "../../maps/attributes/mapFeatureAttributes";
import { matchesFilter } from "../../data/filtering";
import type { Primitive } from "../../data/normalizeData";
import { externalFilterTargetFor } from "../../powerbi/externalFilters";
import { appendJsonPointer } from "../../schema/jsonPointer";

export interface MapViewportState {
  bounds: [number, number, number, number];
  center: [number, number];
  zoom: number;
  width: number;
  height: number;
}

export interface ArcGisFeatureRuntimeEntry {
  layer?: ResolvedMapLayer;
  loading: boolean;
  error?: string;
  requestVersion: number;
}

export function resolveMapToolbarPopover(
  stored: MapToolbarPopoverState | undefined,
  layerDefaultOpen: boolean | undefined,
  legendDefaultOpen: boolean | undefined,
): MapToolbarPopoverState {
  if (stored !== undefined) return stored;
  if (layerDefaultOpen) return "layers";
  if (legendDefaultOpen) return "legend";
  return null;
}

export function roundViewportBounds(
  bounds: MapViewportState["bounds"],
): MapViewportState["bounds"] {
  return bounds.map(
    (value) => Math.round(value * 1000) / 1000,
  ) as MapViewportState["bounds"];
}

export function viewportEqual(
  left: MapViewportState | null,
  right: MapViewportState,
): boolean {
  if (!left) return false;
  const leftBounds = roundViewportBounds(left.bounds);
  const rightBounds = roundViewportBounds(right.bounds);
  const roundCoordinate = (value: number) => Math.round(value * 1000) / 1000;
  return (
    leftBounds.every((value, index) => value === rightBounds[index]) &&
    roundCoordinate(left.center[0]) === roundCoordinate(right.center[0]) &&
    roundCoordinate(left.center[1]) === roundCoordinate(right.center[1]) &&
    left.zoom === right.zoom &&
    left.width === right.width &&
    left.height === right.height
  );
}

export function MapBlock({ component }: { component: MapComponent }) {
  const context = useRenderContext();
  const { data, sourceRows, settings, config } = context;
  const id = component.id ?? "map";
  const authoredComponentId = context.ownerByRuntimeId?.[id] ?? id;
  const componentPath =
    context.componentPathById?.[id] ??
    context.componentPathById?.[authoredComponentId] ??
    "/components";
  const rows = context.getRowsForComponent(id);
  const legacyCompatibility = !component.layers?.length;
  const serviceAccess = useCallback(
    (endpoint: string) =>
      externalServiceAccess(
        context.providerAccess,
        endpoint,
        context.webAccessAvailable,
      ),
    [context.providerAccess, context.webAccessAvailable],
  );

  // ── Source row identity mapping ──────────────────────────────────
  const sourceIndexMap = useMemo(
    () => new Map(sourceRows.map((row, index) => [row, index] as const)),
    [sourceRows],
  );

  const rowIndices = useMemo(() => {
    return rows.map((row) => sourceIndexMap.get(row) ?? -1);
  }, [rows, sourceIndexMap]);

  const rowKeys = useMemo(() => {
    return rows.map((_row, i) => data.rowKeys[rowIndices[i]] ?? `row-${i}`);
  }, [rows, data.rowKeys, rowIndices]);

  // ── Layer definitions (legacy conversion) ────────────────────────
  const layerDefinitions: MapLayerDefinition[] = useMemo(() => {
    return resolveLegacyMapLayers(component, config.bindings?.map);
  }, [component, config.bindings?.map]);

  // ── Legacy Power BI data normalization (for backward compat) ────
  const map = useMemo(
    () =>
      normalizeMapBindings(
        rows,
        data.fields,
        config.bindings?.map,
        config.providers?.geocoder?.cacheEntries,
      ),
    [
      rows,
      data.fields,
      config.bindings?.map,
      config.providers?.geocoder?.cacheEntries,
    ],
  );

  const hasExternalLayers = useMemo(
    () => layerDefinitions.some((def) => def.source.type !== "powerbi"),
    [layerDefinitions],
  );

  // ── One source context per effective layer dataset ───────────────
  const layerSourceContexts = useMemo(
    () =>
      new Map(
        layerDefinitions.map((definition, index) => {
          const datasetName = effectiveMapLayerDataset(
            definition,
            component.dataset,
          );
          const view = context.getDatasetView?.(datasetName, id);
          const fallbackAllowed =
            !context.getDatasetView &&
            datasetName === (component.dataset ?? "powerbi");
          const sourceContext: MapSourceContext = view
            ? {
                rows: view.rows,
                rowIndices: view.rowIndices,
                rowKeys: view.rowKeys,
                sourceRowIndices: view.sourceRowIndices,
                sourceRowKeys: view.sourceRowKeys,
                fields: view.fields,
                datasetName,
                datasetFound: true,
                totalRows: view.totalRows,
                geocodeCache: config.providers?.geocoder?.cacheEntries,
                legacyCompatibility,
                layerPath: appendJsonPointer(componentPath, "layers", index),
              }
            : {
                rows: fallbackAllowed ? rows : [],
                rowIndices: fallbackAllowed ? rowIndices : [],
                rowKeys: fallbackAllowed ? rowKeys : [],
                sourceRowIndices: fallbackAllowed
                  ? rowIndices.map((value) => [value])
                  : [],
                sourceRowKeys: fallbackAllowed
                  ? rowKeys.map((value) => [value])
                  : [],
                fields: fallbackAllowed ? data.fields : {},
                datasetName,
                datasetFound: fallbackAllowed,
                totalRows: fallbackAllowed ? rows.length : 0,
                geocodeCache: config.providers?.geocoder?.cacheEntries,
                legacyCompatibility,
                layerPath: appendJsonPointer(componentPath, "layers", index),
              };
          return [definition.id, sourceContext] as const;
        }),
      ),
    [
      layerDefinitions,
      component.dataset,
      context.getDatasetView,
      id,
      config.providers?.geocoder?.cacheEntries,
      legacyCompatibility,
      componentPath,
      rows,
      rowIndices,
      rowKeys,
      data.fields,
    ],
  );

  // ── Synchronous Power BI layer resolution ────────────────────────
  const syncedLayers: ResolvedMapLayer[] = useMemo(() => {
    return layerDefinitions
      .filter((def) => def.source.type === "powerbi")
      .map((def) => resolvePowerBiLayer(def, layerSourceContexts.get(def.id)!));
  }, [layerDefinitions, layerSourceContexts]);

  // ── Viewport state ───────────────────────────────────────────────
  const [viewport, setViewport] = useState<MapViewportState | null>(null);
  const viewportRef = useRef<MapViewportState | null>(null);
  const handleViewportChange = useCallback(
    (next: MapViewportState) => {
      setViewport((previous) => {
        if (viewportEqual(previous, next)) return previous;
        viewportRef.current = next;
        return next;
      });
      context.onMapViewportChange?.(id, next);
    },
    [context.onMapViewportChange, id],
  );

  // ── Map controller ref ───────────────────────────────────────────
  const mapControllerRef = useRef<LeafletMapController | null>(null);
  const handleControllerReady = useCallback((ctrl: LeafletMapController) => {
    mapControllerRef.current = ctrl;
  }, []);

  // ── UI state from reducer (maps to mapUiState[id]) ───────────────
  const mapUiState = context.state.mapUiState[id] ?? {};
  const layerPanelEnabled =
    component.settings?.showLayerControl !== false &&
    component.layerPanel?.visible !== false;
  const legendEnabled = component.settings?.showLegend !== false;
  const configuredGeocoder = config.providers?.geocoder;
  const searchEnabled =
    component.search?.enabled === true ||
    (component.search?.enabled !== false &&
      Boolean(
        configuredGeocoder?.enabled && configuredGeocoder.provider !== "none",
      ));
  const activeToolbarPopover = resolveMapToolbarPopover(
    mapUiState.toolbarPopover,
    component.layerPanel?.defaultOpen,
    component.legend?.defaultOpen,
  );

  // ── Per-layer abort controllers and refresh timers ───────────────
  const layerAbortControllersRef = useRef<Map<string, AbortController>>(
    new Map(),
  );
  const requestVersionsRef = useRef<Map<string, number>>(new Map());
  const layerRefreshTimersRef = useRef<
    Map<string, ReturnType<typeof setInterval>>
  >(new Map());

  const [arcGisFeatureState, setArcGisFeatureState] = useState<
    Record<string, ArcGisFeatureRuntimeEntry>
  >({});
  const [layerRuntimeState, setLayerRuntimeState] = useState<
    Record<
      string,
      {
        loading?: boolean;
        error?: string;
        warnings: string[];
        renderMs?: number;
      }
    >
  >({});

  const arcGisFeatureDefinitions = useMemo(
    () =>
      layerDefinitions.filter(
        (definition) => definition.source.type === "arcgisFeature",
      ),
    [layerDefinitions],
  );

  const staticExternalLayers = useMemo(
    () =>
      layerDefinitions
        .filter(
          (definition) =>
            definition.source.type === "arcgisTile" ||
            definition.source.type === "arcgisDynamic",
        )
        .map((definition) =>
          definition.source.type === "arcgisTile"
            ? createArcGisTileShell(definition)
            : createArcGisDynamicShell(definition),
        ),
    [layerDefinitions],
  );

  // ── Stable viewport signature (rounded for dependency comparison) ──
  const viewportSig = useMemo(() => {
    if (!viewport) return null;
    return [
      ...roundViewportBounds(viewport.bounds),
      viewport.zoom,
      viewport.width,
      viewport.height,
    ].join(",");
  }, [viewport]);

  const resolveArcGisFeatureDefinition = useCallback(
    async (
      definition: MapLayerDefinition,
      reason: "initial" | "viewport" | "refresh",
    ) => {
      const previousController = layerAbortControllersRef.current.get(
        definition.id,
      );
      previousController?.abort();

      const controller = new AbortController();
      layerAbortControllersRef.current.set(definition.id, controller);
      const requestVersion =
        (requestVersionsRef.current.get(definition.id) ?? 0) + 1;
      requestVersionsRef.current.set(definition.id, requestVersion);

      setArcGisFeatureState((previous) => {
        const current = previous[definition.id];
        const retainedLayer = current?.layer
          ? {
              ...current.layer,
              loading: true,
              diagnostics: { ...current.layer.diagnostics, loading: true },
            }
          : undefined;
        return {
          ...previous,
          [definition.id]: {
            layer: retainedLayer,
            loading: true,
            error: undefined,
            requestVersion,
          },
        };
      });

      try {
        const source = definition.source as ArcGisFeatureLayerSource;
        const access = serviceAccess(source.url);
        const layer = access.allowed
          ? await resolveArcGisFeatureLayer(
              definition,
              layerSourceContexts.get(definition.id)!,
              controller.signal,
              definition.performance?.viewportQuery === true
                ? viewportRef.current
                : null,
            )
          : createArcGisErrorShell(
              definition,
              access.reason ?? "ArcGIS service access is unavailable.",
            );

        if (
          controller.signal.aborted ||
          requestVersionsRef.current.get(definition.id) !== requestVersion
        )
          return;

        setArcGisFeatureState((previous) => ({
          ...previous,
          [definition.id]: {
            layer,
            loading: false,
            error: layer.diagnostics.error,
            requestVersion,
          },
        }));
      } catch (error) {
        if (
          controller.signal.aborted ||
          requestVersionsRef.current.get(definition.id) !== requestVersion
        )
          return;
        const message = error instanceof Error ? error.message : String(error);
        setArcGisFeatureState((previous) => {
          const current = previous[definition.id];
          const fallback =
            current?.layer ?? createArcGisErrorShell(definition, message);
          const warnings = fallback.diagnostics.warnings.includes(message)
            ? fallback.diagnostics.warnings
            : [...fallback.diagnostics.warnings, message];
          const retainedLayer: ResolvedMapLayer = {
            ...fallback,
            loading: false,
            error: message,
            diagnostics: {
              ...fallback.diagnostics,
              loading: false,
              error: message,
              warnings,
            },
          };
          return {
            ...previous,
            [definition.id]: {
              layer: retainedLayer,
              loading: false,
              error: message,
              requestVersion,
            },
          };
        });
      } finally {
        if (
          layerAbortControllersRef.current.get(definition.id) === controller
        ) {
          layerAbortControllersRef.current.delete(definition.id);
        }
      }
      void reason;
    },
    [layerSourceContexts, serviceAccess],
  );

  // Initial/data path: resolve every feature definition, independent of viewport changes.
  useEffect(() => {
    const activeIds = new Set(
      arcGisFeatureDefinitions.map((definition) => definition.id),
    );
    for (const [layerId, controller] of layerAbortControllersRef.current) {
      if (!activeIds.has(layerId)) {
        controller.abort();
        layerAbortControllersRef.current.delete(layerId);
        requestVersionsRef.current.delete(layerId);
      }
    }
    setArcGisFeatureState((previous) =>
      Object.fromEntries(
        Object.entries(previous).filter(([layerId]) => activeIds.has(layerId)),
      ),
    );
    for (const definition of arcGisFeatureDefinitions) {
      void resolveArcGisFeatureDefinition(definition, "initial");
    }
  }, [arcGisFeatureDefinitions, resolveArcGisFeatureDefinition]);

  // Viewport path: only layers explicitly configured for viewport queries rerun.
  useEffect(() => {
    if (viewportSig === null) return;
    for (const definition of arcGisFeatureDefinitions) {
      if (definition.performance?.viewportQuery === true) {
        void resolveArcGisFeatureDefinition(definition, "viewport");
      }
    }
  }, [viewportSig, arcGisFeatureDefinitions, resolveArcGisFeatureDefinition]);

  // Refresh path: one managed timer for each configured feature layer.
  useEffect(() => {
    for (const [, timer] of layerRefreshTimersRef.current) clearInterval(timer);
    layerRefreshTimersRef.current.clear();
    for (const definition of arcGisFeatureDefinitions) {
      const refreshMinutes = (definition.source as ArcGisFeatureLayerSource)
        .refreshIntervalMinutes;
      if (refreshMinutes === undefined || refreshMinutes < 1) continue;
      const timer = setInterval(() => {
        void resolveArcGisFeatureDefinition(definition, "refresh");
      }, refreshMinutes * 60_000);
      layerRefreshTimersRef.current.set(definition.id, timer);
    }
    return () => {
      for (const [, timer] of layerRefreshTimersRef.current)
        clearInterval(timer);
      layerRefreshTimersRef.current.clear();
    };
  }, [arcGisFeatureDefinitions, resolveArcGisFeatureDefinition]);

  // Unmount-only cleanup for outstanding requests and managed timers.
  useEffect(
    () => () => {
      for (const [, controller] of layerAbortControllersRef.current)
        controller.abort();
      for (const [, timer] of layerRefreshTimersRef.current)
        clearInterval(timer);
      layerAbortControllersRef.current.clear();
      requestVersionsRef.current.clear();
      layerRefreshTimersRef.current.clear();
    },
    [],
  );

  const handleLayerRuntimeStateChange = useCallback(
    (
      layerId: string,
      update: {
        loading?: boolean;
        error?: string;
        warning?: string;
        renderMs?: number;
      },
    ) => {
      setLayerRuntimeState((previous) => {
        const current = previous[layerId] ?? { warnings: [] };
        const warnings =
          update.warning && !current.warnings.includes(update.warning)
            ? [...current.warnings, update.warning]
            : current.warnings;
        return {
          ...previous,
          [layerId]: {
            ...current,
            ...(update.loading !== undefined
              ? { loading: update.loading }
              : {}),
            ...(update.error !== undefined ? { error: update.error } : {}),
            ...(update.renderMs !== undefined
              ? { renderMs: update.renderMs }
              : {}),
            warnings,
          },
        };
      });
    },
    [],
  );

  // ── Merge all resolved layers ────────────────────────────────────
  const resolvedArcGisFeatureLayers = useMemo(
    () =>
      Object.values(arcGisFeatureState)
        .map((entry) => entry.layer)
        .filter((layer): layer is ResolvedMapLayer => Boolean(layer)),
    [arcGisFeatureState],
  );

  const allResolvedLayers: ResolvedMapLayer[] = useMemo(() => {
    const ordered = [
      ...syncedLayers,
      ...resolvedArcGisFeatureLayers,
      ...staticExternalLayers,
    ]
      .map((layer) => {
        const group = layer.groupId
          ? component.layerGroups?.find(
              (candidate) => candidate.id === layer.groupId,
            )
          : undefined;
        const groupedLayer = group
          ? {
              ...layer,
              visible: (group.visible ?? true) && layer.visible,
              opacity: Math.max(
                0,
                Math.min(1, (group.opacity ?? 1) * layer.opacity),
              ),
              order: (group.order ?? 0) * 100_000 + layer.order,
            }
          : layer;
        const runtime = layerRuntimeState[layer.id];
        if (!runtime) return groupedLayer;
        const warnings = [...groupedLayer.diagnostics.warnings];
        for (const warning of runtime.warnings) {
          if (!warnings.includes(warning)) warnings.push(warning);
        }
        return {
          ...groupedLayer,
          loading: runtime.loading ?? groupedLayer.loading,
          error: runtime.error ?? groupedLayer.error,
          diagnostics: {
            ...groupedLayer.diagnostics,
            loading: runtime.loading ?? groupedLayer.diagnostics.loading,
            error: runtime.error ?? groupedLayer.diagnostics.error,
            layerRenderMs:
              runtime.renderMs ?? groupedLayer.diagnostics.layerRenderMs,
            warnings,
          },
        };
      })
      .sort((a, b) => a.order - b.order);
    return applyGlobalMapFeatureBudget(ordered);
  }, [
    syncedLayers,
    resolvedArcGisFeatureLayers,
    staticExternalLayers,
    layerRuntimeState,
    component.layerGroups,
  ]);

  // ── Determine if we should show map or empty state ───────────────
  const hasAnyFeatures = allResolvedLayers.some((l) => l.features.length > 0);
  const hasTileOrDynamicLayers = allResolvedLayers.some(
    (l) => l.sourceType === "arcgisTile" || l.sourceType === "arcgisDynamic",
  );
  const arcGisLoading = Object.values(arcGisFeatureState).some(
    (entry) => entry.loading,
  );
  const arcGisError = Object.values(arcGisFeatureState).find(
    (entry) => entry.error,
  )?.error;
  const mapRuntimeWarnings = layerRuntimeState.__basemap__?.warnings ?? [];

  const coordinateSystem = component.settings?.coordinateSystem ?? "EPSG:4326";

  let content;
  if (!settings.map.enabled) {
    content = <EmptyState title="Maps are disabled in formatting settings" />;
  } else if (legacyCompatibility && !hasExternalLayers && map.mode === "none") {
    content = <MapEmptyState reason={map.warnings[0]} />;
  } else if (
    legacyCompatibility &&
    !hasExternalLayers &&
    map.mode === "address" &&
    !map.layers.some((layer) =>
      layer.features.some((feature) => feature.type === "point"),
    )
  ) {
    content = <MapEmptyState reason={map.warnings[0]} />;
  } else if (
    legacyCompatibility &&
    !hasExternalLayers &&
    map.mode === "xy" &&
    coordinateSystem.toUpperCase() !== "EPSG:4326"
  ) {
    content = (
      <MapEmptyState
        reason={`Coordinate system ${coordinateSystem} requires an approved projection adapter.`}
      />
    );
  } else if (
    legacyCompatibility &&
    !hasExternalLayers &&
    !map.layers.some((layer) => layer.features.length)
  ) {
    content = (
      <MapEmptyState
        reason={
          map.warnings[0] ?? "Bound map fields contain no valid locations."
        }
      />
    );
  } else if (
    hasExternalLayers &&
    arcGisLoading &&
    !hasAnyFeatures &&
    !hasTileOrDynamicLayers
  ) {
    content = <MapEmptyState reason="Loading ArcGIS layers…" />;
  } else if (
    hasExternalLayers &&
    arcGisError &&
    !hasAnyFeatures &&
    !hasTileOrDynamicLayers
  ) {
    content = <MapEmptyState reason={arcGisError} />;
  } else {
    const showToolbar = component.toolbar?.visible !== false;
    const closePopover = () =>
      context.dispatch({
        type: "setMapToolbarPopover",
        mapId: id,
        popover: null,
      });
    const popoverContent =
      activeToolbarPopover === "layers" ? (
        <MapToolbarPopover
          id={mapToolbarPopoverId(id, "layers")}
          title="Layers"
          subtitle={`${allResolvedLayers.length.toLocaleString()} total`}
          onClose={closePopover}
        >
          <MapLayerPanel
            mapId={id}
            layers={allResolvedLayers}
            groups={component.layerGroups}
            configuration={component.layerPanel}
            onZoomLayer={(layerId) =>
              mapControllerRef.current?.zoomToLayer(layerId)
            }
          />
        </MapToolbarPopover>
      ) : activeToolbarPopover === "legend" ? (
        <MapToolbarPopover
          id={mapToolbarPopoverId(id, "legend")}
          title="Legend"
          subtitle="Visible layers"
          onClose={closePopover}
        >
          <MapLegendPanel mapId={id} layers={allResolvedLayers} />
        </MapToolbarPopover>
      ) : activeToolbarPopover === "search" ? (
        <MapToolbarPopover
          id={mapToolbarPopoverId(id, "search")}
          title="Location search"
          subtitle="User-triggered geocoding"
          onClose={closePopover}
        >
          <MapSearchPanel
            mapId={id}
            definition={component.search}
            onResult={(result) =>
              mapControllerRef.current?.showSearchResult(result)
            }
            onClearResult={() => mapControllerRef.current?.clearSearchResult()}
          />
        </MapToolbarPopover>
      ) : undefined;
    content = (
      <>
        <div class="hp-map-frame">
          {showToolbar && (
            <MapToolbar
              mapId={id}
              component={component}
              activePopover={activeToolbarPopover}
              layerControlEnabled={layerPanelEnabled}
              legendEnabled={legendEnabled}
              searchEnabled={searchEnabled}
              popoverContent={popoverContent}
              onHome={() => mapControllerRef.current?.home()}
              onZoomToSelection={() =>
                mapControllerRef.current?.zoomToSelection()
              }
              onBookmark={(bookmarkId) =>
                mapControllerRef.current?.goToBookmark(bookmarkId)
              }
              onSetPopover={(popover) =>
                context.dispatch({
                  type: "setMapToolbarPopover",
                  mapId: id,
                  popover,
                })
              }
              onClearSelection={() => {
                context.dispatch({ type: "resetInteractions" });
                context.dispatch({ type: "clearMapFeatures", mapId: id });
              }}
            />
          )}
          <LeafletMap
            component={component}
            resolvedLayers={allResolvedLayers}
            onViewportChange={handleViewportChange}
            onControllerReady={handleControllerReady}
            onLayerRuntimeStateChange={handleLayerRuntimeStateChange}
          />
        </div>
        {[...map.warnings, ...mapRuntimeWarnings].length > 0 && (
          <div class="hp-map-warning">
            {[...map.warnings, ...mapRuntimeWarnings].join(" ")}
          </div>
        )}
      </>
    );
  }

  return <Card title={component.title}>{content}</Card>;
}

// ── ArcGIS Feature Layer Resolution ───────────────────────────────────

export async function resolveArcGisFeatureLayer(
  def: MapLayerDefinition,
  context: MapSourceContext,
  signal: AbortSignal,
  viewport?: MapViewportState | null,
): Promise<ResolvedMapLayer> {
  const resolutionStarted = globalThis.performance?.now?.() ?? Date.now();
  const source = def.source as ArcGisFeatureLayerSource;
  const warnings: string[] = [];
  const sourceIssues: MapLayerDiagnosticIssue[] = [];
  let usedServiceSymbology = false;
  let usedServiceLabels = false;
  const datasetName = context.datasetName ?? def.dataset ?? "powerbi";
  const checkSource = (
    sourceName: "powerbi" | "service" | "joined",
    path: string,
    code:
      | "MAP_FILTER_SOURCE_INVALID"
      | "MAP_VISIBILITY_SOURCE_INVALID"
      | "MAP_FIELD_SOURCE_UNAVAILABLE" = "MAP_FIELD_SOURCE_UNAVAILABLE",
  ) => {
    if (attributeSourceAvailable(def, sourceName)) return;
    const message = `Attribute source “${sourceName}” is unavailable for ${source.mode === "join" ? "this joined ArcGIS layer" : "this ArcGIS reference layer"}.`;
    sourceIssues.push({ code, severity: "error", message, path });
    warnings.push(message);
  };
  for (const [index, filter] of (def.filter
    ? Array.isArray(def.filter)
      ? def.filter
      : [def.filter]
    : []
  ).entries())
    checkSource(
      filter.fieldSource ?? defaultAttributeSource(def, "filter"),
      `${context.layerPath ?? `/layers/${def.id}`}/filter/${index}/fieldSource`,
      "MAP_FILTER_SOURCE_INVALID",
    );
  if (def.visibility?.conditionField)
    checkSource(
      def.visibility.conditionFieldSource ??
        defaultAttributeSource(def, "visibility"),
      `${context.layerPath ?? `/layers/${def.id}`}/visibility/conditionFieldSource`,
      "MAP_VISIBILITY_SOURCE_INVALID",
    );
  const rendererSource =
    def.renderer && "fieldSource" in def.renderer
      ? (def.renderer.fieldSource ?? defaultAttributeSource(def, "renderer"))
      : defaultAttributeSource(def, "renderer");
  if (def.renderer && "fieldSource" in def.renderer)
    checkSource(
      rendererSource,
      `${context.layerPath ?? `/layers/${def.id}`}/renderer/fieldSource`,
    );
  if (def.labels?.field)
    checkSource(
      def.labels.fieldSource ?? defaultAttributeSource(def, "label"),
      `${context.layerPath ?? `/layers/${def.id}`}/labels/fieldSource`,
    );
  def.popup?.fields?.forEach((field, index) =>
    checkSource(
      field.fieldSource ?? defaultAttributeSource(def, "popup"),
      `${context.layerPath ?? `/layers/${def.id}`}/popup/fields/${index}/fieldSource`,
    ),
  );
  def.tooltip?.fields?.forEach((field, index) =>
    checkSource(
      field.fieldSource ?? defaultAttributeSource(def, "tooltip"),
      `${context.layerPath ?? `/layers/${def.id}`}/tooltip/fields/${index}/fieldSource`,
    ),
  );
  if (def.interaction?.field)
    checkSource(
      def.interaction.fieldSource ?? defaultAttributeSource(def, "interaction"),
      `${context.layerPath ?? `/layers/${def.id}`}/interaction/fieldSource`,
    );
  if (context.datasetFound === false) {
    const shell = createArcGisErrorShell(
      def,
      `Logical dataset “${datasetName}” is not available for layer “${def.name}”.`,
    );
    shell.datasetName = datasetName;
    shell.diagnostics.effectiveDataset = datasetName;
    shell.diagnostics.issues = [
      {
        code: "MAP_LAYER_DATASET_NOT_FOUND",
        severity: "error",
        message: shell.error!,
        path: `${context.layerPath ?? `/layers/${def.id}`}/dataset`,
      },
    ];
    return shell;
  }

  // ── Build required fields for query ──────────────────────────────
  const requiredFields = collectArcGisQueryFields(def, source);

  // ── Execute feature query (single metadata path) ──────────────
  const perf = def.performance;
  const isViewportQuery = perf?.viewportQuery === true && viewport !== null;

  // Build join-key config for join-mode layers
  let joinKeys: ArcGisFeatureQueryRequest["joinKeys"];
  let queryStrategy: ArcGisFeatureQueryRequest["queryStrategy"];
  if (source.mode === "join" && def.join) {
    const joinValues = context.rows.map((row) => row[def.join!.powerBiField]);
    joinKeys = {
      field: def.join.serviceField,
      values: joinValues,
      normalization: def.join.normalization,
    };
    queryStrategy = def.join.queryStrategy ?? "auto";
  }

  const queryRequest: ArcGisFeatureQueryRequest = {
    url: source.url,
    layerId: source.layerId,
    where: source.mode === "reference" ? "1=1" : undefined,
    definitionExpression: source.definitionExpression,
    outFields: [...requiredFields],
    maxFeatures: perf?.maxFeatures ?? 2000,
    requestBatchSize: perf?.requestBatchSize,
    viewportQuery: isViewportQuery,
    viewport: isViewportQuery ? viewport!.bounds : undefined,
    cacheMinutes: perf?.cacheMinutes,
    signal,
    joinKeys,
    queryStrategy,
    useServiceRenderer:
      source.useServiceRenderer === true || def.renderer?.type === "service",
    useServiceLabels: source.useServiceLabels === true && !def.labels,
  };
  const requestStarted = globalThis.performance?.now?.() ?? Date.now();
  const queryResult = await executeArcGisFeatureQuery(queryRequest);
  const requestMs =
    (globalThis.performance?.now?.() ?? Date.now()) - requestStarted;

  const metadata = queryResult.metadata;
  const objectIdField = queryResult.objectIdField;
  const serviceFields = new Set(
    (metadata?.fields ?? []).map((field) => field.name),
  );
  const joinedFields = new Set(
    (def.join?.aggregations ?? []).map((item) => item.as),
  );
  const validateNamespaceField = (
    field: string | undefined,
    sourceName: "powerbi" | "service" | "joined",
    path: string,
  ): void => {
    if (!field) return;
    const found =
      sourceName === "powerbi"
        ? Boolean(context.fields[field])
        : sourceName === "service"
          ? serviceFields.has(field)
          : joinedFields.has(field);
    if (found) return;
    const code =
      sourceName === "service"
        ? "MAP_SERVICE_FIELD_NOT_FOUND"
        : sourceName === "joined"
          ? "MAP_JOINED_FIELD_NOT_FOUND"
          : "MAP_LAYER_FIELD_NOT_FOUND";
    const message = `Field “${field}” was not found in the ${sourceName === "powerbi" ? `logical dataset “${datasetName}”` : sourceName === "service" ? "ArcGIS service metadata" : "joined aggregation output"}.`;
    sourceIssues.push({
      code,
      severity: "error",
      message,
      path,
      details: { field, fieldSource: sourceName },
    });
    warnings.push(message);
  };
  const rendererRaw = def.renderer as unknown as
    Record<string, unknown> | undefined;
  if (rendererRaw)
    for (const property of ["field", "weightField", "aggregateField"])
      if (typeof rendererRaw[property] === "string")
        validateNamespaceField(
          String(rendererRaw[property]),
          rendererSource,
          `${context.layerPath ?? `/layers/${def.id}`}/renderer/${property}`,
        );
  if (def.labels?.field)
    validateNamespaceField(
      def.labels.field,
      def.labels.fieldSource ?? defaultAttributeSource(def, "label"),
      `${context.layerPath ?? `/layers/${def.id}`}/labels/field`,
    );
  def.popup?.fields?.forEach((field, index) =>
    validateNamespaceField(
      field.field,
      field.fieldSource ?? defaultAttributeSource(def, "popup"),
      `${context.layerPath ?? `/layers/${def.id}`}/popup/fields/${index}/field`,
    ),
  );
  def.tooltip?.fields?.forEach((field, index) =>
    validateNamespaceField(
      field.field,
      field.fieldSource ?? defaultAttributeSource(def, "tooltip"),
      `${context.layerPath ?? `/layers/${def.id}`}/tooltip/fields/${index}/field`,
    ),
  );
  if (def.visibility?.conditionField)
    validateNamespaceField(
      def.visibility.conditionField,
      def.visibility.conditionFieldSource ??
        defaultAttributeSource(def, "visibility"),
      `${context.layerPath ?? `/layers/${def.id}`}/visibility/conditionField`,
    );
  for (const [index, filter] of (def.filter
    ? Array.isArray(def.filter)
      ? def.filter
      : [def.filter]
    : []
  ).entries())
    validateNamespaceField(
      filter.field,
      filter.fieldSource ?? defaultAttributeSource(def, "filter"),
      `${context.layerPath ?? `/layers/${def.id}`}/filter/${index}/field`,
    );
  if (def.interaction?.field) {
    const interactionSource =
      def.interaction.fieldSource ?? defaultAttributeSource(def, "interaction");
    validateNamespaceField(
      def.interaction.field,
      interactionSource,
      `${context.layerPath ?? `/layers/${def.id}`}/interaction/field`,
    );
    if (
      def.interaction.externalMode === "filter" &&
      (interactionSource !== "powerbi" ||
        !externalFilterTargetFor(context.fields[def.interaction.field]))
    ) {
      const message =
        "External Power BI filtering requires a direct Power BI model-column field on a joined or Power BI-backed feature.";
      sourceIssues.push({
        code: "MAP_LAYER_EXTERNAL_FILTER_UNSUPPORTED",
        severity: "error",
        message,
        path: `${context.layerPath ?? `/layers/${def.id}`}/interaction/field`,
      });
      warnings.push(message);
    }
  }

  let features: ResolvedMapFeature[] = [];
  let joinDiagnostics: MapJoinDiagnostics | undefined = undefined;
  const joinIssues: MapLayerDiagnosticIssue[] = [];
  let joinMs: number | undefined;
  let geometryType: ResolvedMapLayer["geometryType"] =
    (queryResult.geometryType ?? "unknown") as ResolvedMapLayer["geometryType"];

  // ── Adapt service renderer ───────────────────────────────────────
  const rendererAdaptation = adaptArcGisRenderer(
    metadata?.drawingInfo?.renderer,
  );
  warnings.push(...rendererAdaptation.warnings);

  // Determine if we should use service renderer
  const shouldUseServiceRenderer =
    source.useServiceRenderer === true || def.renderer?.type === "service";

  let resolvedRenderer;
  if (def.renderer && def.renderer.type !== "service") {
    // Configured renderer overrides service
    resolvedRenderer = resolveRenderer(
      def.renderer,
      [],
      defaultAttributeSource(def, "renderer"),
    );
  } else if (
    shouldUseServiceRenderer &&
    rendererAdaptation.renderer.type !== "simple"
  ) {
    resolvedRenderer = rendererAdaptation.renderer;
    usedServiceSymbology = rendererAdaptation.usedServiceSymbology;
  } else {
    resolvedRenderer = { type: "simple" as const, symbol: {} };
  }

  // ── Adapt service labels (opt-in) ────────────────────────────────
  const shouldUseServiceLabels = source.useServiceLabels === true;
  const labelAdaptation = adaptArcGisLabels(
    metadata?.drawingInfo?.labelingInfo,
  );
  warnings.push(...labelAdaptation.warnings);
  usedServiceLabels =
    shouldUseServiceLabels && labelAdaptation.usedServiceLabels;

  const resolvedLabels = def.labels
    ? {
        enabled: def.labels.enabled ?? false,
        field: def.labels.field,
        fieldSource:
          def.labels.fieldSource ?? defaultAttributeSource(def, "label"),
        template: def.labels.template,
        placement: def.labels.placement ?? "center",
        minZoom: [def.labels.minZoom, def.visibility?.minZoom]
          .filter((value): value is number => value !== undefined)
          .reduce<number | undefined>(
            (current, value) =>
              current === undefined ? value : Math.max(current, value),
            undefined,
          ),
        maxZoom: [def.labels.maxZoom, def.visibility?.maxZoom]
          .filter((value): value is number => value !== undefined)
          .reduce<number | undefined>(
            (current, value) =>
              current === undefined ? value : Math.min(current, value),
            undefined,
          ),
        color: def.labels.color ?? "#333333",
        size: def.labels.size ?? 12,
        weight: def.labels.weight ?? "normal",
        haloColor: def.labels.haloColor,
        haloSize: def.labels.haloSize,
        backgroundColor: def.labels.backgroundColor,
        padding: def.labels.padding,
        collision: def.labels.collision ?? "none",
        maxLabels: def.labels.maxLabels,
      }
    : shouldUseServiceLabels
      ? {
          enabled: labelAdaptation.labels?.enabled ?? false,
          field: labelAdaptation.labels?.field,
          fieldSource: "service" as const,
          placement: (labelAdaptation.labels?.placement ??
            "center") as "center",
          color: labelAdaptation.labels?.color ?? "#333333",
          size: labelAdaptation.labels?.size ?? 12,
          weight: labelAdaptation.labels?.weight ?? "normal",
          collision: (labelAdaptation.labels?.collision ?? "none") as
            "none" | "hideOverlaps",
        }
      : undefined;

  if (source.mode === "join" && def.join) {
    // Execute join
    const joinStarted = globalThis.performance?.now?.() ?? Date.now();
    const joinResult = executeMapJoin({
      powerBiRows: context.rows,
      powerBiRowIndices: context.rowIndices,
      powerBiRowKeys: context.rowKeys,
      powerBiSourceRowIndices: context.sourceRowIndices,
      powerBiSourceRowKeys: context.sourceRowKeys,
      serviceFeatures: queryResult.features,
      definition: def.join,
      layerId: def.id,
    });

    features = joinResult.features;
    joinDiagnostics = joinResult.diagnostics;
    warnings.push(...joinResult.warnings);
    if (joinDiagnostics.powerBiCardinalityViolationCount)
      joinIssues.push({
        code: "MAP_JOIN_CARDINALITY_POWERBI_VIOLATION",
        severity: "warning",
        message: `${joinDiagnostics.powerBiCardinalityViolationCount} normalized Power BI keys violate ${joinDiagnostics.cardinality} cardinality.`,
        path: `${context.layerPath}/join/cardinality`,
        details: { samples: joinDiagnostics.samplePowerBiCardinalityViolations },
      });
    if (joinDiagnostics.serviceCardinalityViolationCount)
      joinIssues.push({
        code: "MAP_JOIN_CARDINALITY_SERVICE_VIOLATION",
        severity: "warning",
        message: `${joinDiagnostics.serviceCardinalityViolationCount} normalized service keys violate ${joinDiagnostics.cardinality} cardinality.`,
        path: `${context.layerPath}/join/cardinality`,
        details: { samples: joinDiagnostics.sampleServiceCardinalityViolations },
      });
    if (
      joinDiagnostics.detailedDiagnosticsRequested &&
      (joinDiagnostics.unmatchedPowerBiKeyCount ||
        joinDiagnostics.unmatchedServiceFeatureCount)
    )
      joinIssues.push({
        code: "MAP_JOIN_UNMATCHED",
        severity: "info",
        message: "The diagnose unmatched policy exposed bounded join mismatch details.",
        path: `${context.layerPath}/join/unmatchedPolicy`,
        details: {
          matchRate: joinDiagnostics.matchRate,
          powerBiSamples: joinDiagnostics.sampleUnmatchedPowerBiKeys,
          serviceSamples: joinDiagnostics.sampleUnmatchedServiceKeys,
        },
      });
    const discardedAggregationValues = joinDiagnostics.aggregationDiagnostics.reduce(
      (sum, item) => sum + item.discardedCount,
      0,
    );
    if (discardedAggregationValues)
      joinIssues.push({
        code: "MAP_JOIN_AGGREGATION_VALUES_DISCARDED",
        severity: "warning",
        message: `${discardedAggregationValues} invalid aggregation values were discarded.`,
        path: `${context.layerPath}/join/aggregations`,
      });
    joinMs = (globalThis.performance?.now?.() ?? Date.now()) - joinStarted;
  } else {
    // Reference mode: convert service features directly
    features = queryResult.features.map(
      (sf) =>
        ({
          id: `${def.id}_${sf.objectId ?? "unknown"}`,
          layerId: def.id,
          geometryType: mapGeometryFromGeoJson(sf.geometry),
          geometry: sf.geometry,
          lat: null,
          lon: null,
          serviceObjectId: sf.objectId,
          serviceAttributes: sf.attributes,
          powerBiAttributes: {},
          powerBiRowIndices: [],
          powerBiRowKeys: [],
          joinedAttributes: {},
          selected: false,
        }) as ResolvedMapFeature,
    );
  }

  const filters = def.filter
    ? Array.isArray(def.filter)
      ? def.filter
      : [def.filter]
    : [];
  if (filters.length)
    features = features.filter((feature) =>
      filters.every((filter) =>
        matchesFilter(
          featureAttribute(
            feature,
            filter.field,
            filter.fieldSource ?? defaultAttributeSource(def, "filter"),
          ) as Primitive,
          filter.operator,
          filter.value,
        ),
      ),
    );
  if (
    def.visibility?.conditionField &&
    def.visibility.conditionValues?.length
  ) {
    const source =
      def.visibility.conditionFieldSource ??
      defaultAttributeSource(def, "visibility");
    features = features.filter((feature) =>
      def.visibility!.conditionValues!.some((value) =>
        Object.is(
          value,
          featureAttribute(feature, def.visibility!.conditionField!, source),
        ),
      ),
    );
  }
  const geometry = geometryAnalysis(features);
  geometryType = geometry.type;
  if (geometry.type === "mixed")
    warnings.push(
      `Layer “${def.name}” contains mixed geometry types; supported features render independently.`,
    );

  // Resolve renderer with actual features for continuous/proportional renderers
  if (
    resolvedRenderer &&
    (def.renderer?.type === "continuousColor" ||
      def.renderer?.type === "proportionalSize" ||
      def.renderer?.type === "classBreaks" ||
      def.renderer?.type === "uniqueValue")
  ) {
    resolvedRenderer = resolveRenderer(
      def.renderer,
      features,
      defaultAttributeSource(def, "renderer"),
    );
    warnings.push(...(resolvedRenderer.classBreakResult?.warnings ?? []));
  }

  return {
    id: def.id,
    name: def.name ?? metadata?.name ?? `Layer ${source.layerId ?? ""}`,
    sourceType: "arcgisFeature",
    geometryType,
    visible: def.visible ?? true,
    opacity: def.opacity ?? 1,
    order: def.order ?? 10,
    groupId: def.groupId,
    datasetName,
    features,
    renderer: resolvedRenderer,
    labels: resolvedLabels,
    popup: def.popup
      ? {
          enabled: def.popup.enabled ?? true,
          title: def.popup.title,
          fields: (def.popup.fields ?? []).map((f) => ({
            field: f.field,
            fieldSource:
              f.fieldSource ?? (source.mode === "join" ? "joined" : "service"),
            label: f.label,
            format: f.format,
            display: f.display ?? "text",
          })),
          actions: (def.popup.actions ?? []).map((a) => ({
            id: a.id,
            label: a.label,
            icon: a.icon,
            uiAction: a.uiAction,
          })),
          html: def.popup.html,
          defaultFieldSource: defaultAttributeSource(def, "popup"),
        }
      : undefined,
    tooltip: def.tooltip
      ? {
          enabled: def.tooltip.enabled ?? true,
          template: def.tooltip.template,
          fields: (def.tooltip.fields ?? []).map((field) => ({
            field: field.field,
            fieldSource:
              field.fieldSource ??
              (source.mode === "join" ? "joined" : "service"),
            label: field.label,
            format: field.format,
            display: "text" as const,
          })),
          defaultFieldSource: defaultAttributeSource(def, "tooltip"),
        }
      : undefined,
    interaction: def.interaction ?? {
      trigger: "click",
      internalMode: "highlight",
      externalMode: source.mode === "join" ? "selection" : "none",
    },
    legend: def.legend,
    visibility: def.visibility,
    diagnostics: {
      featureCount: features.length,
      requestCount: queryResult.requestCount,
      loading: false,
      error: undefined,
      sourceType: "arcgisFeature",
      sourceUrl: queryResult.sourceUrl,
      geometryType,
      objectIdField: queryResult.objectIdField,
      joinField: def.join?.serviceField,
      joinDiagnostics,
      usedServiceSymbology,
      usedServiceLabels,
      cacheUsed: queryResult.usedCache,
      queryStrategy: queryResult.queryStrategy,
      warnings: [...warnings, ...queryResult.warnings],
      issues: [
        ...sourceIssues,
        ...joinIssues,
        ...(geometry.type === "mixed"
          ? [
              {
                code: "MAP_LAYER_MIXED_GEOMETRY" as const,
                severity: "warning" as const,
                message: `Layer “${def.name}” contains mixed geometry types.`,
                details: { counts: geometry.counts },
              },
            ]
          : []),
      ],
      effectiveDataset: datasetName,
      geometryTypeCounts: geometry.counts,
      totalInputRows: context.rows.length,
      filteredRowCount: Math.max(
        0,
        (context.totalRows ?? context.rows.length) - context.rows.length,
      ),
      validFeatureCount: features.length,
      rendererFieldSource:
        def.renderer && "fieldSource" in def.renderer
          ? def.renderer.fieldSource
          : undefined,
      labelFieldSource: def.labels?.fieldSource,
      sourceResolutionMs:
        (globalThis.performance?.now?.() ?? Date.now()) - resolutionStarted,
      requestMs,
      joinMs,
    },
    loading: false,
    tile: undefined,
    dynamic: undefined,
  };
}

// ── ArcGIS Query Field Collection ─────────────────────────────────────
export { collectArcGisQueryFields };

// ── Tile/Dynamic Layer Shells ─────────────────────────────────────────

export function createArcGisTileShell(
  def: MapLayerDefinition,
): ResolvedMapLayer {
  const source = def.source as ArcGisTileLayerSource;
  return {
    id: def.id,
    name: def.name,
    sourceType: "arcgisTile",
    geometryType: "unknown",
    visible: def.visible ?? true,
    opacity: def.opacity ?? 1,
    order: def.order ?? 5,
    groupId: def.groupId,
    datasetName: def.dataset,
    features: [],
    renderer: { type: "simple", symbol: {} },
    diagnostics: {
      featureCount: 0,
      requestCount: 0,
      loading: false,
      sourceType: "arcgisTile",
      sourceUrl: source.url,
      geometryType: "unknown",
      usedServiceSymbology: false,
      usedServiceLabels: false,
      warnings: [],
    },
    loading: false,
    tile: {
      url: source.url,
      attribution: source.attribution,
      minZoom: source.minZoom,
      maxZoom: source.maxZoom,
    },
  };
}

export function createArcGisDynamicShell(
  def: MapLayerDefinition,
): ResolvedMapLayer {
  const source = def.source as ArcGisDynamicLayerSource;
  return {
    id: def.id,
    name: def.name,
    sourceType: "arcgisDynamic",
    geometryType: "unknown",
    visible: def.visible ?? true,
    opacity: def.opacity ?? 1,
    order: def.order ?? 6,
    groupId: def.groupId,
    datasetName: def.dataset,
    features: [],
    renderer: { type: "simple", symbol: {} },
    diagnostics: {
      featureCount: 0,
      requestCount: 0,
      loading: false,
      sourceType: "arcgisDynamic",
      sourceUrl: source.url,
      geometryType: "unknown",
      usedServiceSymbology: false,
      usedServiceLabels: false,
      warnings: [],
    },
    loading: false,
    dynamic: {
      url: source.url,
      layerIds: source.layerIds,
      layerDefinitions: source.layerDefinitions,
      format: source.format,
      transparent: source.transparent,
      minZoom: source.minZoom,
      maxZoom: source.maxZoom,
      attribution: source.attribution,
      debounceMs: source.debounceMs,
    },
  };
}

export function createArcGisErrorShell(
  def: MapLayerDefinition,
  error: string,
): ResolvedMapLayer {
  const sourceType = def.source.type;
  const shell: ResolvedMapLayer =
    sourceType === "arcgisTile"
      ? createArcGisTileShell(def)
      : sourceType === "arcgisDynamic"
        ? createArcGisDynamicShell(def)
        : {
            id: def.id,
            name: def.name,
            sourceType,
            geometryType: "unknown",
            visible: def.visible ?? true,
            opacity: def.opacity ?? 1,
            order: def.order ?? 10,
            features: [],
            renderer: { type: "simple", symbol: {} },
            diagnostics: {
              featureCount: 0,
              requestCount: 0,
              loading: false,
              error,
              sourceType,
              geometryType: "unknown",
              usedServiceSymbology: false,
              usedServiceLabels: false,
              warnings: [error],
            },
            loading: false,
          };
  return {
    ...shell,
    error,
    diagnostics: {
      ...shell.diagnostics,
      loading: false,
      error,
      warnings: shell.diagnostics.warnings.includes(error)
        ? shell.diagnostics.warnings
        : [...shell.diagnostics.warnings, error],
    },
  };
}

export function createCorePackageErrorShell(
  def: MapLayerDefinition,
): ResolvedMapLayer {
  const msg =
    "External ArcGIS layers require the HyperPBI Maps package. Power BI geometry layers remain available in the Core package.";
  return createArcGisErrorShell(def, msg);
}

function mapGeometryFromGeoJson(
  geometry: GeoJSON.GeoJsonObject | null,
): "point" | "multipoint" | "polyline" | "polygon" | "unknown" {
  if (!geometry) return "unknown";
  switch (geometry.type) {
    case "Point":
      return "point";
    case "MultiPoint":
      return "multipoint";
    case "LineString":
    case "MultiLineString":
      return "polyline";
    case "Polygon":
    case "MultiPolygon":
      return "polygon";
    default:
      return "unknown";
  }
}
