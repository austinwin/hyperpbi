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
    selectedDataPoints?: EChartSelectionRef[];
    onDataPoint?: (event: EChartDataEvent) => void;
}

export interface EChartDataEvent { seriesIndex:number;dataIndex:number;seriesType?:string;seriesName?:string;dataType?:"node"|"edge";name?:string;value?:unknown;event?:Event;multiSelect:boolean; }
export interface EChartSelectionRef { seriesIndex:number;dataIndex:number;dataType?:"node"|"edge"; }

export function EChartRenderer({
    option,
    height = 260,
    initOptions,
    setOptionOptions,
    completeOption = true,
    selectedDataIndices = [],
    selectionSeriesIndex,
    onDataIndex,
    selectedDataPoints,
    onDataPoint,
}: EChartRendererProps) {
    const ref = useRef<HTMLDivElement>(null);
    const chartRef = useRef<EChartsType | null>(null);
    const clickRef = useRef(onDataIndex);
    const dataPointRef = useRef(onDataPoint);
    const resizeFrameRef = useRef<number | null>(null);
    const selectedRef = useRef(selectedDataIndices);
    const previousSelectedRef = useRef<number[]>([]);
    const pointSelectionRef = useRef(selectedDataPoints ?? []);
    const pointModeRef = useRef(selectedDataPoints !== undefined);
    const previousPointSelectionRef = useRef<EChartSelectionRef[]>([]);
    clickRef.current = onDataIndex;
    dataPointRef.current = onDataPoint;
    selectedRef.current = selectedDataIndices;
    pointSelectionRef.current = selectedDataPoints ?? [];
    pointModeRef.current = selectedDataPoints !== undefined;

    const normalizedInitOptions = normalizeEChartInitOptions(initOptions);
    const normalizedSetOptionOptions = normalizeEChartSetOptionOptions(setOptionOptions, completeOption);
    const initSignature = JSON.stringify(normalizedInitOptions);
    const setOptionSignature = JSON.stringify(normalizedSetOptionOptions);
    const selectedSignature = selectedDataIndices.join("|");
    const pointSelectionSignature = (selectedDataPoints ?? []).map(item => `${item.seriesIndex}:${item.dataIndex}:${item.dataType ?? ""}`).join("|");

    const scheduleResize = (chart: EChartsType) => {
        if (resizeFrameRef.current !== null) return;
        resizeFrameRef.current = requestAnimationFrame(() => {
            resizeFrameRef.current = null;
            if (chartRef.current === chart && !chart.isDisposed()) chart.resize();
        });
    };

    const applyPersistentSelection = (chart: EChartsType, force = false) => {
        if (pointModeRef.current) {
            const key=(item:EChartSelectionRef)=>`${item.seriesIndex}:${item.dataIndex}:${item.dataType??""}`;const current=pointSelectionRef.current;const currentKeys=new Set(current.map(key));const previous=previousPointSelectionRef.current;
            for(const item of previous)if(force||!currentKeys.has(key(item)))chart.dispatchAction({type:"downplay",seriesIndex:item.seriesIndex,dataIndex:item.dataIndex,...(item.dataType?{dataType:item.dataType}:{})});
            const previousKeys=new Set(previous.map(key));for(const item of current)if(force||!previousKeys.has(key(item)))chart.dispatchAction({type:"highlight",seriesIndex:item.seriesIndex,dataIndex:item.dataIndex,...(item.dataType?{dataType:item.dataType}:{})});
            previousPointSelectionRef.current=current.map(item=>({...item}));return;
        }
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
        chart.on("click", params => { const index=Number(params.dataIndex);const nativeEvent=(params.event as unknown as {event?:Event&{ctrlKey?:boolean;metaKey?:boolean}}|undefined)?.event;if(Number.isInteger(index)){const multiSelect=Boolean(nativeEvent?.ctrlKey||nativeEvent?.metaKey);dataPointRef.current?.({seriesIndex:Number(params.seriesIndex??0),dataIndex:index,seriesType:typeof params.seriesType==="string"?params.seriesType:undefined,seriesName:typeof params.seriesName==="string"?params.seriesName:undefined,dataType:params.dataType==="node"||params.dataType==="edge"?params.dataType:undefined,name:typeof params.name==="string"?params.name:undefined,value:params.value,event:nativeEvent,multiSelect});clickRef.current?.(index,{multiSelect,event:nativeEvent});} });
        const observer = new ResizeObserver(() => scheduleResize(chart));
        observer.observe(ref.current);
        return () => {
            observer.disconnect();
            if (resizeFrameRef.current !== null) cancelAnimationFrame(resizeFrameRef.current);
            resizeFrameRef.current = null;
            previousSelectedRef.current = [];
            previousPointSelectionRef.current = [];
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
    }, [selectedSignature, selectionSeriesIndex, pointSelectionSignature]);
    return <div ref={ref} class="hp-chart-canvas" style={{ height: `${height}px` }} />;
}
