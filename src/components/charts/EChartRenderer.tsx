import * as echarts from "echarts/core";
import {
    BarChart, BoxplotChart, CandlestickChart, ChordChart, CustomChart, EffectScatterChart,
    FunnelChart, GaugeChart, GraphChart, HeatmapChart, LineChart, LinesChart, MapChart,
    ParallelChart, PictorialBarChart, PieChart, RadarChart, SankeyChart, ScatterChart,
    SunburstChart, ThemeRiverChart, TreeChart, TreemapChart
} from "echarts/charts";
import {
    AriaComponent, AxisPointerComponent, BrushComponent, CalendarComponent, DataZoomComponent,
    DataZoomInsideComponent, DataZoomSliderComponent, DatasetComponent, GeoComponent,
    GraphicComponent, GridComponent, GridSimpleComponent, LegendComponent, LegendPlainComponent,
    LegendScrollComponent, MarkAreaComponent, MarkLineComponent, MarkPointComponent,
    MatrixComponent, ParallelComponent, PolarComponent, RadarComponent, SingleAxisComponent,
    ThumbnailComponent, TimelineComponent, TitleComponent, ToolboxComponent, TooltipComponent,
    TransformComponent, VisualMapComponent, VisualMapContinuousComponent, VisualMapPiecewiseComponent
} from "echarts/components";
import { CanvasRenderer, SVGRenderer } from "echarts/renderers";
import { useEffect, useRef } from "preact/hooks";
import type { EChartsCoreOption, EChartsInitOpts, EChartsType, SetOptionOpts } from "echarts/core";

export const registeredEChartSeries = [
    "bar", "boxplot", "candlestick", "chord", "custom", "effectScatter", "funnel", "gauge",
    "graph", "heatmap", "line", "lines", "map", "parallel", "pictorialBar", "pie", "radar",
    "sankey", "scatter", "sunburst", "themeRiver", "tree", "treemap"
] as const;

echarts.use([
    BarChart, BoxplotChart, CandlestickChart, ChordChart, CustomChart, EffectScatterChart,
    FunnelChart, GaugeChart, GraphChart, HeatmapChart, LineChart, LinesChart, MapChart,
    ParallelChart, PictorialBarChart, PieChart, RadarChart, SankeyChart, ScatterChart,
    SunburstChart, ThemeRiverChart, TreeChart, TreemapChart,
    AriaComponent, AxisPointerComponent, BrushComponent, CalendarComponent, DataZoomComponent,
    DataZoomInsideComponent, DataZoomSliderComponent, DatasetComponent, GeoComponent,
    GraphicComponent, GridComponent, GridSimpleComponent, LegendComponent, LegendPlainComponent,
    LegendScrollComponent, MarkAreaComponent, MarkLineComponent, MarkPointComponent,
    MatrixComponent, ParallelComponent, PolarComponent, RadarComponent, SingleAxisComponent,
    ThumbnailComponent, TimelineComponent, TitleComponent, ToolboxComponent, TooltipComponent,
    TransformComponent, VisualMapComponent, VisualMapContinuousComponent, VisualMapPiecewiseComponent,
    CanvasRenderer, SVGRenderer
]);

interface EChartRendererProps {
    option: EChartsCoreOption;
    height?: number;
    initOptions?: EChartsInitOpts;
    setOptionOptions?: SetOptionOpts;
    selectedDataIndices?: number[];
    onDataIndex?: (dataIndex: number, modifiers: { multiSelect: boolean; event?: Event }) => void;
}

export function EChartRenderer({ option, height = 260, initOptions, setOptionOptions, selectedDataIndices = [], onDataIndex }: EChartRendererProps) {
    const ref = useRef<HTMLDivElement>(null);
    const chartRef = useRef<EChartsType | null>(null);
    const clickRef = useRef(onDataIndex);
    clickRef.current = onDataIndex;
    useEffect(() => {
        if (!ref.current) return;
        const chart = echarts.init(ref.current, undefined, { renderer: "canvas", ...initOptions });
        chartRef.current = chart;
        chart.on("click", params => { const index=Number(params.dataIndex);const nativeEvent=(params.event as unknown as {event?:Event&{ctrlKey?:boolean;metaKey?:boolean}}|undefined)?.event;if(Number.isInteger(index))clickRef.current?.(index,{multiSelect:Boolean(nativeEvent?.ctrlKey||nativeEvent?.metaKey),event:nativeEvent}); });
        const observer = new ResizeObserver(() => chart.resize());
        observer.observe(ref.current);
        return () => { observer.disconnect(); chartRef.current = null; chart.dispose(); };
    }, [initOptions]);
    useEffect(() => { chartRef.current?.setOption(option, setOptionOptions); }, [option, setOptionOptions]);
    useEffect(() => { const chart=chartRef.current;if(!chart)return;chart.dispatchAction({type:"downplay"});selectedDataIndices.forEach(dataIndex=>chart.dispatchAction({type:"highlight",dataIndex})); }, [selectedDataIndices.join("|")]);
    return <div ref={ref} class="hp-chart-canvas" style={{ height: `${height}px` }} />;
}
