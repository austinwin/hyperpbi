import { useEffect, useMemo, useState, useRef, useCallback } from "preact/hooks";
import { MapComponent } from "../../schema/hyperpbiSchema";
import { useRenderContext } from "../../render/RenderContext";
import { resolveMapStyle } from "../../maps/mapStyleResolver";
import { Card } from "../layout/LayoutBlocks";
import { EmptyState } from "../system/EmptyState";
import { MapLayerPanel } from "./MapLayerPanel";
import { LeafletMap, type LeafletMapController } from "./LeafletMap";
import { MapEmptyState } from "./MapEmptyState";
import { MapLegendPanel } from "./MapLegendPanel";
import { MapToolbar } from "./MapToolbar";
import { normalizeMapBindings } from "../../data/normalizeMapBindings";
import { resolveLegacyMapLayers } from "../../maps/model/legacyMapResolver";
import { resolvePowerBiLayer, type MapSourceContext } from "../../maps/sources/mapSourceResolver";
import { executeArcGisFeatureQuery } from "../../maps/arcgis/arcGisFeatureQuery";
import { executeMapJoin } from "../../maps/join/mapJoinEngine";
import { adaptArcGisRenderer, adaptArcGisLabels } from "../../maps/renderers/arcGisRendererAdapter";
import { resolveRenderer } from "../../maps/renderers/mapRendererResolver";
import type { ResolvedMapLayer, ResolvedMapFeature, MapJoinDiagnostics } from "../../maps/model/resolvedMapTypes";
import type { MapLayerDefinition, ArcGisFeatureLayerSource, ArcGisTileLayerSource, ArcGisDynamicLayerSource } from "../../schema/mapSchema";
import { resolvedFeatureValue } from "../../maps/model/mapFeatureValue";

export interface MapViewportState {
    bounds: [number, number, number, number];
    zoom: number;
    width: number;
    height: number;
}

export function MapBlock({ component }: { component: MapComponent }) {
    const context = useRenderContext();
    const { data, sourceRows, settings, config } = context;
    const id = component.id ?? "map";
    const rows = context.getRowsForComponent(id);
    const webAccessAvailable = context.webAccessAvailable;

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
    const handleViewportChange = useCallback((vp: MapViewportState) => {
        viewportRef.current = vp;
        setViewport(vp);
    }, []);

    // ── Map controller ref ───────────────────────────────────────────
    const mapControllerRef = useRef<LeafletMapController | null>(null);
    const handleControllerReady = useCallback((ctrl: LeafletMapController) => {
        mapControllerRef.current = ctrl;
    }, []);

    // ── UI state toggles ─────────────────────────────────────────────
    const [layerPanelOpen, setLayerPanelOpen] = useState(false);
    const [legendOpen, setLegendOpen] = useState(false);

    // ── Asynchronous ArcGIS layer resolution ─────────────────────────
    const [arcGisLayers, setArcGisLayers] = useState<ResolvedMapLayer[]>([]);
    const [arcGisLoading, setArcGisLoading] = useState(false);
    const [arcGisError, setArcGisError] = useState<string | null>(null);
    const abortRef = useRef<AbortController | null>(null);
    const refreshTimersRef = useRef<Map<string, ReturnType<typeof setInterval>>>(new Map());

    const arcGisDefs = useMemo(
        () => layerDefinitions.filter(def => def.source.type !== "powerbi"),
        [layerDefinitions]
    );

    useEffect(() => {
        if (arcGisDefs.length === 0) {
            setArcGisLayers([]);
            setArcGisLoading(false);
            return;
        }

        // Abort previous requests
        if (abortRef.current) {
            abortRef.current.abort();
        }
        // Clear refresh timers
        for (const [, timer] of refreshTimersRef.current) {
            clearInterval(timer);
        }
        refreshTimersRef.current.clear();

        const controller = new AbortController();
        abortRef.current = controller;

        setArcGisLoading(true);
        setArcGisError(null);

        let cancelled = false;

        async function resolveAll() {
            const resolved: ResolvedMapLayer[] = [];

            for (const def of arcGisDefs) {
                if (controller.signal.aborted) break;

                try {
                    // Core package check
                    if (!webAccessAvailable) {
                        resolved.push(createCorePackageErrorShell(def));
                        continue;
                    }

                    if (def.source.type === "arcgisFeature") {
                        const layer = await resolveArcGisFeatureLayer(
                            def, sourceContext, controller.signal,
                            viewportRef.current
                        );
                        if (layer) {
                            resolved.push(layer);
                            // Schedule refresh if configured
                            const src = def.source as ArcGisFeatureLayerSource;
                            const refreshMin = src.refreshIntervalMinutes;
                            if (refreshMin && refreshMin >= 1) {
                                const timer = setInterval(async () => {
                                    // Stale abort handled in resolveArcGisFeatureLayer
                                    try {
                                        const refreshed = await resolveArcGisFeatureLayer(
                                            def, sourceContext, new AbortController().signal,
                                            viewportRef.current
                                        );
                                        if (refreshed) {
                                            setArcGisLayers(prev => {
                                                const others = prev.filter(l => l.id !== refreshed.id);
                                                return [...others, refreshed];
                                            });
                                        }
                                    } catch {
                                        // Keep last successful layer
                                    }
                                }, refreshMin * 60_000);
                                refreshTimersRef.current.set(def.id, timer);
                            }
                        }
                    } else if (def.source.type === "arcgisTile") {
                        resolved.push(createArcGisTileShell(def));
                    } else if (def.source.type === "arcgisDynamic") {
                        resolved.push(createArcGisDynamicShell(def));
                    }
                } catch (err) {
                    if (controller.signal.aborted) break;
                    const msg = err instanceof Error ? err.message : String(err);
                    resolved.push(createArcGisErrorShell(def, msg));
                }
            }

            if (!controller.signal.aborted && !cancelled) {
                setArcGisLayers(resolved);
                setArcGisLoading(false);
            }
        }

        resolveAll();

        return () => {
            cancelled = true;
            controller.abort();
            for (const [, timer] of refreshTimersRef.current) {
                clearInterval(timer);
            }
            refreshTimersRef.current.clear();
        };
    }, [arcGisDefs, sourceContext, webAccessAvailable]);

    // ── Merge all resolved layers ────────────────────────────────────
    const allResolvedLayers: ResolvedMapLayer[] = useMemo(() => {
        return [...syncedLayers, ...arcGisLayers].sort((a, b) => a.order - b.order);
    }, [syncedLayers, arcGisLayers]);

    const mapStyle = useMemo(() => resolveMapStyle(component, settings.theme.primary, map),
        [component, settings.theme.primary, map]);

    // ── Determine if we should show map or empty state ───────────────
    const hasAnyFeatures = allResolvedLayers.some(l => l.features.length > 0);
    const hasTileOrDynamicLayers = allResolvedLayers.some(
        l => l.sourceType === "arcgisTile" || l.sourceType === "arcgisDynamic"
    );

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
        const showLegend = component.settings?.showLegend !== false;

        content = <>
            <div class="hp-map-frame">
                {showToolbar && (
                    <MapToolbar mapId={id} component={component} />
                )}
                <LeafletMap
                    component={component}
                    mapData={map}
                    resolvedLayers={allResolvedLayers}
                    onViewportChange={handleViewportChange}
                    onControllerReady={handleControllerReady}
                />
                {showLegend && (
                    <MapLegendPanel map={map} component={component} style={mapStyle} />
                )}
            </div>
            {map.warnings.length > 0 && <div class="hp-map-warning">{map.warnings.join(" ")}</div>}
        </>;
    }

    return (
        <Card title={component.title}>
            {component.settings?.showLayerControl !== false && allResolvedLayers.length > 0 && (
                <MapLayerPanel mapId={id} layers={allResolvedLayers} />
            )}
            {content}
        </Card>
    );
}

