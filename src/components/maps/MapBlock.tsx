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
import {
  LeafletMap,
  type LeafletMapClickEvent,
  type LeafletMapController,
} from "./LeafletMap";
import { MapEmptyState } from "./MapEmptyState";
import { MapLegendPanel } from "./MapLegendPanel";
import { MapToolbar } from "./MapToolbar";
import { mapToolbarPopoverId } from "./MapToolbar";
import { MapToolbarPopover } from "./MapToolbarPopover";
import { MapSearchPanel } from "./MapSearchPanel";
import { MapBookmarkPanel } from "./MapBookmarkPanel";
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
import { withCanonicalMapFeatureKeys } from "../../maps/model/mapFeatureIdentity";
import { MapFeatureDetails } from "./MapFeatureDetails";
import { resolveMapSizing } from "./runtime/mapSizing";
import {
  arcGisLayerRequestRevision,
  arcGisRefreshRevision,
} from "./runtime/arcGisLayerRequestRevision";
import { stableMapRevision } from "./runtime/mapFeatureRevisions";
import { executeArcGisDynamicIdentify } from "../../maps/arcgis/arcGisDynamicIdentify";
import {
  createDynamicIdentifyPresentation,
  type DynamicIdentifyChoice,
} from "./runtime/dynamicIdentifyRuntime";
import {
  DEFAULT_ARCGIS_CACHE_MINUTES,
  DEFAULT_ARCGIS_FEATURE_MAX_FEATURES,
} from "../../maps/performance/mapPerformanceDefaults";

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

interface DynamicIdentifyRuntimeState {
  loading: boolean;
  error?: string;
  layers: ResolvedMapLayer[];
  choices: DynamicIdentifyChoice[];
  activeFeatureKey?: string;
}

const emptyDynamicIdentifyState = (): DynamicIdentifyRuntimeState => ({
  loading: false,
  layers: [],
  choices: [],
});

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

export type ArcGisViewportQueryEligibility =
  | "eligible"
  | "waitingForViewport"
  | "hidden"
  | "outsideZoomRange";

