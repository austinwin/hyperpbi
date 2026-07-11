import { describe, expect, it } from "vitest";
import type { DataRow } from "../src/data/normalizeData";
import type { ChartBuildContext } from "../src/components/charts/adapters/types";
import { getChartAdapter, registeredChartTypes } from "../src/components/charts/adapters/registry";
import { mergeSemanticChartOptions } from "../src/components/charts/safeEChartOptions";
import type { ChartComponent } from "../src/schema/hyperpbiSchema";

const rows: DataRow[] = [
    { Category:"A",Actual:10,Target:12,From:"New",To:"Open",Department:"Ops",Program:"North",Stage:"Lead",Team:"Red",Safety:80,Quality:70,Schedule:90 },
    { Category:"A",Actual:5,Target:6,From:"New",To:"Open",Department:"Ops",Program:"South",Stage:"Lead",Team:"Red",Safety:90,Quality:80,Schedule:70 },
    { Category:"B",Actual:-4,Target:9,From:"Open",To:"Closed",Department:"IT",Program:"Core",Stage:"Won",Team:"Blue",Safety:60,Quality:95,Schedule:75 },
];
const theme={mode:"light",primary:"#206bc4",accent:"#4299e1",surface:"#fff",text:"#111",border:"#ddd",danger:"#d00",warning:"#f90",success:"#0a0",fontFamily:"sans-serif",baseFontSize:12,radius:8,shadow:1};
const context: ChartBuildContext={theme,sourceRows:rows,sourceRowKeys:["0","1","2"],sourceIndex:new Map(rows.map((row,index)=>[row,index]))};
const build=(component:ChartComponent)=>getChartAdapter(component).build(component,rows,context);

describe("semantic chart adapter registry",()=>{
    it("registers every chart component type",()=>{
        expect(registeredChartTypes).toEqual(expect.arrayContaining(["barChart","advancedChart","comboChart","waterfallChart","sankeyChart","treemapChart","funnelChart","radarChart"]));
        for(const type of registeredChartTypes)expect(getChartAdapter({type} as ChartComponent).type).toBe(type);
    });
    it("builds combo series with exact series/category row bindings",()=>{
        const result=build({type:"comboChart",category:"Category",series:[{field:"Actual",chartType:"bar",aggregation:"sum"},{field:"Target",chartType:"line",axis:"right",aggregation:"sum"}]});
        expect((result.option as {series:unknown[]}).series).toHaveLength(2);
        expect((result.option as {yAxis:unknown[]}).yAxis).toHaveLength(2);
        expect(result.bindings.find(item=>item.seriesIndex===0&&item.dataIndex===0)?.sourceRowIndices).toEqual([0,1]);
        expect(result.bindings.find(item=>item.seriesIndex===1&&item.dataIndex===1)?.sourceRowIndices).toEqual([2]);
    });
    it("builds waterfall, Sankey, treemap, funnel, and radar bindings",()=>{
        const waterfall=build({type:"waterfallChart",category:"Category",measure:"Actual",showStart:true,showEnd:true});
        expect((waterfall.option as {series:unknown[]}).series).toHaveLength(2);
        expect(waterfall.bindings.some(item=>item.seriesIndex===1&&item.sourceRowIndices.join() === "0,1")).toBe(true);
        const sankey=build({type:"sankeyChart",sourceField:"From",targetField:"To",valueField:"Actual",selectionTarget:"both"});
        expect(sankey.bindings.some(item=>item.dataType==="node"&&item.value==="Open"&&item.sourceRowIndices.length===3)).toBe(true);
        expect(sankey.bindings.some(item=>item.dataType==="edge"&&item.sourceRowIndices.join() === "0,1")).toBe(true);
        const treemap=build({type:"treemapChart",pathFields:["Department","Program"],valueField:"Actual",maxDepth:2});
        expect(treemap.bindings.some(item=>item.value==="Ops"&&item.sourceRowIndices.join() === "0,1")).toBe(true);
        const funnel=build({type:"funnelChart",category:"Stage",measure:"Target",sort:"descending"});
        expect(funnel.bindings).toHaveLength(2);
        const radar=build({type:"radarChart",groupField:"Team",indicators:[{field:"Safety",max:100},{field:"Quality",max:100},{field:"Schedule",max:100}]});
        expect((radar.option as {series:unknown[]}).series).toHaveLength(2);
        expect(radar.bindings[0].sourceRowIndices).toEqual([0,1]);
    });
});

describe("semantic option policy",()=>{
    it("keeps presentation and blocks generated structures without mutation",()=>{
        const base={xAxis:{type:"category",data:["A"]},series:[{type:"bar",data:[1]}]};
        const input={title:{text:"Safe"},dataset:{source:[{bad:true}]},xAxis:{type:"value",data:["bad"],axisLabel:{rotate:20}},series:[{type:"line",data:[99],encode:{x:"bad"},itemStyle:{opacity:.5}},{type:"bar",data:[2]}]};
        const snapshot=JSON.stringify(input);const result=mergeSemanticChartOptions(base,input);
        expect((result.option as any).title.text).toBe("Safe");
        expect((result.option as any).xAxis).toMatchObject({type:"category",data:["A"],axisLabel:{rotate:20}});
        expect((result.option as any).series).toEqual([{type:"bar",data:[1],itemStyle:{opacity:.5}}]);
        expect((result.option as any).dataset).toBeUndefined();
        expect(result.warnings.join(" ")).toMatch(/dataset|series count|series\[0\]\.type/);
        expect(JSON.stringify(input)).toBe(snapshot);
    });
});
