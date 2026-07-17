import { useEffect, useMemo } from "preact/hooks";
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
import { componentRows as selectedSourceRows, executeComponentInteraction } from "../../interactions/componentInteraction";
import { createInteractionPayload } from "../../interactions/interactionPayload";
import { resolveInteractionPolicy } from "../../interactions/interactionPolicy";
import { getChartAdapter } from "./adapters/registry";
import type { ChartBuildContext, ChartDatumBinding } from "./adapters/types";
import {
    bindingsForBrush,
    bindingsForZoom,
    enableDeclarativeChartEvents,
    sourceRowsForBindings,
    type EChartBrushEvent,
    type EChartZoomEvent,
} from "./chartEvents";

export { formatBuiltInChartTooltip, formatBuiltInChartValue, scaleScatterPointSizes } from "./adapters/shared";

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
    const drillPath = storedLevelIndex >= 0 ? storedDrill?.path ?? [] : [];
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
    const adapter = getChartAdapter(effectiveComponent);
    const effectiveFields: Record<string, NormalizedField> = datasetView?.fields ?? context.data.fields;
    const powerBiRows = context.powerBiSourceRows ?? context.sourceRows;
    const powerBiRowKeys = context.powerBiSourceRowKeys ?? context.sourceRowKeys;
    const powerBiIndex = useMemo(() => new Map(powerBiRows.map((row, index) => [row, index] as const)), [powerBiRows]);
    const datasetRowIndex = useMemo(() => datasetView ? new Map(datasetView.rows.map((row, index) => [row, index] as const)) : undefined, [datasetView]);
    const staticRowIndex = useMemo(() => new Map(context.sourceRows.map((row, index) => [row, index] as const)), [context.sourceRows]);
    const lineageForRow = (row: DataRow): number[] => {
        if (datasetView && datasetRowIndex) {
            const index = datasetRowIndex.get(row);
            return index === undefined ? [] : datasetView.sourceRowIndices[index] ?? [];
        }
        const index = staticRowIndex.get(row);
        if (index === undefined) return [];
        return context.datasetLineage?.[index] ?? [powerBiIndex.get(row) ?? index];
    };
    const buildContext = useMemo<ChartBuildContext>(() => ({
        theme: context.settings.theme,
        sourceRows: currentRows,
        sourceRowKeys: powerBiRowKeys,
        sourceIndex: new Map(currentRows.map((row, index) => [row, index] as const)),
        sourceIndicesForRow: lineageForRow,
    }), [context.settings.theme, currentRows, powerBiRowKeys, datasetView, datasetRowIndex, staticRowIndex, context.datasetLineage, powerBiIndex]);
    const missing = adapter.fields(effectiveComponent).filter(field => !effectiveFields[field]);
    const result = useMemo(() => adapter.build(effectiveComponent, currentRows, buildContext), [adapter, effectiveComponent, currentRows, buildContext]);
    const option = useMemo(() => enableDeclarativeChartEvents(result.option, component.events), [result.option, component.events]);
    const selectedRows = useMemo(() => new Set([
        ...selectedSourceRows(id, { state: context.state }),
        ...(context.state.componentSelectedRows[id] ?? []),
    ]), [context.state, id]);
    const selectionRefs = useMemo<EChartSelectionRef[]>(() => result.bindings
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
        }), { ...interactionContext, interactionUsesSourceIdentity: true }, { trigger: "click" });
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
        if (component.drill?.trigger === "click" && drillFromEvent(event)) return;
        const binding = bindingForEvent(result.bindings, event);
        if (!binding) return;
        executeComponentInteraction(resolveInteractionPolicy(effectiveComponent, context.config), createInteractionPayload(effectiveComponent, {
            rowIndices: binding.sourceRowIndices,
            sourceRowKeys: powerBiRowKeys,
            field: binding.field,
            value: binding.value,
        }), interactionContext, { trigger: "click", multiSelect: event.multiSelect, event: event.event });
    };

    const onZoom = (zoom: EChartZoomEvent) => {
        const previous = context.state.chartViewState[id] ?? {};
        const signature = JSON.stringify(previous.zoom);
        if (signature !== JSON.stringify(zoom)) context.dispatch({ type: "chartView", id, value: { ...previous, zoom } });
        if (component.events?.zoom?.enabled) runBindings(bindingsForZoom(result.bindings, zoom), component.events.zoom, "zoom");
        if (component.events?.rangeSelect?.enabled) runBindings(bindingsForZoom(result.bindings, zoom), component.events.rangeSelect, "range");
    };

    const onBrush = (brush: EChartBrushEvent) => {
        const bindings = bindingsForBrush(result.bindings, brush);
        const rowIndices = sourceRowsForBindings(bindings);
        const brushRowKeys = rowIndices.map(index => powerBiRowKeys[index]).filter((key): key is string => Boolean(key));
        const previous = context.state.chartViewState[id] ?? {};
        context.dispatch({ type: "chartView", id, value: { ...previous, brushRowKeys } });
        if (component.events?.brush?.enabled) runBindings(bindings, component.events.brush, "brush");
    };

    const breadcrumbs = component.drill && drillLevels.length > 1 && component.drill.showBreadcrumbs !== false;
    const datasetMissing = drillLevel && !datasetView;

    return (
        <Card title={component.title}>
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
                    : currentRows.length
                        ? <>
                            <EChartRenderer
                                option={option}
                                height={component.height}
                                fill={component.heightMode === "fill" || component.heightMode === "aspectRatio"}
                                initOptions={component.initOptions}
                                setOptionOptions={component.setOption}
                                completeOption={component.type !== "advancedChart"}
                                selectedDataPoints={selectionRefs}
                                onDataPoint={onDataPoint}
                                onZoom={component.events?.zoom?.enabled || component.events?.rangeSelect?.enabled ? onZoom : undefined}
                                onBrush={component.events?.brush?.enabled ? onBrush : undefined}
                                onDrill={component.drill && component.drill.trigger !== "click" ? drillFromEvent : undefined}
                                restoredZoom={context.state.chartViewState[id]?.zoom}
                            />
                            {result.warnings.length ? <div class="hp-chart-warnings" role="status">{result.warnings.join(" ")}</div> : null}
                        </>
                        : <EmptyState title="No data for this chart" />}
        </Card>
    );
}
