import {render} from "preact";
import {useMemo,useState} from "preact/hooks";
import * as echarts from "echarts/core";
import "@tabler/core/dist/css/tabler.css";
import "../../src/styles/tabler-overrides.css";
import "../../src/styles/hyperpbi.css";
import "../../src/styles/hyperpbi-studio.css";
import "../../src/styles/hyperpbi-inspector.css";
import "../../src/styles/hyperpbi-shell.css";
import {HyperPbiStudio} from "../../src/editor/HyperPbiStudio";
import {defaultConfigJson} from "../../src/config/hyperpbiConfig";
import {calculateAggregates} from "../../src/data/aggregations";
import {normalizeMapBindings} from "../../src/data/normalizeMapBindings";
import {toRuntimeSettings,VisualFormattingSettingsModel} from "../../src/settings";
import type {NormalizedData,NormalizedField} from "../../src/data/normalizeData";
const fields:Record<string,NormalizedField>=Object.fromEntries(["date","temperature","rainfall"].map(key=>[key,{key,displayName:key,type:key==="date"?"date":"measure",dataType:key==="date"?"datetime":"number",kind:"column",origin:"powerbi-column",roles:["values"],sourceTable:"Readings",sourceColumn:key}]));
const rows=Array.from({length:1200},(_,index)=>({date:`2026-${index%2?"11":"10"}-${String(index%28+1).padStart(2,"0")}`,temperature:53+(index%60)/10,rainfall:90+index%30}));
const formattingModel=new VisualFormattingSettingsModel(); if(new URLSearchParams(location.search).has("dark"))formattingModel.interface.theme.value={displayName:"Dark",value:"dark"};
const initial=JSON.stringify({version:"2.0",components:[{type:"comboChart",id:"quality",title:"Quality monitoring",category:"date",height:380,series:[{field:"temperature",label:"Temperature",chartType:"line",aggregation:"avg"}],chartStyle:{yAxis:[{domain:"auto"}]},interaction:{enabled:true,internalMode:"highlight",externalMode:"selection"}}]});
declare global{interface Window{chartAuthoring:{specification:string;saved:string;selections:number[][];option:()=>any;extent:()=>number[];};}}
window.chartAuthoring={specification:initial,saved:"",selections:[],option:()=>{const node=document.querySelector<HTMLElement>("[_echarts_instance_]");return node?echarts.getInstanceByDom(node)?.getOption():undefined;},extent:()=>{const node=document.querySelector<HTMLElement>("[_echarts_instance_]");return node?(echarts.getInstanceByDom(node) as any)?.getModel().getComponent("yAxis",0).axis.scale.getExtent():[];}};
function Harness(){const [month,setMonth]=useState("all");const data=useMemo<NormalizedData>(()=>{const indices=rows.flatMap((row,index)=>month==="all"||row.date.startsWith(month)?[index]:[]),filtered=indices.map(index=>rows[index]),rowKeys=indices.map(index=>`reading-${index}`);return{rows:filtered,fields,rowKeys,aggregates:calculateAggregates(filtered),map:normalizeMapBindings(filtered,fields)};},[month]);return <div><label class="chart-report-filters">Report date slicer<select aria-label="Report date slicer" value={month} onChange={event=>setMonth(event.currentTarget.value)}><option value="all">All dates</option><option value="2026-11">November</option></select><span>{data.rows.length.toLocaleString()} received readings</span></label><div class="chart-report-studio"><HyperPbiStudio instanceId="charts" data={data} settings={toRuntimeSettings(formattingModel)} initialSpecification={new URLSearchParams(location.search).has("empty")?JSON.stringify({version:"2.0",components:[]}):new URLSearchParams(location.search).has("saved")?sessionStorage.getItem("chart-saved")??initial:initial} initialConfiguration={defaultConfigJson} initialEditorTab="inspector" onDraftChange={value=>window.chartAuthoring.specification=value} onSave={value=>{window.chartAuthoring.saved=value;sessionStorage.setItem("chart-saved",value);}} selectExternal={indices=>{window.chartAuthoring.selections.push(indices);return{sent:true};}} /></div></div>;}
render(<Harness/>,document.getElementById("app")!);
