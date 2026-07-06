import * as echarts from "echarts/core";
import { BarChart, BoxplotChart, FunnelChart, GaugeChart, GraphChart, HeatmapChart, LineChart, PieChart, RadarChart, SankeyChart, ScatterChart, SunburstChart, TreemapChart } from "echarts/charts";
import { CalendarComponent, DataZoomComponent, DatasetComponent, GridComponent, LegendComponent, RadarComponent, TimelineComponent, TitleComponent, ToolboxComponent, TooltipComponent, TransformComponent, VisualMapComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";
import { useEffect, useRef } from "preact/hooks";
import type { EChartsCoreOption } from "echarts/core";

echarts.use([BarChart, BoxplotChart, FunnelChart, GaugeChart, GraphChart, HeatmapChart, LineChart, PieChart, RadarChart, SankeyChart, ScatterChart, SunburstChart, TreemapChart, CalendarComponent, DataZoomComponent, DatasetComponent, GridComponent, LegendComponent, RadarComponent, TimelineComponent, TitleComponent, ToolboxComponent, TooltipComponent, TransformComponent, VisualMapComponent, CanvasRenderer]);

export function EChartRenderer({ option, height = 260, onDataIndex }: { option: EChartsCoreOption; height?: number; onDataIndex?: (dataIndex: number) => void }) {
    const ref = useRef<HTMLDivElement>(null);
    useEffect(() => {
        if (!ref.current) return;
        const chart = echarts.init(ref.current, undefined, { renderer: "canvas" });
        chart.setOption(option);
        if (onDataIndex) chart.on("click", params => { const index = Number(params.dataIndex); if (Number.isInteger(index)) onDataIndex(index); });
        const observer = new ResizeObserver(() => chart.resize()); observer.observe(ref.current);
        return () => { observer.disconnect(); chart.dispose(); };
    }, [option, onDataIndex]);
    return <div ref={ref} class="hp-chart-canvas" style={{ height: `${height}px` }} />;
}
