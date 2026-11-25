import { useEffect, useMemo } from "preact/hooks";
import { indexRows } from "../../data/rowIndex";
import { applyChartStyle } from "./chartStyle";
import { chartDataState } from "./chartDataState";
import type {
    ChartComponent,
    ChartDrillLevelDefinition,
    ChartEventDefinition,
} from "../../schema/hyperpbiSchema";
import type { ComponentInteractionDefinition } from "../../interactions/interactionTypes";
import type { DataRow, NormalizedField } from "../../data/normalizeData";
import { useRenderContext, type RenderContextValue, type ResolvedDatasetView } from "../../render/RenderContext";
import { Card } from "../layout/LayoutBlocks";
import { EmptyState } from "../system/EmptyState";
import { EChartRenderer, type EChartDataEvent, type EChartSelectionRef } from "./EChartRenderer";
import { componentRowKeys, componentRows as selectedSourceRows, executeComponentInteraction } from "../../interactions/componentInteraction";
import { dynamicEventKey } from "../../fragments/fragmentTypes";
import { createInteractionPayload } from "../../interactions/interactionPayload";
import { resolveInteractionPolicy } from "../../interactions/interactionPolicy";
import { getChartAdapter } from "./adapters/registry";
import type { ChartBuildContext, ChartBuildResult, ChartDatumBinding } from "./adapters/types";
import {
    bindingsForBrush,
    bindingsForZoom,
    enableDeclarativeChartEvents,
    sourceRowsForBindings,
    type EChartBrushEvent,
    type EChartZoomEvent,
} from "./chartEvents";

export { formatBuiltInChartTooltip, formatBuiltInChartValue, scaleScatterPointSizes } from "./adapters/shared";

const EMPTY_CHART_SELECTION: EChartSelectionRef[] = [];
const EMPTY_DRILL_PATH: NonNullable<ReturnType<typeof useRenderContext>["state"]["chartDrillState"][string]>["path"] = [];
const MAX_CHART_CATEGORIES = 10_000;
const MAX_SCATTER_POINTS = 30_000;

const categoryLimits = new WeakMap<DataRow[], Map<string, boolean>>();

function chartDisplayLimit(component: ChartComponent, rows: DataRow[]): string | undefined {
    if (component.type === "scatterChart" && rows.length > MAX_SCATTER_POINTS) {
        return `This plot has more than ${MAX_SCATTER_POINTS.toLocaleString()} input rows. Filter the plot or bind a grouped dataset.`;
    }
    if ("category" in component && component.category && component.type !== "advancedChart" && rows.length > MAX_CHART_CATEGORIES) {
        let limits = categoryLimits.get(rows);
        if (!limits) categoryLimits.set(rows, limits = new Map());
        const field = component.category;
        let exceeded = limits.get(field);
        if (exceeded === undefined) {
            const categories = new Set<string>();
            for (const row of rows) {
                categories.add(String(row[field] ?? "(Blank)"));
                if (categories.size > MAX_CHART_CATEGORIES) break;
            }
            exceeded = categories.size > MAX_CHART_CATEGORIES;
            if (limits.size < 64) limits.set(field, exceeded);
        }
        if (exceeded) return `This chart has more than ${MAX_CHART_CATEGORIES.toLocaleString()} categories. Filter or group its data to display it.`;
    }
    return undefined;
}

const sameValue = (left: unknown, right: unknown): boolean => {
    if (left instanceof Date || right instanceof Date) return String(left) === String(right);
    return left === right || String(left ?? "") === String(right ?? "");
};

function componentAtDrillLevel(component: ChartComponent, level: ChartDrillLevelDefinition | undefined): ChartComponent {
    if (!level) return component;
    return {
        ...component,
        dataset: level.dataset,
        ...(level.category ? { category: level.category } : {}),
        ...(level.measure ? { measure: level.measure } : {}),
        ...(level.x ? { x: level.x } : {}),
        ...(level.y ? { y: level.y } : {}),
        ...(level.pointSize ? { pointSize: level.pointSize } : {}),
    } as ChartComponent;
}

