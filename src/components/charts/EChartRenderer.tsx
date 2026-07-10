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
import { normalizeEChartInitOptions, normalizeEChartSetOptionOptions } from "./echartRuntimeOptions";

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

export interface EChartRendererProps {
    option: EChartsCoreOption;
    height?: number;
    initOptions?: EChartsInitOpts;
    setOptionOptions?: SetOptionOpts;
    completeOption?: boolean;
    selectedDataIndices?: number[];
    selectionSeriesIndex?: number;
    onDataIndex?: (dataIndex: number, modifiers: { multiSelect: boolean; event?: Event }) => void;
}

export function EChartRenderer({
    option,
    height = 260,
    initOptions,
    setOptionOptions,
    completeOption = true,
    selectedDataIndices = [],
    selectionSeriesIndex,
    onDataIndex,
}: EChartRendererProps) {
    const ref = useRef<HTMLDivElement>(null);
    const chartRef = useRef<EChartsType | null>(null);
    const clickRef = useRef(onDataIndex);
    const resizeFrameRef = useRef<number | null>(null);
    const selectedRef = useRef(selectedDataIndices);
    const previousSelectedRef = useRef<number[]>([]);
    clickRef.current = onDataIndex;
    selectedRef.current = selectedDataIndices;

    const normalizedInitOptions = normalizeEChartInitOptions(initOptions);
    const normalizedSetOptionOptions = normalizeEChartSetOptionOptions(setOptionOptions, completeOption);
    const initSignature = JSON.stringify(normalizedInitOptions);
    const setOptionSignature = JSON.stringify(normalizedSetOptionOptions);
    const selectedSignature = selectedDataIndices.join("|");

    const scheduleResize = (chart: EChartsType) => {
        if (resizeFrameRef.current !== null) return;
        resizeFrameRef.current = requestAnimationFrame(() => {
            resizeFrameRef.current = null;
            if (chartRef.current === chart && !chart.isDisposed()) chart.resize();
        });
    };

    const applyPersistentSelection = (chart: EChartsType, force = false) => {
        // Advanced multi-series specifications do not have a reliable dataIndex-to-series map.
        if (selectionSeriesIndex === undefined) {
            previousSelectedRef.current = [];
            return;
        }
        const previous = previousSelectedRef.current;
        const current = selectedRef.current;
        for (const dataIndex of previous) {
            if (force || !current.includes(dataIndex)) {
                chart.dispatchAction({ type: "unselect", seriesIndex: selectionSeriesIndex, dataIndex });
            }
        }
        for (const dataIndex of current) {
            if (force || !previous.includes(dataIndex)) {
                chart.dispatchAction({ type: "select", seriesIndex: selectionSeriesIndex, dataIndex });
            }
        }
        previousSelectedRef.current = [...current];
    };

    useEffect(() => {
        if (!ref.current) return;
        const unexpected = echarts.getInstanceByDom(ref.current);
        if (unexpected && !unexpected.isDisposed()) unexpected.dispose();
        const chart = echarts.init(ref.current, undefined, normalizedInitOptions);
        chartRef.current = chart;
        chart.on("click", params => { const index=Number(params.dataIndex);const nativeEvent=(params.event as unknown as {event?:Event&{ctrlKey?:boolean;metaKey?:boolean}}|undefined)?.event;if(Number.isInteger(index))clickRef.current?.(index,{multiSelect:Boolean(nativeEvent?.ctrlKey||nativeEvent?.metaKey),event:nativeEvent}); });
        const observer = new ResizeObserver(() => scheduleResize(chart));
        observer.observe(ref.current);
        return () => {
            observer.disconnect();
            if (resizeFrameRef.current !== null) cancelAnimationFrame(resizeFrameRef.current);
            resizeFrameRef.current = null;
            previousSelectedRef.current = [];
            chartRef.current = null;
            if (!chart.isDisposed()) chart.dispose();
        };
    }, [initSignature]);
    useEffect(() => {
        const chart = chartRef.current;
        if (!chart) return;
        chart.setOption(option, normalizedSetOptionOptions);
        applyPersistentSelection(chart, true);
        scheduleResize(chart);
    }, [option, setOptionSignature]);
    useEffect(() => {
        const chart = chartRef.current;
        if (chart) applyPersistentSelection(chart);
    }, [selectedSignature, selectionSeriesIndex]);
    return <div ref={ref} class="hp-chart-canvas" style={{ height: `${height}px` }} />;
}
