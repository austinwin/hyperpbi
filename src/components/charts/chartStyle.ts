import type { EChartsCoreOption } from "echarts/core";

export interface ChartAxisStyle {
    name?: string; domain?: "zero" | "auto" | "data" | "fixed"; min?: number; max?: number;
    logarithmic?: boolean; decimals?: number; dateFormat?: "short" | "long" | "iso"; suffix?: string;
    rotate?: number; interval?: number; show?: boolean; splitLines?: boolean;
}
export interface ChartSeriesStyle {
    color?: string; gradientEnd?: string; opacity?: number; symbol?: "circle" | "rect" | "roundRect" | "triangle" | "diamond" | "pin" | "arrow" | "none";
    symbolSize?: number; lineWidth?: number; dash?: "solid" | "dashed" | "dotted"; smooth?: boolean; step?: "start" | "middle" | "end"; stack?: string;
    labels?: boolean; labelPosition?: "top" | "bottom" | "inside" | "outside"; decimals?: number;
    referenceLines?: { value: number; label?: string; color?: string }[];
    referenceBands?: { from: number; to: number; label?: string; color?: string }[];
    thresholds?: { above: number; color: string }[];
}
export interface ChartStyle {
    xAxis?: ChartAxisStyle[]; yAxis?: ChartAxisStyle[]; series?: ChartSeriesStyle[];
    legend?: boolean; legendPosition?: "top" | "bottom" | "left" | "right"; tooltip?: boolean; tooltipDecimals?: number;
    animation?: boolean; animationDuration?: number; zoom?: boolean; gridLeft?: number; gridRight?: number; gridTop?: number; gridBottom?: number;
    noDataText?: string;
}
export interface ChartStyleProperty { key: string; label: string; type: "number" | "boolean" | "text" | "color" | "enum"; options?: string[]; min?: number; max?: number; integer?: boolean; help?: string; }
export const chartAxisProperties: ChartStyleProperty[] = [
    {key:"name",label:"Axis title",type:"text"}, {key:"domain",label:"Axis range",type:"enum",options:["zero","auto","data","fixed"],help:"Auto fits values without forcing zero. Fixed uses your minimum and maximum."},
    {key:"min",label:"Minimum",type:"number"}, {key:"max",label:"Maximum",type:"number"}, {key:"logarithmic",label:"Logarithmic scale",type:"boolean",help:"Requires positive values."},
    {key:"decimals",label:"Numeric precision",type:"number",min:0,max:10,integer:true}, {key:"dateFormat",label:"Date format",type:"enum",options:["short","long","iso"]},
    {key:"suffix",label:"Units suffix",type:"text"}, {key:"rotate",label:"Label rotation",type:"number",min:-90,max:90}, {key:"interval",label:"Skip labels",type:"number",min:0,max:1000,integer:true},
    {key:"show",label:"Show axis",type:"boolean"}, {key:"splitLines",label:"Show grid lines",type:"boolean"},
];
export const chartSeriesProperties: ChartStyleProperty[] = [
    {key:"color",label:"Color",type:"color"}, {key:"gradientEnd",label:"Gradient end",type:"color"}, {key:"opacity",label:"Opacity",type:"number",min:0,max:1},
    {key:"symbol",label:"Symbol",type:"enum",options:["circle","rect","roundRect","triangle","diamond","pin","arrow","none"]}, {key:"symbolSize",label:"Symbol size",type:"number",min:1,max:100},
    {key:"lineWidth",label:"Line width",type:"number",min:0,max:20}, {key:"dash",label:"Line style",type:"enum",options:["solid","dashed","dotted"]},
    {key:"smooth",label:"Smooth line",type:"boolean"}, {key:"step",label:"Step interpolation",type:"enum",options:["start","middle","end"]}, {key:"stack",label:"Stack group",type:"text"},
    {key:"labels",label:"Show data labels",type:"boolean"}, {key:"labelPosition",label:"Label position",type:"enum",options:["top","bottom","inside","outside"]},
    {key:"decimals",label:"Label precision",type:"number",min:0,max:10,integer:true},
];
export const chartAppearanceProperties: ChartStyleProperty[] = [
    {key:"legend",label:"Show legend",type:"boolean"}, {key:"legendPosition",label:"Legend position",type:"enum",options:["top","bottom","left","right"]},
    {key:"tooltip",label:"Show tooltips",type:"boolean"}, {key:"tooltipDecimals",label:"Tooltip precision",type:"number",min:0,max:10,integer:true},
    {key:"gridLeft",label:"Plot left margin",type:"number",min:0,max:300}, {key:"gridRight",label:"Plot right margin",type:"number",min:0,max:300}, {key:"gridTop",label:"Plot top margin",type:"number",min:0,max:300}, {key:"gridBottom",label:"Plot bottom margin",type:"number",min:0,max:300},
    {key:"animation",label:"Animation",type:"boolean"}, {key:"animationDuration",label:"Animation duration (ms)",type:"number",min:0,max:5000}, {key:"zoom",label:"Zoom navigation",type:"boolean"}, {key:"noDataText",label:"No-data message",type:"text"},
];
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
export function chartStyleErrors(value: unknown): string[] {
    if (value === undefined) return [];
    const errors: string[] = [];
    const fields = (input: unknown, properties: ChartStyleProperty[], path: string, extra: string[] = []) => {
        if (!record(input)) { errors.push(`${path} must be an object.`); return; }
        for (const [key,item] of Object.entries(input)) {
            if (extra.includes(key)) continue;
            const property = properties.find(entry=>entry.key===key);
            if (!property) { errors.push(`${path}/${key} is unsupported.`); continue; }
            const valid = property.type === "number" ? typeof item === "number" && Number.isFinite(item) && (!property.integer || Number.isInteger(item)) && (property.min===undefined || item>=property.min) && (property.max===undefined || item<=property.max)
                : property.type === "boolean" ? typeof item === "boolean" : property.type === "enum" ? property.options!.includes(String(item))
                : typeof item === "string" && item.length<=500 && (property.type!=="color" || /^#(?:[\da-f]{3}|[\da-f]{4}|[\da-f]{6}|[\da-f]{8})$/i.test(item));
            if (!valid) errors.push(`${path}/${key} has an invalid value.`);
        }
    };
    fields(value,chartAppearanceProperties,"chartStyle",["xAxis","yAxis","series"]);
    if (!record(value)) return errors;
    for (const axis of ["xAxis","yAxis"]) if (value[axis]!==undefined) {
        const list=value[axis]; if (!Array.isArray(list) || list.length>8) { errors.push(`chartStyle/${axis} requires at most eight axes.`); continue; }
        list.forEach((entry,index)=>{ fields(entry,chartAxisProperties,`chartStyle/${axis}/${index}`); if(record(entry)&&entry.domain==="fixed"&&(typeof entry.min!=="number"||typeof entry.max!=="number"||entry.min>=entry.max)) errors.push(`chartStyle/${axis}/${index}: fixed range requires minimum < maximum.`); });
    }
    if (value.series!==undefined) {
        if (!Array.isArray(value.series)||value.series.length>64) errors.push("chartStyle/series requires at most 64 series.");
        else value.series.forEach((entry,index)=>{
            const path=`chartStyle/series/${index}`; fields(entry,chartSeriesProperties,path,["referenceLines","referenceBands","thresholds"]); if(!record(entry))return;
            for(const key of ["referenceLines","referenceBands","thresholds"]) if(entry[key]!==undefined) {
                const rules=entry[key]; if(!Array.isArray(rules)||rules.length>32){errors.push(`${path}/${key} requires at most 32 rules.`);continue;}
                rules.forEach((rule,i)=>{const props:ChartStyleProperty[]=key==="referenceLines"?[{key:"value",label:"Value",type:"number"}]:key==="referenceBands"?[{key:"from",label:"From",type:"number"},{key:"to",label:"To",type:"number"}]:[{key:"above",label:"Above",type:"number"}];fields(rule,[...props,{key:"label",label:"Label",type:"text"},{key:"color",label:"Color",type:"color"}],`${path}/${key}/${i}`);if(!record(rule)||props.some(prop=>typeof rule[prop.key]!=="number")||key==="thresholds"&&typeof rule.color!=="string"||key==="referenceBands"&&Number(rule.from)>=Number(rule.to))errors.push(`${path}/${key}/${i} requires valid ordered numeric bounds.`);});
            }
        });
    }
    return errors;
}
const numericFormat = (value: unknown, decimals: number, suffix = "") => typeof value === "number" ? `${value.toLocaleString(undefined,{minimumFractionDigits:decimals,maximumFractionDigits:decimals})}${suffix}` : `${String(value ?? "")}${suffix}`;
function axisFormat(style: ChartAxisStyle) { return (value: unknown) => {
    if(style.dateFormat && value!=null) { const date=new Date(typeof value==="number"?value:String(value)); if(!Number.isNaN(date.getTime()))return style.dateFormat==="iso"?date.toISOString().slice(0,10):date.toLocaleDateString(undefined,{dateStyle:style.dateFormat}); }
    return style.decimals!==undefined?numericFormat(value,style.decimals,style.suffix):`${String(value??"")}${style.suffix??""}`;
}; }
/** Only library-owned formatting functions reach ECharts; author input remains declarative. */
export function applyChartStyle(option: EChartsCoreOption, style?: ChartStyle): EChartsCoreOption {
    if(!style || chartStyleErrors(style).length)return option;
    const output={...option} as Record<string,unknown>;
    for(const key of ["xAxis","yAxis"] as const) if(style[key] && output[key]) {
        const wasArray=Array.isArray(output[key]), axes=wasArray?output[key] as Record<string,unknown>[]:[output[key] as Record<string,unknown>];
        const next=axes.map((axis,index)=>{const settings=style[key]![index];if(!settings)return axis;const result={...axis};
            if(settings.name!==undefined)result.name=settings.name;if(settings.show!==undefined)result.show=settings.show;
            if(axis.type!=="category") { if(settings.domain){result.scale=settings.domain!=="zero";result.min=settings.domain==="data"?"dataMin":settings.domain==="fixed"?settings.min:undefined;result.max=settings.domain==="data"?"dataMax":settings.domain==="fixed"?settings.max:undefined;} if(settings.logarithmic!==undefined)result.type=settings.logarithmic?"log":"value"; }
            const label={...(record(axis.axisLabel)?axis.axisLabel:{}),...(settings.rotate!==undefined?{rotate:settings.rotate}:{}),...(settings.interval!==undefined&&axis.type==="category"?{interval:settings.interval}:{}),...(settings.decimals!==undefined||settings.dateFormat||settings.suffix?{formatter:axisFormat(settings)}:{})};result.axisLabel=label;
            if(settings.splitLines!==undefined)result.splitLine={...(record(axis.splitLine)?axis.splitLine:{}),show:settings.splitLines};return result;});output[key]=wasArray?next:next[0];
    }
    const baseSeries=Array.isArray(output.series)?output.series:output.series?[output.series]:[];
    output.series=baseSeries.map((raw,index)=>{const settings=style.series?.[index];if(!settings||!record(raw))return raw;const series={...raw};const color=settings.gradientEnd&&settings.color?{type:"linear",x:0,y:0,x2:0,y2:1,colorStops:[{offset:0,color:settings.color},{offset:1,color:settings.gradientEnd}]}:settings.color;
        series.itemStyle={...(record(raw.itemStyle)?raw.itemStyle:{}),...(color?{color}:{}),...(settings.opacity!==undefined?{opacity:settings.opacity}:{})};series.lineStyle={...(record(raw.lineStyle)?raw.lineStyle:{}),...(color?{color}:{}),...(settings.opacity!==undefined?{opacity:settings.opacity}:{}),...(settings.lineWidth!==undefined?{width:settings.lineWidth}:{}),...(settings.dash?{type:settings.dash}:{})};
        if(raw.areaStyle)series.areaStyle={...(record(raw.areaStyle)?raw.areaStyle:{}),...(color?{color}:{}),...(settings.opacity!==undefined?{opacity:settings.opacity}:{})};
        for(const [key,value] of Object.entries({symbol:settings.symbol,symbolSize:settings.symbolSize,smooth:settings.smooth,step:settings.step,stack:settings.stack}))if(value!==undefined)series[key]=value;
        series.label={...(record(raw.label)?raw.label:{}),...(settings.labels!==undefined?{show:settings.labels}:{}),...(settings.labelPosition?{position:settings.labelPosition}:{}),...(settings.decimals!==undefined?{formatter:(params:{value:unknown})=>numericFormat(Array.isArray(params.value)?params.value.at(-1):params.value,settings.decimals!)}:{})};
        if(settings.referenceLines?.length)series.markLine={data:settings.referenceLines.map(line=>({yAxis:line.value,name:line.label,lineStyle:{color:line.color},label:{formatter:line.label??"{c}"}}))};
        if(settings.referenceBands?.length)series.markArea={data:settings.referenceBands.map(band=>[{yAxis:band.from,name:band.label,itemStyle:{color:band.color??"#94a3b833"}},{yAxis:band.to}])};
        if(settings.thresholds?.length&&Array.isArray(raw.data))series.data=raw.data.map(item=>{const value=record(item)?item.value:item;const numeric=Number(Array.isArray(value)?value.at(-1):value);const rule=[...settings.thresholds!].sort((a,b)=>b.above-a.above).find(rule=>numeric>rule.above);return rule?{...(record(item)?item:{value:item}),itemStyle:{...(record(item)&&record(item.itemStyle)?item.itemStyle:{}),color:rule.color}}:item;});return series;});
    if(style.legend!==undefined||style.legendPosition)output.legend={...(record(output.legend)?output.legend:{}),...(style.legend!==undefined?{show:style.legend}:{}),...(style.legendPosition?{top:undefined,bottom:undefined,left:undefined,right:undefined,[style.legendPosition]:0,orient:["left","right"].includes(style.legendPosition)?"vertical":"horizontal"}:{})};
    if(style.tooltip!==undefined||style.tooltipDecimals!==undefined)output.tooltip={...(record(output.tooltip)?output.tooltip:{}),...(style.tooltip!==undefined?{show:style.tooltip}:{}),...(style.tooltipDecimals!==undefined?{renderMode:"richText",formatter:(params:unknown)=>{const list=Array.isArray(params)?params:[params];return list.map(item=>record(item)?`${String(item.seriesName??item.name??"")}: ${numericFormat(Array.isArray(item.value)?item.value.at(-1):item.value,style.tooltipDecimals!)}`:"").join("\n");}}:{})};
    const grid=record(output.grid)?{...output.grid}:{};for(const edge of ["Left","Right","Top","Bottom"] as const){const value=style[`grid${edge}`];if(value!==undefined)grid[edge.toLowerCase()]=value;}output.grid=grid;
    if(style.animation!==undefined)output.animation=style.animation;if(style.animationDuration!==undefined)output.animationDuration=style.animationDuration;
    if(style.zoom!==undefined)output.dataZoom=style.zoom?[{type:"inside",filterMode:"none"},{type:"slider",bottom:0,filterMode:"none"}]:[];
    return output as EChartsCoreOption;
}