export function arcGisViewportQueryEligibility(
  definition: MapLayerDefinition,
  layerGroups: MapComponent["layerGroups"],
  runtimeVisibility: Readonly<Record<string, boolean>> | undefined,
  viewport: MapViewportState | null,
): ArcGisViewportQueryEligibility {
  if (definition.performance?.viewportQuery !== true) return "eligible";
  if (!viewport) return "waitingForViewport";
  const group = definition.groupId
    ? layerGroups?.find((candidate) => candidate.id === definition.groupId)
    : undefined;
  const authoredVisible =
    (definition.visible ?? true) && (group?.visible ?? true);
  if ((runtimeVisibility?.[definition.id] ?? authoredVisible) === false)
    return "hidden";
  const minimum = definition.visibility?.minZoom;
  const maximum = definition.visibility?.maxZoom;
  if (
    (minimum !== undefined && viewport.zoom < minimum) ||
    (maximum !== undefined && viewport.zoom > maximum)
  )
    return "outsideZoomRange";
  return "eligible";
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
      if (viewportEqual(viewportRef.current, next)) return;
      viewportRef.current = next;
      setViewport(next);
      context.onMapViewportChange?.(id, next);
    },
    [context.onMapViewportChange, id],
  );

  // ── Map controller ref ───────────────────────────────────────────
  const mapControllerRef = useRef<LeafletMapController | null>(null);
  const [activeBookmarkId, setActiveBookmarkId] = useState<string>();
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
  const dynamicIdentifyControllerRef = useRef<AbortController | null>(null);
  const dynamicIdentifyVersionRef = useRef(0);
  const [dynamicIdentifyState, setDynamicIdentifyState] =
    useState<DynamicIdentifyRuntimeState>(emptyDynamicIdentifyState);
  const [layerRuntimeState, setLayerRuntimeState] = useState<
    Record<
      string,
      {
        loading?: boolean;
        error?: string;
        warnings: string[];
        renderMs?: number;
        featureObjectsCreated?: number;
        featureObjectsPatched?: number;
        fullLayerRebuilds?: number;
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
  const arcGisFeatureDefinitionsRef = useRef(arcGisFeatureDefinitions);
  const layerSourceContextsRef = useRef(layerSourceContexts);
  const layerGroupsRef = useRef(component.layerGroups);
  const runtimeLayerVisibilityRef = useRef(
    context.state.mapLayerState[id]?.visibility,
  );
  arcGisFeatureDefinitionsRef.current = arcGisFeatureDefinitions;
  layerSourceContextsRef.current = layerSourceContexts;
  layerGroupsRef.current = component.layerGroups;
  runtimeLayerVisibilityRef.current =
    context.state.mapLayerState[id]?.visibility;
  const arcGisRequestRevision = useMemo(
    () =>
      stableMapRevision(
        arcGisFeatureDefinitions.map((definition) => ({
          id: definition.id,
          revision: arcGisLayerRequestRevision(
            definition,
            layerSourceContexts.get(definition.id),
          ),
        })),
      ),
    [arcGisFeatureDefinitions, layerSourceContexts],
  );
  const refreshRevision = useMemo(
    () => arcGisRefreshRevision(arcGisFeatureDefinitions),
    [arcGisFeatureDefinitions],
  );
  const viewportQueryEligibilityRevision = useMemo(
    () =>
      stableMapRevision(
        arcGisFeatureDefinitions.flatMap((definition) =>
          definition.performance?.viewportQuery === true
            ? [
                {
                  id: definition.id,
                  visible: definition.visible,
                  groupId: definition.groupId,
                  groupVisible: definition.groupId
                    ? component.layerGroups?.find(
                        (candidate) => candidate.id === definition.groupId,
                      )?.visible
                    : undefined,
                  runtimeVisible:
                    context.state.mapLayerState[id]?.visibility?.[definition.id],
                  minZoom: definition.visibility?.minZoom,
                  maxZoom: definition.visibility?.maxZoom,
                },
              ]
            : [],
        ),
      ),
    [
      arcGisFeatureDefinitions,
      component.layerGroups,
      context.state.mapLayerState[id]?.visibility,
      id,
    ],
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
  const dynamicDefinitions = useMemo(
    () =>
      layerDefinitions.filter(
        (definition) => definition.source.type === "arcgisDynamic",
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

  const suspendArcGisFeatureDefinition = useCallback(
    (definition: MapLayerDefinition) => {
      const controller = layerAbortControllersRef.current.get(definition.id);
      if (controller) {
        controller.abort(
          new DOMException("ArcGIS layer query is not currently needed.", "AbortError"),
        );
        layerAbortControllersRef.current.delete(definition.id);
      }
      setArcGisFeatureState((previous) => {
        const current = previous[definition.id];
        if (current?.layer && current.loading === false) return previous;
        const layer = current?.layer ?? createArcGisFeatureShell(definition);
        return {
          ...previous,
          [definition.id]: {
            ...current,
            layer: {
              ...layer,
              loading: false,
              diagnostics: { ...layer.diagnostics, loading: false },
            },
            loading: false,
            requestVersion:
              current?.requestVersion ??
              requestVersionsRef.current.get(definition.id) ??
              0,
          },
        };
      });
    },
    [],
  );

  const resolveArcGisFeatureDefinition = useCallback(
    async (
      definition: MapLayerDefinition,
      reason: "initial" | "viewport" | "refresh",
    ) => {
      if (
        arcGisViewportQueryEligibility(
          definition,
          layerGroupsRef.current,
          runtimeLayerVisibilityRef.current,
          viewportRef.current,
        ) !== "eligible"
      ) {
        suspendArcGisFeatureDefinition(definition);
        return;
      }
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
        const baseLayer = current?.layer ?? createArcGisFeatureShell(definition);
        const retainedLayer = {
          ...baseLayer,
          loading: true,
          diagnostics: {
            ...baseLayer.diagnostics,
            loading: true,
          },
        };
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
              layerSourceContextsRef.current.get(definition.id)!,
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
    [serviceAccess, suspendArcGisFeatureDefinition],
  );

  // Initial/data path: resolve every feature definition, independent of viewport changes.
  useEffect(() => {
    const activeIds = new Set(
      arcGisFeatureDefinitionsRef.current.map((definition) => definition.id),
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
    for (const definition of arcGisFeatureDefinitionsRef.current) {
      void resolveArcGisFeatureDefinition(definition, "initial");
    }
  }, [arcGisRequestRevision, resolveArcGisFeatureDefinition]);

  // Viewport path: only layers explicitly configured for viewport queries rerun.
  useEffect(() => {
    if (viewportSig === null) return;
    for (const definition of arcGisFeatureDefinitionsRef.current) {
      if (definition.performance?.viewportQuery === true) {
        void resolveArcGisFeatureDefinition(definition, "viewport");
      }
    }
  }, [
    viewportSig,
    viewportQueryEligibilityRevision,
    resolveArcGisFeatureDefinition,
  ]);

  // Refresh path: one managed timer for each configured feature layer.
  useEffect(() => {
    for (const [, timer] of layerRefreshTimersRef.current) clearInterval(timer);
    layerRefreshTimersRef.current.clear();
    for (const definition of arcGisFeatureDefinitionsRef.current) {
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
  }, [refreshRevision, resolveArcGisFeatureDefinition]);

  // Unmount-only cleanup for outstanding requests and managed timers.
  useEffect(
    () => () => {
      for (const [, controller] of layerAbortControllersRef.current)
        controller.abort();
      dynamicIdentifyControllerRef.current?.abort();
      dynamicIdentifyControllerRef.current = null;
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
        featureObjectsCreated?: number;
        featureObjectsPatched?: number;
        fullLayerRebuilds?: number;
      },
    ) => {
      setLayerRuntimeState((previous) => {
        const current = previous[layerId] ?? { warnings: [] };
        const warnings =
          update.warning && !current.warnings.includes(update.warning)
            ? [...current.warnings, update.warning]
            : current.warnings;
        const next = {
          ...current,
          ...(update.loading !== undefined
            ? { loading: update.loading }
            : {}),
          ...(update.error !== undefined ? { error: update.error } : {}),
          ...(update.renderMs !== undefined
            ? { renderMs: update.renderMs }
            : {}),
          ...(update.featureObjectsCreated !== undefined
            ? { featureObjectsCreated: update.featureObjectsCreated }
            : {}),
          ...(update.featureObjectsPatched !== undefined
            ? { featureObjectsPatched: update.featureObjectsPatched }
            : {}),
          ...(update.fullLayerRebuilds !== undefined
            ? { fullLayerRebuilds: update.fullLayerRebuilds }
            : {}),
          warnings,
        };
        if (
          next.loading === current.loading &&
          next.error === current.error &&
          next.renderMs === current.renderMs &&
          next.featureObjectsCreated === current.featureObjectsCreated &&
          next.featureObjectsPatched === current.featureObjectsPatched &&
          next.fullLayerRebuilds === current.fullLayerRebuilds &&
          next.warnings === current.warnings
        )
          return previous;
        return {
          ...previous,
          [layerId]: next,
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
    const definitionById = new Map(
      layerDefinitions.map((definition) => [definition.id, definition] as const),
    );
    const ordered = [
      ...syncedLayers,
      ...resolvedArcGisFeatureLayers,
      ...staticExternalLayers,
    ]
      .map((layer) => {
        const authored = definitionById.get(layer.id);
        const presentedLayer =
          layer.sourceType === "arcgisFeature" && authored
            ? applyAuthoredArcGisLayerPresentation(layer, authored)
            : layer;
        const group = presentedLayer.groupId
          ? component.layerGroups?.find(
              (candidate) => candidate.id === presentedLayer.groupId,
            )
          : undefined;
        const groupedLayer = group
          ? {
              ...presentedLayer,
              visible: (group.visible ?? true) && presentedLayer.visible,
              opacity: Math.max(
                0,
                Math.min(1, (group.opacity ?? 1) * presentedLayer.opacity),
              ),
              order: (group.order ?? 0) * 100_000 + presentedLayer.order,
            }
          : presentedLayer;
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
            featureObjectsCreated:
              runtime.featureObjectsCreated ??
              groupedLayer.diagnostics.featureObjectsCreated,
            featureObjectsPatched:
              runtime.featureObjectsPatched ??
              groupedLayer.diagnostics.featureObjectsPatched,
            fullLayerRebuilds:
              runtime.fullLayerRebuilds ?? groupedLayer.diagnostics.fullLayerRebuilds,
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
    layerDefinitions,
    component.layerGroups,
  ]);
  const runtimeLayers = useMemo(
    () => withCanonicalMapFeatureKeys(id, allResolvedLayers),
    [id, allResolvedLayers],
  );
  useEffect(() => {
    context.dispatch({
      type: "reconcileMapFeatures",
      mapId: id,
      availableFeatureKeys: runtimeLayers.flatMap((layer) =>
        layer.features.flatMap((feature) =>
          feature.featureKey ? [feature.featureKey] : [],
        ),
      ),
    });
  }, [id, runtimeLayers]);

  const handleMapClick = useCallback(
    (event: LeafletMapClickEvent): boolean => {
      const visibleState = context.state.mapLayerState[id]?.visibility;
      const candidates = dynamicDefinitions.filter((definition) => {
        const source = definition.source;
        if (source.type !== "arcgisDynamic" || source.identify?.enabled === false)
          return false;
        const resolved = runtimeLayers.find((layer) => layer.id === definition.id);
        if ((visibleState?.[definition.id] ?? resolved?.visible ?? true) === false)
          return false;
        const minimum = Math.max(
          source.minZoom ?? Number.NEGATIVE_INFINITY,
          definition.visibility?.minZoom ?? Number.NEGATIVE_INFINITY,
        );
        const maximum = Math.min(
          source.maxZoom ?? Number.POSITIVE_INFINITY,
          definition.visibility?.maxZoom ?? Number.POSITIVE_INFINITY,
        );
        return event.viewport.zoom >= minimum && event.viewport.zoom <= maximum;
      });
      if (!candidates.length) {
        dynamicIdentifyControllerRef.current?.abort();
        dynamicIdentifyControllerRef.current = null;
        dynamicIdentifyVersionRef.current += 1;
        setDynamicIdentifyState(emptyDynamicIdentifyState());
        if (
          context.state.mapInteractionState[id]?.activeFeature?.kind === "identify"
        )
          context.dispatch({ type: "closeMapFeatureDetails", mapId: id });
        return false;
      }

      dynamicIdentifyControllerRef.current?.abort();
      const controller = new AbortController();
      dynamicIdentifyControllerRef.current = controller;
      const version = ++dynamicIdentifyVersionRef.current;
      setDynamicIdentifyState((previous) => ({
        ...previous,
        loading: true,
        error: undefined,
      }));
      void Promise.allSettled(
        candidates.map(async (definition) => {
          const source = definition.source;
          if (source.type !== "arcgisDynamic") return undefined;
          const access = serviceAccess(source.url);
          if (!access.allowed)
            throw new Error(
              access.reason ?? "ArcGIS dynamic identify access is unavailable.",
            );
          const results = await executeArcGisDynamicIdentify({
            url: source.url,
            latitude: event.anchor.lat,
            longitude: event.anchor.lon,
            mapExtent: event.viewport.bounds,
            imageWidth: event.viewport.width,
            imageHeight: event.viewport.height,
            layerIds: source.layerIds,
            layerDefinitions: source.layerDefinitions,
            identify: source.identify,
            signal: controller.signal,
          });
          return results.length
            ? createDynamicIdentifyPresentation(id, definition, results)
            : undefined;
        }),
      ).then((settled) => {
        if (
          controller.signal.aborted ||
          dynamicIdentifyVersionRef.current !== version
        )
          return;
        const presentations = settled.flatMap((entry) =>
          entry.status === "fulfilled" && entry.value ? [entry.value] : [],
        );
        const failures = settled.flatMap((entry) =>
          entry.status === "rejected"
            ? [entry.reason instanceof Error ? entry.reason.message : String(entry.reason)]
            : [],
        );
        const layers = presentations.map((presentation) => presentation.layer);
        const choices = presentations.flatMap(
          (presentation) => presentation.choices,
        );
        const first = choices[0];
        if (!first) {
          setDynamicIdentifyState({
            loading: false,
            error:
              failures[0] ?? "No Dynamic MapServer features were found at this location.",
            layers: [],
            choices: [],
          });
          if (
            context.state.mapInteractionState[id]?.activeFeature?.kind ===
            "identify"
          )
            context.dispatch({ type: "closeMapFeatureDetails", mapId: id });
          return;
        }
        setDynamicIdentifyState({
          loading: false,
          error: failures[0],
          layers,
          choices,
          activeFeatureKey: first.featureKey,
        });
        const feature = layers
          .find((layer) => layer.id === first.layerId)
          ?.features.find((candidate) => candidate.featureKey === first.featureKey);
        if (!feature) return;
        context.dispatch({
          type: "showMapIdentifiedFeature",
          mapId: id,
          feature: {
            featureKey: first.featureKey,
            layerId: first.layerId,
            featureId: feature.id,
            anchor: event.anchor,
          },
        });
      });
      return true;
    },
    [
      context.state.mapInteractionState[id]?.activeFeature?.kind,
      context.state.mapLayerState[id]?.visibility,
      context.dispatch,
      dynamicDefinitions,
      id,
      runtimeLayers,
      serviceAccess,
    ],
  );

  const activateIdentifyChoice = useCallback(
    (featureKey: string) => {
      const choice = dynamicIdentifyState.choices.find(
        (candidate) => candidate.featureKey === featureKey,
      );
      const feature = choice
        ? dynamicIdentifyState.layers
            .find((layer) => layer.id === choice.layerId)
            ?.features.find((candidate) => candidate.featureKey === featureKey)
        : undefined;
      const anchor = context.state.mapInteractionState[id]?.activeFeature?.anchor;
      if (!choice || !feature) return;
      setDynamicIdentifyState((previous) => ({
        ...previous,
        activeFeatureKey: featureKey,
      }));
      context.dispatch({
        type: "showMapIdentifiedFeature",
        mapId: id,
        feature: {
          featureKey,
          layerId: choice.layerId,
          featureId: feature.id,
          anchor,
        },
      });
    }, [context.state.mapInteractionState[id]?.activeFeature?.anchor, context.dispatch, dynamicIdentifyState.choices, dynamicIdentifyState.layers, id],
  );

  const activeIdentifyGeometry = useMemo(() => {
    if (!dynamicIdentifyState.activeFeatureKey) return null;
    for (const layer of dynamicIdentifyState.layers) {
      const feature = layer.features.find(
        (candidate) =>
          candidate.featureKey === dynamicIdentifyState.activeFeatureKey,
      );
      if (feature) return feature.geometry;
    }
    return null;
  }, [dynamicIdentifyState.activeFeatureKey, dynamicIdentifyState.layers]);
  const detailsLayers = useMemo(
    () => [...runtimeLayers, ...dynamicIdentifyState.layers],
    [runtimeLayers, dynamicIdentifyState.layers],
  );

  useEffect(() => {
    const active = context.state.mapInteractionState[id]?.activeFeature;
    if (!active || active.kind === "identify" || !dynamicIdentifyState.layers.length)
      return;
    dynamicIdentifyControllerRef.current?.abort();
    dynamicIdentifyControllerRef.current = null;
    dynamicIdentifyVersionRef.current += 1;
    setDynamicIdentifyState(emptyDynamicIdentifyState());
  }, [context.state.mapInteractionState[id]?.activeFeature, dynamicIdentifyState.layers.length]);

  useEffect(() => {
    const active = context.state.mapInteractionState[id]?.activeFeature;
    if (active?.kind !== "identify") return;
    const parentLayerId = active.layerId.endsWith("::identify")
      ? active.layerId.slice(0, -"::identify".length)
      : undefined;
    const definitionExists = dynamicDefinitions.some(
      (definition) => definition.id === parentLayerId,
    );
    const visible = parentLayerId
      ? context.state.mapLayerState[id]?.visibility?.[parentLayerId] ?? true
      : false;
    if (definitionExists && visible) return;
    dynamicIdentifyControllerRef.current?.abort();
    dynamicIdentifyControllerRef.current = null;
    dynamicIdentifyVersionRef.current += 1;
    setDynamicIdentifyState(emptyDynamicIdentifyState());
    context.dispatch({ type: "closeMapFeatureDetails", mapId: id });
  }, [
    context.state.mapInteractionState[id]?.activeFeature,
    context.state.mapLayerState[id]?.visibility,
    context.dispatch,
    dynamicDefinitions,
    id,
  ]);

  // ── Determine if we should show map or empty state ───────────────
  const mapRuntimeWarnings = layerRuntimeState.__basemap__?.warnings ?? [];
  const displayedMapWarnings = legacyCompatibility ? map.warnings : [];

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
  } else {
    const sizing = resolveMapSizing(component, {
      studioPreview: context.instanceId?.includes("-preview") === true,
    });
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
          subtitle={`${runtimeLayers.length.toLocaleString()} total`}
          onClose={closePopover}
        >
          <MapLayerPanel
            mapId={id}
            layers={runtimeLayers}
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
          <MapLegendPanel mapId={id} layers={runtimeLayers} />
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
      ) : activeToolbarPopover === "bookmarks" ? (
        <MapToolbarPopover
          id={mapToolbarPopoverId(id, "bookmarks")}
          title="View bookmarks"
          subtitle={`${component.bookmarks?.length ?? 0} saved view${component.bookmarks?.length === 1 ? "" : "s"}`}
          onClose={closePopover}
        >
          <MapBookmarkPanel
            bookmarks={component.bookmarks ?? []}
            activeBookmarkId={activeBookmarkId}
            onActivate={(bookmarkId) => {
              setActiveBookmarkId(bookmarkId);
              mapControllerRef.current?.goToBookmark(bookmarkId);
              closePopover();
            }}
          />
        </MapToolbarPopover>
      ) : undefined;
    content = (
      <>
        <div
          class={`hp-map-frame ${sizing.className}`}
          style={sizing.frameStyle}
          data-height-mode={sizing.mode}
        >
          <div class="hp-map-viewport-clip">
            <LeafletMap
              component={component}
              resolvedLayers={runtimeLayers}
              onViewportChange={handleViewportChange}
              onControllerReady={handleControllerReady}
              onLayerRuntimeStateChange={handleLayerRuntimeStateChange}
              onMapClick={handleMapClick}
              identifyHighlight={activeIdentifyGeometry}
            />
          </div>
          <div class="hp-map-overlay-root">
            <MapFeatureDetails
              mapId={id}
              component={component}
              layers={detailsLayers}
              interaction={context.state.mapInteractionState[id]}
              identifyChoices={dynamicIdentifyState.choices}
              onIdentifyChoice={activateIdentifyChoice}
              onClose={() => {
                if (
                  context.state.mapInteractionState[id]?.activeFeature?.kind ===
                  "identify"
                ) {
                  dynamicIdentifyControllerRef.current?.abort();
                  dynamicIdentifyControllerRef.current = null;
                  dynamicIdentifyVersionRef.current += 1;
                  setDynamicIdentifyState(emptyDynamicIdentifyState());
                }
                const clearSelection =
                  component.featureDetails?.clearSelectionOnClose === true;
                context.dispatch({
                  type: "closeMapFeatureDetails",
                  mapId: id,
                  clearSelection,
                });
if (clearSelection) {
  context.dispatch({ type: "selectComponentRows", id, rows: [] });
  context.dispatch({ type: "selectComponentRowKeys", id, keys: [] });
  context.dispatch({ type: "interactionSignature", id });

  context.clearExternal({
    componentId: id,
    componentType: "map",
  });

  context.clearExternalFilter({
    componentId: id,
    componentType: "map",
  });
}
              }}
              executeAction={(action, event) => {
                context.executeUiAction(action, event);
              }}
            />
            {(dynamicIdentifyState.loading || dynamicIdentifyState.error) && (
              <div
                class={`hp-map-identify-status${dynamicIdentifyState.error ? " is-error" : ""}`}
                role={dynamicIdentifyState.error ? "alert" : "status"}
              >
                {dynamicIdentifyState.loading
                  ? "Identifying map features…"
                  : dynamicIdentifyState.error}
              </div>
            )}
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
              onSetPopover={(popover) =>
                context.dispatch({
                  type: "setMapToolbarPopover",
                  mapId: id,
                  popover,
                })
              }
onClearSelection={() => {
  context.dispatch({ type: "clearMapFeatures", mapId: id });
  context.dispatch({ type: "selectComponentRows", id, rows: [] });
  context.dispatch({ type: "selectComponentRowKeys", id, keys: [] });
  context.dispatch({ type: "interactionSignature", id });

  context.clearExternal({
    componentId: id,
    componentType: "map",
  });

  context.clearExternalFilter({
    componentId: id,
    componentType: "map",
  });

  context.dispatch({
    type: "closeMapFeatureDetails",
    mapId: id,
  });
}}
              />
            )}
          </div>
        </div>
        {[...displayedMapWarnings, ...mapRuntimeWarnings].length > 0 && (
          <div class="hp-map-warning">
            {[...displayedMapWarnings, ...mapRuntimeWarnings].join(" ")}
          </div>
        )}
      </>
    );
  }

  return <Card title={component.title}>{content}</Card>;
}

/** Apply authoring-only changes to retained ArcGIS features without issuing a new request. */
export function applyAuthoredArcGisLayerPresentation(
  layer: ResolvedMapLayer,
  definition: MapLayerDefinition,
): ResolvedMapLayer {
  if (definition.source.type !== "arcgisFeature") return layer;
  const started = globalThis.performance?.now?.() ?? Date.now();
  const source = definition.source;
  const renderer =
    definition.renderer && definition.renderer.type !== "service"
      ? resolveRenderer(
          definition.renderer,
          layer.features,
          defaultAttributeSource(definition, "renderer"),
        )
      : layer.renderer;
  const labels = definition.labels
    ? {
        enabled: definition.labels.enabled ?? false,
        field: definition.labels.field,
        fieldSource:
          definition.labels.fieldSource ?? defaultAttributeSource(definition, "label"),
        template: definition.labels.template,
        placement: definition.labels.placement ?? "center",
        minZoom: definition.labels.minZoom,
        maxZoom: definition.labels.maxZoom,
        color: definition.labels.color ?? "#333333",
        size: definition.labels.size ?? 12,
        weight: definition.labels.weight ?? "normal",
        haloColor: definition.labels.haloColor,
        haloSize: definition.labels.haloSize,
        backgroundColor: definition.labels.backgroundColor,
        padding: definition.labels.padding,
        collision: definition.labels.collision ?? "none",
        maxLabels: definition.labels.maxLabels,
      }
    : layer.labels;
  const popup = definition.popup
    ? {
        enabled: definition.popup.enabled ?? true,
        title: definition.popup.title,
        fields: (definition.popup.fields ?? []).map((field) => ({
          field: field.field,
          fieldSource:
            field.fieldSource ??
            (source.mode === "join" ? "joined" as const : "service" as const),
          label: field.label,
          format: field.format,
          display: field.display ?? "text" as const,
        })),
        actions: (definition.popup.actions ?? []).map((action) => ({ ...action })),
        html: definition.popup.html,
        defaultFieldSource:
          definition.popup.defaultFieldSource ??
          defaultAttributeSource(definition, "popup"),
      }
    : undefined;
  const tooltip = definition.tooltip
    ? {
        enabled: definition.tooltip.enabled ?? true,
        template: definition.tooltip.template,
        fields: (definition.tooltip.fields ?? []).map((field) => ({
          field: field.field,
          fieldSource:
            field.fieldSource ??
            (source.mode === "join" ? "joined" as const : "service" as const),
          label: field.label,
          format: field.format,
          display: "text" as const,
        })),
        defaultFieldSource:
          definition.tooltip.defaultFieldSource ??
          defaultAttributeSource(definition, "tooltip"),
      }
    : undefined;
  return {
    ...layer,
    name: definition.name ?? layer.name,
    visible: definition.visible ?? true,
    opacity: definition.opacity ?? 1,
    order: definition.order ?? 10,
    groupId: definition.groupId,
    renderer,
    labels,
    popup,
    tooltip,
    interaction: definition.interaction ?? layer.interaction,
    legend: definition.legend,
    visibility: definition.visibility,
    diagnostics: {
      ...layer.diagnostics,
      rendererCalculationMs:
        (globalThis.performance?.now?.() ?? Date.now()) - started,
    },
  };
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
  if (def.popup?.title || def.popup?.html)
    checkSource(
      def.popup.defaultFieldSource ?? defaultAttributeSource(def, "popup"),
      `${context.layerPath ?? `/layers/${def.id}`}/popup/defaultFieldSource`,
    );
  if (def.tooltip?.template)
    checkSource(
      def.tooltip.defaultFieldSource ?? defaultAttributeSource(def, "tooltip"),
      `${context.layerPath ?? `/layers/${def.id}`}/tooltip/defaultFieldSource`,
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
    maxFeatures:
      perf?.maxFeatures ?? DEFAULT_ARCGIS_FEATURE_MAX_FEATURES,
    requestBatchSize: perf?.requestBatchSize,
    viewportQuery: isViewportQuery,
    viewport: isViewportQuery ? viewport!.bounds : undefined,
    cacheMinutes: perf?.cacheMinutes ?? DEFAULT_ARCGIS_CACHE_MINUTES,
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
  const validateTemplate = (
    template: string | undefined,
    sourceName: "powerbi" | "service" | "joined",
    path: string,
  ) => {
    if (!template) return;
    for (const match of template.matchAll(/\{\{\s*([^{}]{1,120}?)\s*\}\}/g)) {
      const field = match[1]?.trim();
      if (field)
        validateNamespaceField(
          field,
          sourceName,
          `${path}#${match.index ?? 0}`,
        );
    }
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
  const popupTemplateSource =
    def.popup?.defaultFieldSource ?? defaultAttributeSource(def, "popup");
  validateTemplate(
    def.popup?.title,
    popupTemplateSource,
    `${context.layerPath ?? `/layers/${def.id}`}/popup/title`,
  );
  validateTemplate(
    def.popup?.html,
    popupTemplateSource,
    `${context.layerPath ?? `/layers/${def.id}`}/popup/html`,
  );
  validateTemplate(
    def.tooltip?.template,
    def.tooltip?.defaultFieldSource ?? defaultAttributeSource(def, "tooltip"),
    `${context.layerPath ?? `/layers/${def.id}`}/tooltip/template`,
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
    rendererAdaptation.usedServiceSymbology
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
          defaultFieldSource:
            def.popup.defaultFieldSource ?? defaultAttributeSource(def, "popup"),
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
          defaultFieldSource:
            def.tooltip.defaultFieldSource ?? defaultAttributeSource(def, "tooltip"),
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

// ── External Layer Shells ─────────────────────────────────────────────

export function createArcGisFeatureShell(
  def: MapLayerDefinition,
): ResolvedMapLayer {
  return {
    id: def.id,
    name: def.name,
    sourceType: "arcgisFeature",
    geometryType: "unknown",
    visible: def.visible ?? true,
    opacity: def.opacity ?? 1,
    order: def.order ?? 10,
    groupId: def.groupId,
    datasetName: def.dataset,
    features: [],
    renderer: { type: "simple", symbol: {} },
    diagnostics: {
      featureCount: 0,
      requestCount: 0,
      loading: false,
      sourceType: "arcgisFeature",
      sourceUrl:
        def.source.type === "arcgisFeature" ? def.source.url : undefined,
      geometryType: "unknown",
      usedServiceSymbology: false,
      usedServiceLabels: false,
      warnings: [],
    },
    loading: false,
  };
}

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
      identify: source.identify,
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
        : createArcGisFeatureShell(def);
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
