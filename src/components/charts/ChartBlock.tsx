import { useMemo } from "preact/hooks";
import type { ChartComponent } from "../../schema/hyperpbiSchema";
import { useRenderContext } from "../../render/RenderContext";
import { Card } from "../layout/LayoutBlocks";
import { EmptyState } from "../system/EmptyState";
import { EChartRenderer, type EChartDataEvent, type EChartSelectionRef } from "./EChartRenderer";
import { executeComponentInteraction } from "../../interactions/componentInteraction";
import { createInteractionPayload } from "../../interactions/interactionPayload";
import { resolveInteractionPolicy } from "../../interactions/interactionPolicy";
import { getChartAdapter } from "./adapters/registry";
import type { ChartBuildContext } from "./adapters/types";

export { formatBuiltInChartTooltip, formatBuiltInChartValue, scaleScatterPointSizes } from "./adapters/shared";

export function ChartBlock({ component }: { component: ChartComponent }) {
    const context = useRenderContext();
    const id = component.id ?? component.type;
    const rows = context.getRowsForComponent(id);
    const selectedRows = context.componentRows(id);
    const policy = resolveInteractionPolicy(component, context.config);
    const adapter = getChartAdapter(component);
    const sourceIndex = useMemo(() => new Map(context.sourceRows.map((row, index) => [row, index] as const)), [context.sourceRows]);
    const buildContext = useMemo<ChartBuildContext>(() => ({ theme: context.settings.theme, sourceRows: context.sourceRows, sourceRowKeys: context.sourceRowKeys, sourceIndex }), [context.settings.theme, context.sourceRows, context.sourceRowKeys, sourceIndex]);
    const missing = adapter.fields(component).filter(field => !context.data.fields[field]);
    const result = useMemo(() => adapter.build(component, rows, buildContext), [adapter, component, rows, buildContext]);
    const selectionRefs = useMemo<EChartSelectionRef[]>(() => {
        const selected = new Set(selectedRows);
        return result.bindings
            .filter(binding => binding.sourceRowIndices.some(index => selected.has(index)))
            .map(binding => ({ seriesIndex: binding.seriesIndex, dataIndex: binding.dataIndex, dataType: binding.dataType }));
    }, [result.bindings, selectedRows]);

    const onDataPoint = (event: EChartDataEvent) => {
        const candidates = result.bindings.filter(candidate => candidate.seriesIndex === event.seriesIndex && candidate.dataIndex === event.dataIndex);
        const binding = candidates.find(candidate => candidate.dataType === event.dataType) ?? (event.dataType === undefined && candidates.length === 1 ? candidates[0] : undefined);
        if (!binding) return;
        executeComponentInteraction(policy, createInteractionPayload(component, { rowIndices: binding.sourceRowIndices, sourceRowKeys: context.sourceRowKeys, field: binding.field, value: binding.value }), context, { trigger: "click", multiSelect: event.multiSelect, event: event.event });
    };

    return (
        <Card title={component.title}>
            {missing.length
                ? <EmptyState title="Chart fields are unavailable">Missing: {Array.from(new Set(missing)).join(", ")}. Valid fields: {Object.keys(context.data.fields).join(", ")}</EmptyState>
                : rows.length
                    ? <>
                        <EChartRenderer option={result.option} height={component.height} initOptions={component.initOptions} setOptionOptions={component.setOption} completeOption={component.type !== "advancedChart"} selectedDataPoints={selectionRefs} onDataPoint={onDataPoint} />
                        {result.warnings.length ? <div class="hp-chart-warnings" role="status">{result.warnings.join(" ")}</div> : null}
                    </>
                    : <EmptyState title="No data for this chart" />}
        </Card>
    );
}
