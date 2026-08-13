import { describe, expect, it } from "vitest";
import type { DataRow } from "../src/data/normalizeData";
import type { ChartBuildContext } from "../src/components/charts/adapters/types";
import { networkGraphAdapter } from "../src/components/charts/adapters/networkGraphAdapter";
import { getChartAdapter, registeredChartTypes } from "../src/components/charts/adapters/registry";
import type { NetworkGraphComponent } from "../src/schema/networkGraphSchema";
import { componentPromptReference } from "../src/catalog/componentCatalog";
import { componentJsonExample } from "../src/catalog/componentJsonExamples";
import { validateSchema } from "../src/schema/validateSchema";
import { composeAiPrompt } from "../src/ai/promptComposer";
import { defaultAiPromptSettings } from "../src/ai/aiPromptSettings";

const rows: DataRow[] = [
    { From:"SR 100", To:"SSO 1", FromLabel:"Service Request 100", ToLabel:"SSO 1", FromType:"SR", ToType:"SSO", Weight:1 },
    { From:"SSO 1", To:"Inspections", FromLabel:"SSO 1", ToLabel:"Inspections (2)", FromType:"SSO", ToType:"Group", Weight:1 },
    { From:"Inspections", To:"INSP 10", FromLabel:"Inspections (2)", ToLabel:"Inspection 10", FromType:"Group", ToType:"Inspection", Weight:2 },
    { From:"Inspections", To:"INSP 11", FromLabel:"Inspections (2)", ToLabel:"Inspection 11", FromType:"Group", ToType:"Inspection", Weight:3 },
    { From:"SSO 1", To:"Work Orders", FromLabel:"SSO 1", ToLabel:"Work Orders (1)", FromType:"SSO", ToType:"Group", Weight:1 },
    { From:"Work Orders", To:"WO 20", FromLabel:"Work Orders (1)", ToLabel:"Work Order 20", FromType:"Group", ToType:"Work Order", Weight:4 },
];
const theme={mode:"light",primary:"#206bc4",accent:"#4299e1",surface:"#fff",text:"#111",border:"#ddd",danger:"#d00",warning:"#f90",success:"#0a0",fontFamily:"sans-serif",baseFontSize:12,radius:8,shadow:1};
const context:ChartBuildContext={
    theme,
    sourceRows:rows,
    sourceRowKeys:rows.map((_row,index)=>String(index)),
    sourceIndex:new Map(rows.map((row,index)=>[row,index])),
};

const component:NetworkGraphComponent={
    type:"networkGraph",
    id:"effort_tree",
    sourceField:"From",
    targetField:"To",
    sourceLabelField:"FromLabel",
    targetLabelField:"ToLabel",
    sourceCategoryField:"FromType",
    targetCategoryField:"ToType",
    edgeWeightField:"Weight",
    directed:true,
    interaction:{enabled:true,internalMode:"highlight",externalMode:"selection"},
};

describe("networkGraph adapter",()=>{
    it("builds interactive graph nodes and exact node/edge lineage",()=>{
        const result=networkGraphAdapter.build({...component,layout:"force"},rows,context);
        const series=(result.option as any).series[0];
        expect(series).toMatchObject({type:"graph",layout:"force",roam:true,draggable:true,edgeSymbol:["none","arrow"]});
        expect(series.force).toMatchObject({repulsion:650,edgeLength:140,gravity:.08});
        expect(result.bindings.find(binding=>binding.dataType==="node"&&binding.value==="SSO 1")?.sourceRowIndices).toEqual([0,1,4]);
        expect(result.bindings.find(binding=>binding.dataType==="edge"&&String(binding.value)==="Inspections,INSP 10")?.sourceRowIndices).toEqual([2]);
    });

    it("lays a relationship tree into deterministic hierarchy columns",()=>{
        const result=networkGraphAdapter.build({...component,layout:"hierarchical",orientation:"horizontal"},rows,context);
        const data=(result.option as any).series[0].data as Array<{id:string;x:number;y:number}>;
        const x=(id:string)=>data.find(node=>node.id===id)?.x??-1;
        expect((result.option as any).series[0].layout).toBe("none");
        expect(x("SR 100")).toBeLessThan(x("SSO 1"));
        expect(x("SSO 1")).toBeLessThan(x("Inspections"));
        expect(x("Inspections")).toBeLessThan(x("INSP 10"));
    });

    it("bounds node count and reports skipped relationships",()=>{
        const result=networkGraphAdapter.build({...component,maxNodes:2},rows,context);
        expect((result.option as any).series[0].data).toHaveLength(2);
        expect(result.warnings.join(" ")).toMatch(/node limit/);
    });
});

describe("networkGraph catalog and schema",()=>{
    it("registers a valid first-class component and exposes it to AI catalog prompts",()=>{
        const example=JSON.parse(componentJsonExample("networkGraph"));
        expect(registeredChartTypes).toContain("networkGraph");
        expect(getChartAdapter({type:"networkGraph"} as any).type).toBe("networkGraph");
        expect(componentPromptReference()).toContain("networkGraph");
        expect(validateSchema({version:"2.0",components:[example]}).valid).toBe(true);
        expect(validateSchema({version:"2.0",components:[{...example,layout:"banana"}]}).valid).toBe(false);
    });

    it("includes networkGraph guidance for force and relationship intent",()=>{
        const promptData:any={
            rows:[{From:"A",To:"B"}],
            rowKeys:["0"],
            fields:{
                From:{key:"From",displayName:"From",queryName:"Edges[From]",sourceTable:"Edges",sourceColumn:"From",qualifiedName:"Edges.From",type:"dimension",roles:[],kind:"column",dataType:"text"},
                To:{key:"To",displayName:"To",queryName:"Edges[To]",sourceTable:"Edges",sourceColumn:"To",qualifiedName:"Edges.To",type:"dimension",roles:[],kind:"column",dataType:"text"},
            },
            aggregates:{},
            map:{},
        };
        const result=composeAiPrompt(promptData,{...defaultAiPromptSettings,goal:"Build a force graph relationship explorer"});
        expect(result.prompt).toContain("networkGraph");
        expect(result.prompt).toContain("sourceField");
        expect(result.prompt).toContain("targetField");
        expect(result.prompt).toContain("prefer networkGraph over advancedChart");
    });
});