function bindingForEvent(bindings: readonly ChartDatumBinding[], event: EChartDataEvent): ChartDatumBinding | undefined {
    if (event.seriesType === "treemap" && event.datumId !== undefined) return bindings.find(binding => binding.seriesIndex === event.seriesIndex && binding.hierarchy?.id === event.datumId);
    const candidates = bindings.filter(candidate => candidate.seriesIndex === event.seriesIndex && candidate.dataIndex === event.dataIndex);
    return candidates.find(candidate => candidate.dataType === event.dataType) ?? (event.dataType === undefined && candidates.length === 1 ? candidates[0] : undefined);
}

function fieldForBindings(bindings: readonly ChartDatumBinding[], explicit?: string): string | undefined {
    if (explicit) return explicit;
    const fields = Array.from(new Set(bindings.map(binding => binding.field).filter((field): field is string => Boolean(field))));
    return fields.length === 1 ? fields[0] : undefined;
}

function eventInteraction(
    component: ChartComponent,
    definition: ChartEventDefinition,
    kind: "zoom" | "range" | "brush",
): ComponentInteractionDefinition | undefined {
    if (kind === "zoom" && !definition.interaction) return undefined;
    const defaults: ComponentInteractionDefinition = kind === "zoom" ? {} : {
        enabled: true,
        trigger: "click",
        internalMode: "filter",
        internalScope: "others",
        externalMode: "selection",
        selectionMode: "replace",
    };
    return {
        ...defaults,
        ...component.interaction,
        ...definition.interaction,
        enabled: definition.interaction?.enabled ?? true,
        trigger: "click",
        targets: definition.targets ?? definition.interaction?.targets ?? component.interaction?.targets,
    };
}

