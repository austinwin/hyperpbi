import { useEffect, useMemo, useState, useRef, useCallback } from "preact/hooks";
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
import { resolvePowerBiLayer, type MapSourceContext } from "../../maps/sources/mapSourceResolver";
import { executeArcGisFeatureQuery, type ArcGisFeatureQueryRequest } from "../../maps/arcgis/arcGisFeatureQuery";
import { executeMapJoin } from "../../maps/join/mapJoinEngine";
import { adaptArcGisRenderer, adaptArcGisLabels } from "../../maps/renderers/arcGisRendererAdapter";
import { resolveRenderer } from "../../maps/renderers/mapRendererResolver";
import type { ResolvedMapLayer, ResolvedMapFeature, MapJoinDiagnostics } from "../../maps/model/resolvedMapTypes";
import type { MapLayerDefinition, ArcGisFeatureLayerSource, ArcGisTileLayerSource, ArcGisDynamicLayerSource } from "../../schema/mapSchema";
import { resolvedFeatureValue } from "../../maps/model/mapFeatureValue";
import type { MapToolbarPopover as MapToolbarPopoverState } from "../../render/stateStore";

export interface MapViewportState {
    bounds: [number, number, number, number];
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
    legendDefaultOpen: boolean | undefined
): MapToolbarPopoverState {
    if (stored !== undefined) return stored;
    if (layerDefaultOpen) return "layers";
    if (legendDefaultOpen) return "legend";
    return null;
}

export function roundViewportBounds(
    bounds: MapViewportState["bounds"]
): MapViewportState["bounds"] {
    return bounds.map(value => Math.round(value * 1000) / 1000) as MapViewportState["bounds"];
}

export function viewportEqual(
    left: MapViewportState | null,
    right: MapViewportState
): boolean {
    if (!left) return false;
    const leftBounds = roundViewportBounds(left.bounds);
    const rightBounds = roundViewportBounds(right.bounds);
    return leftBounds.every((value, index) => value === rightBounds[index]) &&
        left.zoom === right.zoom &&
        left.width === right.width &&
        left.height === right.height;
}