// ── ArcGIS Feature Layer Resolution ───────────────────────────────────

async function resolveArcGisFeatureLayer(
    def: MapLayerDefinition,
    context: MapSourceContext,
    signal: AbortSignal,
    viewport?: MapViewportState | null
): Promise<ResolvedMapLayer | null> {
    const source = def.source as ArcGisFeatureLayerSource;
    const warnings: string[] = [];
    let usedServiceSymbology = false;
    let usedServiceLabels = false;

    // ── Build required fields for query ──────────────────────────────
    const requiredFields = collectArcGisQueryFields(def, source);

    // ── Execute feature query (single metadata path) ──────────────
    const perf = def.performance;
    const isViewportQuery = perf?.viewportQuery === true && viewport !== null;
    const queryResult = await executeArcGisFeatureQuery({
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
    });

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
    } else if (rendererAdaptation.usedServiceSymbology) {
        resolvedRenderer = rendererAdaptation.renderer;
        usedServiceSymbology = true;
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

function collectArcGisQueryFields(
    def: MapLayerDefinition,
    source: ArcGisFeatureLayerSource
): string[] {
    const fields = new Set<string>();

    // Object-ID field is added by the executor
    if (def.join?.serviceField) fields.add(def.join.serviceField);

    // Renderer fields
    collectRendererFields(def.renderer, fields);
    if (source.useServiceRenderer || def.renderer?.type === "service") {
        // Service renderer fields will be collected by the adapter;
        // at minimum include commonly used fields
        fields.add("FID");
    }

    // Label fields
    if (def.labels?.field) fields.add(def.labels.field);

    // Popup fields
    if (def.popup?.fields) {
        for (const f of def.popup.fields) {
            if (f.fieldSource === "service" || f.fieldSource === "joined") {
                fields.add(f.field);
            }
        }
    }

    // Explicit outFields
    if (source.outFields) {
        for (const f of source.outFields) fields.add(f);
    }

    return [...fields];
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

function createArcGisTileShell(def: MapLayerDefinition): ResolvedMapLayer {
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

function createArcGisDynamicShell(def: MapLayerDefinition): ResolvedMapLayer {
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
        },
    };
}

function createArcGisErrorShell(def: MapLayerDefinition, error: string): ResolvedMapLayer {
    return {
        id: def.id,
        name: def.name,
        sourceType: "arcgisFeature",
        geometryType: "unknown",
        visible: true,
        opacity: 1,
        order: def.order ?? 10,
        features: [],
        renderer: { type: "simple", symbol: {} },
        diagnostics: {
            featureCount: 0,
            requestCount: 0,
            loading: false,
            error,
            sourceType: "arcgisFeature",
            geometryType: "unknown",
            usedServiceSymbology: false,
            usedServiceLabels: false,
            warnings: [error],
        },
        loading: false,
    };
}

function createCorePackageErrorShell(def: MapLayerDefinition): ResolvedMapLayer {
    const msg = "External ArcGIS layers require the HyperPBI Maps package. Power BI geometry layers remain available in the Core package.";
    return {
        id: def.id,
        name: def.name,
        sourceType: "arcgisFeature",
        geometryType: "unknown",
        visible: true,
        opacity: 1,
        order: def.order ?? 10,
        features: [],
        renderer: { type: "simple", symbol: {} },
        diagnostics: {
            featureCount: 0,
            requestCount: 0,
            loading: false,
            error: msg,
            sourceType: "arcgisFeature",
            geometryType: "unknown",
            usedServiceSymbology: false,
            usedServiceLabels: false,
            warnings: [msg],
        },
        loading: false,
    };
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
