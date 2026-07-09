import { useEffect, useMemo, useState, useRef } from "preact/hooks";
import { MapComponent } from "../../schema/hyperpbiSchema";
import { useRenderContext } from "../../render/RenderContext";
import { resolveMapStyle } from "../../maps/mapStyleResolver";
import { Card } from "../layout/LayoutBlocks";
import { EmptyState } from "../system/EmptyState";
import { MapLayerPanel } from "./MapLayerPanel";
import { LeafletMap } from "./LeafletMap";
import { MapEmptyState } from "./MapEmptyState";
import { MapLegendPanel } from "./MapLegendPanel";
import { MapToolbar } from "./MapToolbar";
import { normalizeMapBindings } from "../../data/normalizeMapBindings";
import { resolveLegacyMapLayers } from "../../maps/model/legacyMapResolver";
import { resolvePowerBiLayer, type MapSourceContext } from "../../maps/sources/mapSourceResolver";
import { executeArcGisFeatureQuery } from "../../maps/arcgis/arcGisFeatureQuery";
import { executeMapJoin } from "../../maps/join/mapJoinEngine";
import { adaptArcGisRenderer, adaptArcGisLabels } from "../../maps/renderers/arcGisRendererAdapter";
import { inspectArcGisService } from "../../maps/arcgis/arcGisServiceInspector";
import { parseArcGisResponse } from "../../maps/arcgis/arcGisResponseParser";
import type { ResolvedMapLayer, ResolvedMapFeature } from "../../maps/model/resolvedMapTypes";
import type { MapLayerDefinition } from "../../schema/mapSchema";
import type { ArcGisFeatureLayerSource } from "../../schema/mapSchema";

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

    // Build rowIndices array mapping each filtered row back to its source index
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

    // ── Asynchronous ArcGIS layer resolution ─────────────────────────
    const [arcGisLayers, setArcGisLayers] = useState<ResolvedMapLayer[]>([]);
    const [arcGisLoading, setArcGisLoading] = useState(false);
    const [arcGisError, setArcGisError] = useState<string | null>(null);
    const abortRef = useRef<AbortController | null>(null);

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
                    if (def.source.type === "arcgisFeature") {
                        const layer = await resolveArcGisFeatureLayer(def, sourceContext, controller.signal);
                        if (layer) resolved.push(layer);
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
        };
    }, [arcGisDefs, sourceContext]);

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
        const showLayerPanel = component.layerPanel?.visible !== false;
        const showLegend = component.settings?.showLegend !== false;

        content = <>
            <div class="hp-map-frame">
                {showToolbar && <MapToolbar component={component} mapId={id} />}
                <LeafletMap
                    component={component}
                    mapData={map}
                    resolvedLayers={allResolvedLayers}
                />
                {showLegend && <MapLegendPanel map={map} component={component} style={mapStyle} />}
            </div>
            {map.warnings.length > 0 && <div class="hp-map-warning">{map.warnings.join(" ")}</div>}
        </>;
    }

    return (
        <Card title={component.title}>
            {component.settings?.showLayerControl !== false && allResolvedLayers.length > 1 && (
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
    signal: AbortSignal
): Promise<ResolvedMapLayer | null> {
    const source = def.source as ArcGisFeatureLayerSource;
    const warnings: string[] = [];
    let usedServiceSymbology = false;
    let usedServiceLabels = false;

    // Inspect service to get metadata
    const inspection = await inspectArcGisService(source.url);
    if (inspection.errors.length > 0) {
        throw new Error(inspection.errors.join("; "));
    }

    const metadata = inspection.selectedLayer;
    const objectIdField = metadata?.objectIdField ?? "OBJECTID";

    // Build required fields for query
    const requiredFields = new Set<string>([objectIdField]);
    if (def.join?.serviceField) requiredFields.add(def.join.serviceField);
    if (def.renderer?.type !== "service" && (def.renderer as any)?.field) {
        requiredFields.add((def.renderer as any).field);
    }
    if (def.labels?.field) requiredFields.add(def.labels.field);
    if (def.popup?.fields) {
        for (const f of def.popup.fields) {
            if (f.fieldSource === "service" || f.fieldSource === "joined") {
                requiredFields.add(f.field);
            }
        }
    }
    if (source.outFields) {
        for (const f of source.outFields) requiredFields.add(f);
    }

    // Execute feature query
    const queryResult = await executeArcGisFeatureQuery({
        url: source.url,
        layerId: source.layerId,
        where: source.mode === "reference" ? "1=1" : undefined,
        definitionExpression: source.definitionExpression,
        outFields: [...requiredFields],
        maxFeatures: 2000,
        requestBatchSize: metadata?.maxRecordCount ?? 1000,
        signal,
    });

    let features: ResolvedMapFeature[] = [];
    let joinDiagnostics: any = undefined;
    let geometryType = queryResult.geometryType ?? "unknown";

    // Adapt service renderer
    const rendererAdaptation = adaptArcGisRenderer(metadata?.drawingInfo?.renderer);
    let resolvedRenderer = def.renderer
        ? { ...def.renderer as any }
        : rendererAdaptation.renderer;
    usedServiceSymbology = rendererAdaptation.usedServiceSymbology;

    // Adapt service labels
    const labelAdaptation = adaptArcGisLabels(metadata?.drawingInfo?.labelingInfo);
    usedServiceLabels = labelAdaptation.usedServiceLabels;
    const resolvedLabels = (def.labels ?? labelAdaptation.labels) as any;

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

        // Copy geometry type from features
        if (features.length > 0) {
            geometryType = features[0].geometryType;
        }

        // Attach render values
        for (const feature of features) {
            feature.renderValue = (def.renderer as any)?.field
                ? feature.joinedAttributes[(def.renderer as any).field]
                    ?? feature.powerBiAttributes[(def.renderer as any).field]
                    ?? (def.renderer as any).field
                : undefined;
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
        }));

        if (features.length > 0) {
            geometryType = features[0].geometryType;
        }
    }

    return {
        id: def.id,
        name: def.name,
        sourceType: "arcgisFeature",
        geometryType: geometryType as any,
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
            geometryType: geometryType as any,
            objectIdField: queryResult.objectIdField,
            joinField: def.join?.serviceField,
            joinDiagnostics,
            usedServiceSymbology,
            usedServiceLabels,
            warnings: [...warnings, ...queryResult.warnings],
        },
        loading: false,
    };
}

// ── Tile/Dynamic Layer Shells ─────────────────────────────────────────

function createArcGisTileShell(def: MapLayerDefinition): ResolvedMapLayer {
    const source = def.source as any;
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
    };
}

function createArcGisDynamicShell(def: MapLayerDefinition): ResolvedMapLayer {
    const source = def.source as any;
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
            warnings: [`ArcGIS layer error: ${error}`],
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