export function MapBlock({ component }: { component: MapComponent }) {
    const context = useRenderContext();
    const { data, sourceRows, settings, config } = context;
    const id = component.id ?? "map";
    const rows = context.getRowsForComponent(id);
    const webAccessAvailable = context.providerAccess?.tiles.allowed??context.webAccessAvailable;

    // ── Source row identity mapping ──────────────────────────────────
    const sourceIndexMap = useMemo(
        () => new Map(sourceRows.map((row, index) => [row, index] as const)),
        [sourceRows]
    );

    const rowIndices = useMemo(() => {
        return rows.map(row => sourceIndexMap.get(row) ?? -1);
    }, [rows, sourceIndexMap]);

    const rowKeys = useMemo(() => {
        return rows.map((_row, i) => data.rowKeys[rowIndices[i]] ?? `row-${i}`);
    }, [rows, data.rowKeys, rowIndices]);

    // ── Layer definitions (legacy conversion) ────────────────────────
    const layerDefinitions: MapLayerDefinition[] = useMemo(() => {
        return resolveLegacyMapLayers(component, config.bindings?.map);
    }, [component, config.bindings?.map]);

    // ── Legacy Power BI data normalization (for backward compat) ────
    const map = useMemo(() => normalizeMapBindings(rows, data.fields,
        config.bindings?.map,
        config.providers?.geocoder?.cacheEntries
    ), [rows, data.fields, config.bindings?.map, config.providers?.geocoder?.cacheEntries]);

    const hasExternalLayers = useMemo(() =>
        layerDefinitions.some(def => def.source.type !== "powerbi"),
        [layerDefinitions]
    );

    // ── Source context for resolvers ─────────────────────────────────
    const sourceContext: MapSourceContext = useMemo(() => ({
        rows,
        rowIndices,
        rowKeys,
        fields: data.fields,
        runtimeBindings: config.bindings?.map,
        geocodeCache: config.providers?.geocoder?.cacheEntries,
    }), [rows, rowIndices, rowKeys, data.fields, config.bindings?.map, config.providers?.geocoder?.cacheEntries]);

    // ── Synchronous Power BI layer resolution ────────────────────────
    const syncedLayers: ResolvedMapLayer[] = useMemo(() => {
        return layerDefinitions
            .filter(def => def.source.type === "powerbi")
            .map(def => resolvePowerBiLayer(def, sourceContext));
    }, [layerDefinitions, sourceContext]);

    // ── Viewport state ───────────────────────────────────────────────
    const [viewport, setViewport] = useState<MapViewportState | null>(null);
    const viewportRef = useRef<MapViewportState | null>(null);
    const handleViewportChange = useCallback((next: MapViewportState) => {
        setViewport(previous => {
            if (viewportEqual(previous, next)) return previous;
            viewportRef.current = next;
            return next;
        });
    }, []);

    // ── Map controller ref ───────────────────────────────────────────
    const mapControllerRef = useRef<LeafletMapController | null>(null);
    const handleControllerReady = useCallback((ctrl: LeafletMapController) => {
        mapControllerRef.current = ctrl;
    }, []);

    // ── UI state from reducer (maps to mapUiState[id]) ───────────────
    const mapUiState = context.state.mapUiState[id] ?? {};
    const layerPanelEnabled = component.settings?.showLayerControl !== false &&
        component.layerPanel?.visible !== false;
    const legendEnabled = component.settings?.showLegend !== false;
    const configuredGeocoder = config.providers?.geocoder;
    const searchEnabled = component.search?.enabled === true || (
        component.search?.enabled !== false &&
        Boolean(configuredGeocoder?.enabled && configuredGeocoder.provider !== "none")
    );
    const activeToolbarPopover = resolveMapToolbarPopover(
        mapUiState.toolbarPopover,
        component.layerPanel?.defaultOpen,
        component.legend?.defaultOpen
    );

    // ── Per-layer abort controllers and refresh timers ───────────────
    const layerAbortControllersRef = useRef<Map<string, AbortController>>(new Map());
    const requestVersionsRef = useRef<Map<string, number>>(new Map());
    const layerRefreshTimersRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

    const [arcGisFeatureState, setArcGisFeatureState] =
        useState<Record<string, ArcGisFeatureRuntimeEntry>>({});
    const [layerRuntimeState, setLayerRuntimeState] = useState<Record<
        string,
        { loading?: boolean; error?: string; warnings: string[] }
    >>({});

    const arcGisFeatureDefinitions = useMemo(
        () => layerDefinitions.filter(definition => definition.source.type === "arcgisFeature"),
        [layerDefinitions]
    );

    const staticExternalLayers = useMemo(
        () => layerDefinitions
            .filter(definition =>
                definition.source.type === "arcgisTile" ||
                definition.source.type === "arcgisDynamic"
            )
            .map(definition => definition.source.type === "arcgisTile"
                ? createArcGisTileShell(definition)
                : createArcGisDynamicShell(definition)),
        [layerDefinitions]
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

    const resolveArcGisFeatureDefinition = useCallback(async (
        definition: MapLayerDefinition,
        reason: "initial" | "viewport" | "refresh"
    ) => {
        const previousController = layerAbortControllersRef.current.get(definition.id);
        previousController?.abort();

        const controller = new AbortController();
        layerAbortControllersRef.current.set(definition.id, controller);
        const requestVersion = (requestVersionsRef.current.get(definition.id) ?? 0) + 1;
        requestVersionsRef.current.set(definition.id, requestVersion);

        setArcGisFeatureState(previous => {
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
            const layer = webAccessAvailable
                ? await resolveArcGisFeatureLayer(
                    definition,
                    sourceContext,
                    controller.signal,
                    definition.performance?.viewportQuery === true
                        ? viewportRef.current
                        : null
                )
                : createCorePackageErrorShell(definition);

            if (controller.signal.aborted ||
                requestVersionsRef.current.get(definition.id) !== requestVersion) return;

            setArcGisFeatureState(previous => ({
                ...previous,
                [definition.id]: {
                    layer,
                    loading: false,
                    error: layer.diagnostics.error,
                    requestVersion,
                },
            }));
        } catch (error) {
            if (controller.signal.aborted ||
                requestVersionsRef.current.get(definition.id) !== requestVersion) return;
            const message = error instanceof Error ? error.message : String(error);
            setArcGisFeatureState(previous => {
                const current = previous[definition.id];
                const fallback = current?.layer ?? createArcGisErrorShell(definition, message);
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
            if (layerAbortControllersRef.current.get(definition.id) === controller) {
                layerAbortControllersRef.current.delete(definition.id);
            }
        }
        void reason;
    }, [sourceContext, webAccessAvailable]);

    // Initial/data path: resolve every feature definition, independent of viewport changes.
    useEffect(() => {
        const activeIds = new Set(arcGisFeatureDefinitions.map(definition => definition.id));
        for (const [layerId, controller] of layerAbortControllersRef.current) {
            if (!activeIds.has(layerId)) {
                controller.abort();
                layerAbortControllersRef.current.delete(layerId);
                requestVersionsRef.current.delete(layerId);
            }
        }
        setArcGisFeatureState(previous => Object.fromEntries(
            Object.entries(previous).filter(([layerId]) => activeIds.has(layerId))
        ));
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
            const refreshMinutes = (definition.source as ArcGisFeatureLayerSource).refreshIntervalMinutes;
            if (refreshMinutes === undefined || refreshMinutes < 1) continue;
            const timer = setInterval(() => {
                void resolveArcGisFeatureDefinition(definition, "refresh");
            }, refreshMinutes * 60_000);
            layerRefreshTimersRef.current.set(definition.id, timer);
        }
        return () => {
            for (const [, timer] of layerRefreshTimersRef.current) clearInterval(timer);
            layerRefreshTimersRef.current.clear();
        };
    }, [arcGisFeatureDefinitions, resolveArcGisFeatureDefinition]);

    // Unmount-only cleanup for outstanding requests and managed timers.
    useEffect(() => () => {
        for (const [, controller] of layerAbortControllersRef.current) controller.abort();
        for (const [, timer] of layerRefreshTimersRef.current) clearInterval(timer);
        layerAbortControllersRef.current.clear();
        requestVersionsRef.current.clear();
        layerRefreshTimersRef.current.clear();
    }, []);

    const handleLayerRuntimeStateChange = useCallback((
        layerId: string,
        update: { loading?: boolean; error?: string; warning?: string }
    ) => {
        setLayerRuntimeState(previous => {
            const current = previous[layerId] ?? { warnings: [] };
            const warnings = update.warning && !current.warnings.includes(update.warning)
                ? [...current.warnings, update.warning]
                : current.warnings;
            return {
                ...previous,
                [layerId]: {
                    ...current,
                    ...(update.loading !== undefined ? { loading: update.loading } : {}),
                    ...(update.error !== undefined ? { error: update.error } : {}),
                    warnings,
                },
            };
        });
    }, []);

    // ── Merge all resolved layers ────────────────────────────────────
    const resolvedArcGisFeatureLayers = useMemo(() => Object.values(arcGisFeatureState)
        .map(entry => entry.layer)
        .filter((layer): layer is ResolvedMapLayer => Boolean(layer)), [arcGisFeatureState]);

    const allResolvedLayers: ResolvedMapLayer[] = useMemo(() => {
        return [...syncedLayers, ...resolvedArcGisFeatureLayers, ...staticExternalLayers]
            .map(layer => {
                const runtime = layerRuntimeState[layer.id];
                if (!runtime) return layer;
                const warnings = [...layer.diagnostics.warnings];
                for (const warning of runtime.warnings) {
                    if (!warnings.includes(warning)) warnings.push(warning);
                }
                return {
                    ...layer,
                    loading: runtime.loading ?? layer.loading,
                    error: runtime.error ?? layer.error,
                    diagnostics: {
                        ...layer.diagnostics,
                        loading: runtime.loading ?? layer.diagnostics.loading,
                        error: runtime.error ?? layer.diagnostics.error,
                        warnings,
                    },
                };
            })
            .sort((a, b) => a.order - b.order);
    }, [syncedLayers, resolvedArcGisFeatureLayers, staticExternalLayers, layerRuntimeState]);

    // ── Determine if we should show map or empty state ───────────────
    const hasAnyFeatures = allResolvedLayers.some(l => l.features.length > 0);
    const hasTileOrDynamicLayers = allResolvedLayers.some(
        l => l.sourceType === "arcgisTile" || l.sourceType === "arcgisDynamic"
    );
    const arcGisLoading = Object.values(arcGisFeatureState).some(entry => entry.loading);
    const arcGisError = Object.values(arcGisFeatureState).find(entry => entry.error)?.error;
    const mapRuntimeWarnings = layerRuntimeState.__basemap__?.warnings ?? [];

    const coordinateSystem = component.settings?.coordinateSystem ?? "EPSG:4326";

    let content;
    if (!settings.map.enabled) {
        content = <EmptyState title="Maps are disabled in formatting settings" />;
    } else if (!hasExternalLayers && map.mode === "none") {
        content = <MapEmptyState reason={map.warnings[0]} />;
    } else if (!hasExternalLayers && map.mode === "address" && !map.layers.some(layer => layer.features.some(feature => feature.type === "point"))) {
        content = <MapEmptyState reason={map.warnings[0]} />;
    } else if (!hasExternalLayers && map.mode === "xy" && coordinateSystem.toUpperCase() !== "EPSG:4326") {
        content = <MapEmptyState reason={`Coordinate system ${coordinateSystem} requires an approved projection adapter.`} />;
    } else if (!hasExternalLayers && !map.layers.some(layer => layer.features.length)) {
        content = <MapEmptyState reason={map.warnings[0] ?? "Bound map fields contain no valid locations."} />;
    } else if (hasExternalLayers && arcGisLoading && !hasAnyFeatures && !hasTileOrDynamicLayers) {
        content = <MapEmptyState reason="Loading ArcGIS layers…" />;
    } else if (hasExternalLayers && arcGisError && !hasAnyFeatures && !hasTileOrDynamicLayers) {
        content = <MapEmptyState reason={arcGisError} />;
    } else {
        const showToolbar = component.toolbar?.visible !== false;
        const closePopover = () => context.dispatch({ type: "setMapToolbarPopover", mapId: id, popover: null });
        const popoverContent = activeToolbarPopover === "layers" ? (
            <MapToolbarPopover
                id={mapToolbarPopoverId(id, "layers")}
                title="Layers"
                subtitle={`${allResolvedLayers.length.toLocaleString()} total`}
                onClose={closePopover}
            >
                <MapLayerPanel mapId={id} layers={allResolvedLayers} configuration={component.layerPanel} />
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
                    onResult={result => mapControllerRef.current?.showSearchResult(result)}
                    onClearResult={() => mapControllerRef.current?.clearSearchResult()}
                />
            </MapToolbarPopover>
        ) : undefined;
        content = <>
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
                        onZoomToSelection={() => mapControllerRef.current?.zoomToSelection()}
                        onSetPopover={popover => context.dispatch({ type: "setMapToolbarPopover", mapId: id, popover })}
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
                <div class="hp-map-warning">{[...map.warnings, ...mapRuntimeWarnings].join(" ")}</div>
            )}
        </>;
    }

    return (
        <Card title={component.title}>
            {content}
        </Card>
    );
}

// ── ArcGIS Feature Layer Resolution ───────────────────────────────────

export async function resolveArcGisFeatureLayer(
    def: MapLayerDefinition,
    context: MapSourceContext,
    signal: AbortSignal,
    viewport?: MapViewportState | null
): Promise<ResolvedMapLayer> {
    const source = def.source as ArcGisFeatureLayerSource;
    const warnings: string[] = [];
    let usedServiceSymbology = false;
    let usedServiceLabels = false;

    // ── Build required fields for query ──────────────────────────────
    const requiredFields = collectArcGisQueryFields(def, source);

    // ── Execute feature query (single metadata path) ──────────────
    const perf = def.performance;
    const isViewportQuery = perf?.viewportQuery === true && viewport !== null;
    
    // Build join-key config for join-mode layers
    let joinKeys: ArcGisFeatureQueryRequest["joinKeys"];
    let queryStrategy: ArcGisFeatureQueryRequest["queryStrategy"];
    if (source.mode === "join" && def.join) {
        const joinValues = context.rows.map(row => row[def.join!.powerBiField]);
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
        useServiceRenderer: source.useServiceRenderer === true || def.renderer?.type === "service",
        useServiceLabels: source.useServiceLabels === true && !def.labels,
    };
    const queryResult = await executeArcGisFeatureQuery(queryRequest);

    const metadata = queryResult.metadata;
    const objectIdField = queryResult.objectIdField;

    let features: ResolvedMapFeature[] = [];
    let joinDiagnostics: MapJoinDiagnostics | undefined = undefined;
    let geometryType = queryResult.geometryType ?? "unknown";

    // ── Adapt service renderer ───────────────────────────────────────
    const rendererAdaptation = adaptArcGisRenderer(metadata?.drawingInfo?.renderer);
    warnings.push(...rendererAdaptation.warnings);

    // Determine if we should use service renderer
    const shouldUseServiceRenderer = source.useServiceRenderer === true ||
        def.renderer?.type === "service";

    let resolvedRenderer;
    if (def.renderer && def.renderer.type !== "service") {
        // Configured renderer overrides service
        resolvedRenderer = resolveRenderer(def.renderer, []);
    } else if (shouldUseServiceRenderer && rendererAdaptation.renderer.type !== "simple") {
        resolvedRenderer = rendererAdaptation.renderer;
        usedServiceSymbology = rendererAdaptation.usedServiceSymbology;
    } else {
        resolvedRenderer = { type: "simple" as const, symbol: {} };
    }

    // ── Adapt service labels (opt-in) ────────────────────────────────
    const shouldUseServiceLabels = source.useServiceLabels === true;
    const labelAdaptation = adaptArcGisLabels(metadata?.drawingInfo?.labelingInfo);
    warnings.push(...labelAdaptation.warnings);
    usedServiceLabels = shouldUseServiceLabels && labelAdaptation.usedServiceLabels;

    const resolvedLabels = def.labels
        ? {
            enabled: def.labels.enabled ?? false,
            field: def.labels.field,
            fieldSource: def.labels.fieldSource,
            template: def.labels.template,
            placement: def.labels.placement ?? "center",
            minZoom: def.labels.minZoom,
            maxZoom: def.labels.maxZoom,
            color: def.labels.color ?? "#333333",
            size: def.labels.size ?? 12,
            weight: def.labels.weight ?? "normal",
            haloColor: def.labels.haloColor,
            haloSize: def.labels.haloSize,
            collision: def.labels.collision ?? "none",
            maxLabels: def.labels.maxLabels,
        }
        : shouldUseServiceLabels
            ? {
                enabled: labelAdaptation.labels?.enabled ?? false,
                field: labelAdaptation.labels?.field,
                fieldSource: "service" as const,
                placement: (labelAdaptation.labels?.placement ?? "center") as "center",
                color: labelAdaptation.labels?.color ?? "#333333",
                size: labelAdaptation.labels?.size ?? 12,
                weight: labelAdaptation.labels?.weight ?? "normal",
                collision: (labelAdaptation.labels?.collision ?? "none") as "none" | "hideOverlaps",
            }
            : undefined;

    if (source.mode === "join" && def.join) {
        // Execute join
        const joinResult = executeMapJoin({
            powerBiRows: context.rows,
            powerBiRowIndices: context.rowIndices,
            powerBiRowKeys: context.rowKeys,
            serviceFeatures: queryResult.features,
            definition: def.join,
            layerId: def.id,
        });

        features = joinResult.features;
        joinDiagnostics = joinResult.diagnostics;

        if (features.length > 0) {
            geometryType = features[0].geometryType;
        }
    } else {
        // Reference mode: convert service features directly
        features = queryResult.features.map(sf => ({
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
        } as ResolvedMapFeature));

        if (features.length > 0) {
            geometryType = features[0].geometryType;
        }
    }

    // Resolve renderer with actual features for continuous/proportional renderers
    if (resolvedRenderer && (def.renderer?.type === "continuousColor" ||
        def.renderer?.type === "proportionalSize" ||
        def.renderer?.type === "classBreaks" ||
        def.renderer?.type === "uniqueValue")) {
        resolvedRenderer = resolveRenderer(def.renderer, features);
    }

    return {
        id: def.id,
        name: def.name ?? metadata?.name ?? `Layer ${source.layerId ?? ""}`,
        sourceType: "arcgisFeature",
        geometryType: geometryType as "point" | "multipoint" | "polyline" | "polygon" | "unknown",
        visible: def.visible ?? true,
        opacity: def.opacity ?? 1,
        order: def.order ?? 10,
        features,
        renderer: resolvedRenderer,
        labels: resolvedLabels,
        popup: def.popup ? {
            enabled: def.popup.enabled ?? true,
            title: def.popup.title,
            fields: (def.popup.fields ?? []).map(f => ({
                field: f.field,
                fieldSource: f.fieldSource ?? (source.mode === "join" ? "joined" : "service"),
                label: f.label,
                format: f.format,
                display: f.display ?? "text",
            })),
            actions: (def.popup.actions ?? []).map(a => ({
                id: a.id,
                label: a.label,
                icon: a.icon,
                uiAction: a.uiAction,
            })),
            html: def.popup.html,
        } : undefined,
        tooltip: def.tooltip ? {
            enabled: def.tooltip.enabled ?? true,
            template: def.tooltip.template,
            fields: (def.tooltip.fields ?? []).map(field => ({
                field: field.field,
                fieldSource: field.fieldSource ?? (source.mode === "join" ? "joined" : "service"),
                label: field.label,
                format: field.format,
                display: "text" as const,
            })),
        } : undefined,
        interaction: def.interaction ?? {
            trigger: "click",
            internalMode: "highlight",
            externalMode: source.mode === "join" ? "selection" : "none",
        },
        legend: def.legend,
        diagnostics: {
            featureCount: features.length,
            requestCount: queryResult.requestCount,
            loading: false,
            error: undefined,
            sourceType: "arcgisFeature",
            sourceUrl: queryResult.sourceUrl,
            geometryType: geometryType as "point" | "multipoint" | "polyline" | "polygon" | "unknown",
            objectIdField: queryResult.objectIdField,
            joinField: def.join?.serviceField,
            joinDiagnostics,
            usedServiceSymbology,
            usedServiceLabels,
            cacheUsed: queryResult.usedCache,
            queryStrategy: queryResult.queryStrategy,
            warnings: [...warnings, ...queryResult.warnings],
        },
        loading: false,
        tile: undefined,
        dynamic: undefined,
    };
}

// ── ArcGIS Query Field Collection ─────────────────────────────────────

export function collectArcGisQueryFields(
    def: MapLayerDefinition,
    source: ArcGisFeatureLayerSource
): string[] {
    const fields = new Set<string>();

    // Object-ID field is added by the executor
    if (def.join?.serviceField) fields.add(def.join.serviceField);

    // Renderer fields
    collectRendererFields(def.renderer, fields);
    // Service renderer fields are added by the query executor after metadata load

    // Label fields
    if (def.labels?.field) fields.add(def.labels.field);
    if (def.labels?.template) collectTemplateFields(def.labels.template, fields);

    // Popup fields
    if (def.popup?.fields) {
        for (const f of def.popup.fields) {
            if (f.fieldSource === "service" || f.fieldSource === "joined") {
                fields.add(f.field);
            }
        }
    }

    // Tooltip fields and templates that are resolved from service/joined data
    if (def.tooltip?.fields) {
        for (const field of def.tooltip.fields) {
            if (field.fieldSource === "service" || field.fieldSource === "joined" ||
                field.fieldSource === undefined) {
                fields.add(field.field);
            }
        }
    }
    if (def.tooltip?.template) collectTemplateFields(def.tooltip.template, fields);

    // Explicit outFields
    if (source.outFields) {
        for (const f of source.outFields) fields.add(f);
    }

    return [...fields];
}

function collectTemplateFields(template: string, fields: Set<string>): void {
    for (const match of template.matchAll(/\{\{\s*([^{}]{1,120}?)\s*\}\}/g)) {
        const field = match[1]?.trim();
        if (field) fields.add(field);
    }
}

function collectRendererFields(
    renderer: MapLayerDefinition["renderer"],
    fields: Set<string>
): void {
    if (!renderer) return;
    const r = renderer as unknown as Record<string, unknown>;
    if (r.field && typeof r.field === "string") fields.add(r.field as string);
    if (r.field1 && typeof r.field1 === "string") fields.add(r.field1 as string);
    if (r.field2 && typeof r.field2 === "string") fields.add(r.field2 as string);
    if (r.field3 && typeof r.field3 === "string") fields.add(r.field3 as string);
    if (r.weightField && typeof r.weightField === "string") fields.add(r.weightField as string);
}

// ── Tile/Dynamic Layer Shells ─────────────────────────────────────────

export function createArcGisTileShell(def: MapLayerDefinition): ResolvedMapLayer {
    const source = def.source as ArcGisTileLayerSource;
    return {
        id: def.id,
        name: def.name,
        sourceType: "arcgisTile",
        geometryType: "unknown",
        visible: def.visible ?? true,
        opacity: def.opacity ?? 1,
        order: def.order ?? 5,
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

export function createArcGisDynamicShell(def: MapLayerDefinition): ResolvedMapLayer {
    const source = def.source as ArcGisDynamicLayerSource;
    return {
        id: def.id,
        name: def.name,
        sourceType: "arcgisDynamic",
        geometryType: "unknown",
        visible: def.visible ?? true,
        opacity: def.opacity ?? 1,
        order: def.order ?? 6,
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

export function createArcGisErrorShell(def: MapLayerDefinition, error: string): ResolvedMapLayer {
    const sourceType = def.source.type;
    const shell: ResolvedMapLayer = sourceType === "arcgisTile"
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

export function createCorePackageErrorShell(def: MapLayerDefinition): ResolvedMapLayer {
    const msg = "External ArcGIS layers require the HyperPBI Maps package. Power BI geometry layers remain available in the Core package.";
    return createArcGisErrorShell(def, msg);
}

function mapGeometryFromGeoJson(geometry: GeoJSON.GeoJsonObject | null): "point" | "multipoint" | "polyline" | "polygon" | "unknown" {
    if (!geometry) return "unknown";
    switch (geometry.type) {
        case "Point": return "point";
        case "MultiPoint": return "multipoint";
        case "LineString":
        case "MultiLineString": return "polyline";
        case "Polygon":
        case "MultiPolygon": return "polygon";
        default: return "unknown";
    }
}
