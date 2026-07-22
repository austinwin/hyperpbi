import type { EChartsCoreOption } from "echarts/core";
import type { DataRow } from "../../../data/normalizeData";
import type { ChartComponent } from "../../../schema/hyperpbiSchema";
import type { RuntimeSettings } from "../../../runtime/runtimeSettings";

export interface ChartDatumBinding {
    seriesIndex: number;
    dataIndex: number;
    dataType?: "node" | "edge";
    sourceRowIndices: number[];
    field?: string;
    value?: unknown;
}

export interface ChartBuildResult { option: EChartsCoreOption; bindings: ChartDatumBinding[]; warnings: string[]; }
export interface ChartBuildContext { theme: RuntimeSettings["theme"]; sourceRows: DataRow[]; sourceRowKeys: string[]; sourceIndex: Map<DataRow, number>; sourceIndicesForRow?: (row: DataRow) => number[]; }

export interface ChartAdapter<T extends ChartComponent = ChartComponent> {
    type: T["type"];
    fields(component: T): string[];
    build(component: T, rows: DataRow[], context: ChartBuildContext): ChartBuildResult;
}
