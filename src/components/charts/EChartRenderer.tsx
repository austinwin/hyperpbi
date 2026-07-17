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
import type { EChartBrushEvent, EChartZoomEvent } from "./chartEvents";

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
    onZoom?: (event: EChartZoomEvent) => void;
    onBrush?: (event: EChartBrushEvent) => void;
    onDrill?: (event: EChartDataEvent) => void;
    restoredZoom?: EChartZoomEvent;
    fill?: boolean;
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
    onZoom,
    onBrush,
    onDrill,
    restoredZoom,
    fill = false,
}: EChartRendererProps) {
    const ref = useRef<HTMLDivElement>(null);
    const chartRef = useRef<EChartsType | null>(null);
    const clickRef = useRef(onDataIndex);
    const dataPointRef = useRef(onDataPoint);
    const zoomRef = useRef(onZoom);
    const brushRef = useRef(onBrush);
    const drillRef = useRef(onDrill);
    const restoredZoomRef = useRef(restoredZoom);
    const resizeFrameRef = useRef<number | null>(null);
    const selectedRef = useRef(selectedDataIndices);
    const previousSelectedRef = useRef<number[]>([]);
    const pointSelectionRef = useRef(selectedDataPoints ?? []);
    const pointModeRef = useRef(selectedDataPoints !== undefined);
    const previousPointSelectionRef = useRef<EChartSelectionRef[]>([]);
    clickRef.current = onDataIndex;
    dataPointRef.current = onDataPoint;
    zoomRef.current = onZoom;
    brushRef.current = onBrush;
    drillRef.current = onDrill;
    restoredZoomRef.current = restoredZoom;
    selectedRef.current = selectedDataIndices;
    pointSelectionRef.current = selectedDataPoints ?? [];
    pointModeRef.current = selectedDataPoints !== undefined;

    const normalizedInitOptions = normalizeEChartInitOptions(initOptions);
    const normalizedSetOptionOptions = normalizeEChartSetOptionOptions(setOptionOptions, completeOption);
    const initSignature = JSON.stringify(normalizedInitOptions);
    const setOptionSignature = JSON.stringify(normalizedSetOptionOptions);
    const selectedSignature = selectedDataIndices.join("|");
    const pointSelectionSignature = (selectedDataPoints ?? []).map(item => `${item.seriesIndex}:${item.dataIndex}:${item.dataType ?? ""}`).join("|");

    const dataEvent = (params: Record<string, unknown>): EChartDataEvent | undefined => {
        const index = Number(params.dataIndex);
        if (!Number.isInteger(index)) return undefined;
        const nativeEvent=(params.event as {event?:Event&{ctrlKey?:boolean;metaKey?:boolean}}|undefined)?.event;
        return {seriesIndex:Number(params.seriesIndex??0),dataIndex:index,seriesType:typeof params.seriesType==="string"?params.seriesType:undefined,seriesName:typeof params.seriesName==="string"?params.seriesName:undefined,dataType:params.dataType==="node"||params.dataType==="edge"?params.dataType:undefined,name:typeof params.name==="string"?params.name:undefined,value:params.value,event:nativeEvent,multiSelect:Boolean(nativeEvent?.ctrlKey||nativeEvent?.metaKey)};
    };

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
        chart.on("click", params => { const event=dataEvent(params as unknown as Record<string,unknown>);if(event){dataPointRef.current?.(event);clickRef.current?.(event.dataIndex,{multiSelect:event.multiSelect,event:event.event});} });
        chart.on("dblclick", params => { const event=dataEvent(params as unknown as Record<string,unknown>);if(event)drillRef.current?.(event); });
        chart.on("datazoom", params => { const source=(Array.isArray((params as {batch?:unknown[]}).batch)?(params as {batch:Record<string,unknown>[]}).batch[0]:params) as Record<string,unknown>;zoomRef.current?.({start:typeof source.start==="number"?source.start:undefined,end:typeof source.end==="number"?source.end:undefined,startValue:source.startValue,endValue:source.endValue}); });
        chart.on("brushselected", params => { const batches=Array.isArray((params as {batch?:unknown[]}).batch)?(params as {batch:Record<string,unknown>[]}).batch:[];const selections=batches.flatMap(batch=>Array.isArray(batch.selected)?(batch.selected as Record<string,unknown>[]).map(selected=>({seriesIndex:Number(selected.seriesIndex??0),dataIndices:Array.isArray(selected.dataIndex)?(selected.dataIndex as unknown[]).map(Number).filter(Number.isInteger):[]})):[]);brushRef.current?.({selections}); });
        const observer = typeof ResizeObserver === "undefined" ? undefined : new ResizeObserver(() => scheduleResize(chart));
        observer?.observe(ref.current);
        const resize = () => scheduleResize(chart);
        globalThis.addEventListener("resize", resize);
        globalThis.addEventListener("hyperpbi:layout-resize", resize);
        return () => {
            observer?.disconnect();
            globalThis.removeEventListener("resize", resize);
            globalThis.removeEventListener("hyperpbi:layout-resize", resize);
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
        if (restoredZoomRef.current) chart.dispatchAction({ type: "dataZoom", ...restoredZoomRef.current }, { silent: true });
        applyPersistentSelection(chart, true);
        scheduleResize(chart);
    }, [option, setOptionSignature]);
    useEffect(() => {
        const chart = chartRef.current;
        if (chart) applyPersistentSelection(chart);
    }, [selectedSignature, selectionSeriesIndex, pointSelectionSignature]);
    return <div ref={ref} class={`hp-chart-canvas ${fill ? "is-fill" : ""}`} style={{ height: fill ? "100%" : `${height}px` }} />;
}