export function ChartBlock({ component }: { component: ChartComponent }) {
    const context = useRenderContext();
    const id = component.id ?? component.type;
    const drillLevels = component.drill?.levels ?? [];
    const storedDrill = context.state.chartDrillState[id];
    const initialLevelIndex = Math.max(0, drillLevels.findIndex(level => level.id === component.drill?.initialLevel));
    const storedLevelIndex = drillLevels.findIndex(level => level.id === storedDrill?.levelId);
    const drillLevelIndex = storedLevelIndex >= 0 ? storedLevelIndex : initialLevelIndex;
    const drillLevel = drillLevels[drillLevelIndex];
    const drillPath = storedLevelIndex >= 0 ? storedDrill?.path ?? EMPTY_DRILL_PATH : EMPTY_DRILL_PATH;
    const datasetView = drillLevel ? context.getDatasetView?.(drillLevel.dataset, id) : undefined;
    const baseRows = context.getRowsForComponent(id);
    const currentRows = useMemo(() => {
        const rows = datasetView?.rows ?? baseRows;
        const parent = drillPath[drillPath.length - 1];
        return drillLevel?.parentField && parent
            ? rows.filter(row => sameValue(row[drillLevel.parentField!], parent.value))
            : rows;
    }, [datasetView?.rows, baseRows, drillLevel?.parentField, drillPath]);
    const effectiveComponent = useMemo(() => componentAtDrillLevel(component, drillLevel), [component, drillLevel]);
    // Presentation controls must not regroup source rows or rebuild identity bindings.
    const adapterRevision = useMemo(() => JSON.stringify({ ...effectiveComponent, chartStyle: undefined }), [effectiveComponent]);
    const adapterComponent=useMemo(()=>({...effectiveComponent,chartStyle:undefined}) as ChartComponent,[adapterRevision]);
    const adapter = getChartAdapter(effectiveComponent);
    const effectiveFields: Record<string, NormalizedField> = datasetView?.fields ?? context.data.fields;
    const powerBiRows = context.powerBiSourceRows ?? context.sourceRows;
    const powerBiRowKeys = context.powerBiSourceRowKeys ?? context.sourceRowKeys;
    const buildContext = useMemo<ChartBuildContext>(() => ({
        theme: context.settings.theme,
        sourceRows: currentRows,
        sourceRowKeys: powerBiRowKeys,
        get sourceIndex() { return indexRows(currentRows); },
        sourceIndicesForRow: row => {
            if (datasetView) {
                const index = indexRows(datasetView.rows).get(row);
                return index === undefined ? [] : datasetView.sourceRowIndicesAt?.(index) ?? datasetView.sourceRowIndices[index] ?? [];
            }
            const index = indexRows(context.sourceRows).get(row);
            if (index === undefined) return [];
            return context.datasetLineage?.[index] ?? [context.sourceRows === powerBiRows ? index : indexRows(powerBiRows).get(row) ?? index];
        },
    }), [context.settings.theme, currentRows, powerBiRowKeys, datasetView, context.sourceRows, context.datasetLineage, powerBiRows]);
    const missing = adapter.fields(effectiveComponent).filter(field => !effectiveFields[field]);
    const displayLimit = useMemo(() => chartDisplayLimit(adapterComponent, currentRows), [adapterComponent, currentRows]);
    // Repeated scoped filters can return the same row view. Cache its
    // preparation for the lifetime of this source and chart definition.
    const prepared = useMemo(() => new WeakMap<DataRow[], ChartBuildResult>(), [
        adapter, adapterComponent, context.settings.theme, context.sourceRows,
        context.datasetLineage, powerBiRows, powerBiRowKeys,
    ]);
    const result = useMemo(() => {
        if (displayLimit) return { option: {}, bindings: [], warnings: [] };
        if (datasetView || currentRows.length < 1_000) return adapter.build(adapterComponent, currentRows, buildContext);
        const cached = prepared.get(currentRows);
        if (cached) return cached;
        const built = adapter.build(adapterComponent, currentRows, buildContext);
        prepared.set(currentRows, built);
        return built;
    }, [adapter, adapterComponent, currentRows, buildContext, displayLimit, datasetView, prepared]);
    const sourceStatus = chartDataState(effectiveComponent.dataset, context.schema.data?.datasets, context.remoteSources);
    const option = useMemo(() => applyChartStyle(enableDeclarativeChartEvents(result.option, component.events), component.chartStyle), [result.option, component.events, component.chartStyle]);
    const selectedRows = useMemo(() => {
        if (context.executionMode === "fragment") {
            const keys = new Set([...componentRowKeys(id, context), ...(context.state.componentSelectedRowKeys[id] ?? [])]);
            return new Set(powerBiRowKeys.flatMap((key, index) => keys.has(key) ? [index] : []));
        }
        return new Set([...selectedSourceRows(id, context), ...(context.state.componentSelectedRows[id] ?? [])]);
    }, [context.state, context.executionMode, id, powerBiRowKeys]);
    const selectionRefs = useMemo<EChartSelectionRef[]>(() => !selectedRows.size ? EMPTY_CHART_SELECTION : result.bindings
        .filter(binding => binding.sourceRowIndices.some(index => selectedRows.has(index)))
        .map(binding => ({ seriesIndex: binding.seriesIndex, dataIndex: binding.dataIndex, dataType: binding.dataType })), [result.bindings, selectedRows]);
    const interactionContext: RenderContextValue = useMemo(() => ({
        ...context,
        sourceRows: powerBiRows,
        sourceRowKeys: powerBiRowKeys,
        datasetLineage: undefined,
        interactionIndexSpace: "powerbi",
        interactionUsesSourceIdentity: Boolean(datasetView || context.datasetLineage),
        selectExternal: context.selectSourceRows ?? context.selectExternal,
    }), [context, powerBiRows, powerBiRowKeys]);

    useEffect(() => {
        if (!storedDrill || storedLevelIndex >= 0) return;
        context.dispatch({ type: "chartDrill", id });
    }, [storedDrill?.levelId, storedLevelIndex, id]);

    const currentInteractionContext = () => ({ ...interactionContext, state: context.getLatestContext?.().state ?? context.state });
    const runBindings = (bindings: ChartDatumBinding[], definition: ChartEventDefinition, kind: "zoom" | "range" | "brush") => {
        const interaction = eventInteraction(effectiveComponent, definition, kind);
        if (!interaction) return;
        const sourceIndices = sourceRowsForBindings(bindings);
        const field = fieldForBindings(bindings, definition.field ?? interaction.field);
        const values = field ? Array.from(new Set(sourceIndices.map(index => powerBiRows[index]?.[field]).filter(value => value !== undefined))) : undefined;
        const sourceField = values?.length ? field : undefined;
        const eventComponent = { ...effectiveComponent, interaction: { ...interaction, field: sourceField } } as ChartComponent;
        const policy = resolveInteractionPolicy(eventComponent, context.config);
        executeComponentInteraction(policy, createInteractionPayload(eventComponent, {
            rowIndices: sourceIndices,
            sourceRowKeys: powerBiRowKeys,
            field: sourceField,
            value: values?.length === 1 ? values[0] : values,
        }), { ...currentInteractionContext(), interactionUsesSourceIdentity: true }, { trigger: "click", dynamicEvent: false });
    };

    const drillFromEvent = (event: EChartDataEvent) => {
        const binding = bindingForEvent(result.bindings, event);
        const next = drillLevels[drillLevelIndex + 1];
        if (!binding || !next) return false;
        context.dispatch({
            type: "chartDrill",
            id,
            value: {
                levelId: next.id,
                path: [
                    ...drillPath,
                    {
                        levelId: drillLevel?.id ?? drillLevels[drillLevelIndex]?.id ?? "root",
                        label: String(binding.value ?? event.name ?? `Level ${drillLevelIndex + 1}`),
                        field: binding.field,
                        value: binding.value,
                    },
                ],
            },
        });
        return true;
    };

    const onDataPoint = (event: EChartDataEvent) => {
        const binding = bindingForEvent(result.bindings, event);
        if (!binding) return;
        const drills = component.drill?.trigger === "click" && drillFromEvent(event);
        const node = binding.hierarchy;
        const eventConfig = node ? component.events?.nodeClick : undefined;
        const eventComponent = eventConfig?.enabled ? {
            ...effectiveComponent,
            interaction: {
                ...effectiveComponent.interaction, ...eventConfig.interaction,
                enabled: eventConfig.interaction?.enabled ?? true, trigger: "click" as const,
                field: eventConfig.field ?? eventConfig.interaction?.field ?? effectiveComponent.interaction?.field,
                targets: eventConfig.targets ?? eventConfig.interaction?.targets ?? effectiveComponent.interaction?.targets,
            },
        } : effectiveComponent;
        const policy = resolveInteractionPolicy(eventComponent, context.config);
        const observed = context.dynamicEventKeys?.has(dynamicEventKey(id, "select")) || node && context.dynamicEventKeys?.has(dynamicEventKey(id, "nodeClick"));
        const indices = observed ? new Set(binding.sourceRowIndices) : undefined;
        const contextRows = indices ? currentRows.filter(row => (node || !binding.field || sameValue(row[binding.field], binding.value)) && buildContext.sourceIndicesForRow?.(row).some(index => indices.has(index))) : undefined;
        const dynamicContexts = node ? { nodeClick: {
            $nodeId: node.id, $parentId: node.parentId, $path: node.path.join(" / "), $level: node.level,
            $category: node.category, $label: node.label, $value: node.value, $multiSelect: event.multiSelect,
            $rowCount: binding.sourceRowIndices.length,
        } } : undefined;
        executeComponentInteraction(drills && !eventConfig?.enabled ? { ...policy, enabled: false } : policy, createInteractionPayload(eventComponent, {
            rowIndices: binding.sourceRowIndices,
            sourceRowKeys: powerBiRowKeys,
            field: binding.field,
            value: binding.value,
            contextRows,
        }), currentInteractionContext(), {
            trigger: "click", dynamicEvent: "select", contextValue: binding.value, dynamicContexts,
            rowIdentityFilter: Boolean(node), multiSelect: event.multiSelect, event: event.event,
        });
    };

    const onZoom = (zoom: EChartZoomEvent) => {
        const previous = (context.getLatestContext?.().state ?? context.state).chartViewState[id] ?? {};
        const signature = JSON.stringify(previous.zoom);
        if (signature !== JSON.stringify(zoom)) context.dispatch({ type: "chartView", id, value: { ...previous, zoom } });
        if (component.events?.zoom?.enabled) runBindings(bindingsForZoom(result.bindings, zoom), component.events.zoom, "zoom");
        if (component.events?.rangeSelect?.enabled) runBindings(bindingsForZoom(result.bindings, zoom), component.events.rangeSelect, "range");
    };

    const onBrush = (brush: EChartBrushEvent) => {
        const bindings = bindingsForBrush(result.bindings, brush);
        const rowIndices = sourceRowsForBindings(bindings);
        const brushRowKeys = rowIndices.map(index => powerBiRowKeys[index]).filter((key): key is string => Boolean(key));
        const previous = (context.getLatestContext?.().state ?? context.state).chartViewState[id] ?? {};
        context.dispatch({ type: "chartView", id, value: { ...previous, brushRowKeys } });
        if (component.events?.brush?.enabled) runBindings(bindings, component.events.brush, "brush");
    };

    const breadcrumbs = component.drill && drillLevels.length > 1 && component.drill.showBreadcrumbs !== false;
    const datasetMissing = drillLevel && !datasetView;

    const body = (
        <>
            {sourceStatus?.status==="loading"&&<div class="hp-chart-warnings" role="status" aria-live="polite">Loading chart data…</div>}
            {breadcrumbs && (
                <nav class="hp-chart-drill" aria-label={`${component.title ?? id} drill path`}>
                    {drillLevels.slice(0, drillLevelIndex + 1).map((level, index) => (
                        <button
                            key={level.id}
                            type="button"
                            aria-current={index === drillLevelIndex ? "page" : undefined}
                            disabled={index === drillLevelIndex}
                            onClick={() => context.dispatch({ type: "chartDrill", id, value: { levelId: level.id, path: drillPath.slice(0, index) } })}
                        >
                            {index === 0 ? level.label ?? "All" : drillPath[index - 1]?.label ?? level.label ?? level.id}
                        </button>
                    ))}
                </nav>
            )}
            {datasetMissing
                ? <EmptyState title="Drill dataset is unavailable">Missing preloaded dataset: {drillLevel.dataset}</EmptyState>
                : missing.length
                    ? <EmptyState title="Chart fields are unavailable">Missing: {Array.from(new Set(missing)).join(", ")}. Valid fields: {Object.keys(effectiveFields).join(", ")}</EmptyState>
                    : displayLimit
                        ? <EmptyState title="Chart display limit reached">{displayLimit} All loaded rows remain available to the dashboard.</EmptyState>
                        : currentRows.length
                        ? <>
                            <EChartRenderer
                                option={option}
                                height={component.height}
                                fill={component.heightMode === "fill" || component.heightMode === "aspectRatio"}
                                initOptions={component.initOptions}
                                setOptionOptions={component.setOption}
                                completeOption={component.type !== "advancedChart"}
                                incrementalData={["barChart", "horizontalBarChart", "lineChart", "areaChart"].includes(component.type) &&
                                    !component.options && !component.setOption && !component.chartStyle && !component.events && !component.drill}
                                selectedDataPoints={selectionRefs}
                                onDataPoint={onDataPoint}
                                onZoom={component.chartStyle?.zoom || component.events?.zoom?.enabled || component.events?.rangeSelect?.enabled ? onZoom : undefined}
                                onBrush={component.events?.brush?.enabled ? onBrush : undefined}
                                onDrill={component.drill && component.drill.trigger !== "click" ? drillFromEvent : undefined}
                                restoredZoom={context.state.chartViewState[id]?.zoom}
                            />
                            {result.warnings.length ? <div class="hp-chart-warnings" role="status">{result.warnings.join(" ")}</div> : null}
                        </>
                        : <EmptyState title={sourceStatus?.status==="loading"?"Loading chart data…":sourceStatus?.status==="error"?"Chart data is unavailable":component.chartStyle?.noDataText ?? "No data for this chart"}>{sourceStatus?.error}</EmptyState>}
        </>
    );
    return component.frameless
        ? <div class="hp-chart-frameless">{body}</div>
        : <Card title={component.title}>{body}</Card>;
}
