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
import { categoricalColor } from "../src/utils/colors";

const rows: DataRow[] = [
    {
        SrId:"SR 100", SrLabel:"Service Request 100",
        IncidentId:"SSO 1", IncidentLabel:"SSO 1",
        InspectionId:"INSP 10", InspectionLabel:"Inspection 10",
        WorkOrderId:"WO 20", WorkOrderLabel:"Work Order 20",
    },
    {
        SrId:"SR 100", SrLabel:"Service Request 100",
        IncidentId:"SSO 1", IncidentLabel:"SSO 1",
        InspectionId:"INSP 10", InspectionLabel:"Inspection 10",
        WorkOrderId:"WO 21", WorkOrderLabel:"Work Order 21",
    },
    {
        SrId:"SR 100", SrLabel:"Service Request 100",
        IncidentId:"SSO 1", IncidentLabel:"SSO 1",
        InspectionId:"INSP 11", InspectionLabel:"Inspection 11",
        WorkOrderId:"WO 20", WorkOrderLabel:"Work Order 20",
    },
    {
        SrId:"SR 100", SrLabel:"Service Request 100",
        IncidentId:"SSO 1", IncidentLabel:"SSO 1",
        InspectionId:"INSP 11", InspectionLabel:"Inspection 11",
        WorkOrderId:"WO 21", WorkOrderLabel:"Work Order 21",
    },
];

const theme={
    mode:"light",primary:"#206bc4",accent:"#4299e1",surface:"#fff",text:"#111",
    border:"#ddd",danger:"#d00",warning:"#f90",success:"#0a0",
    fontFamily:"sans-serif",baseFontSize:12,radius:8,shadow:1,
};

const context:ChartBuildContext={
    theme,
    sourceRows:rows,
    sourceRowKeys:rows.map((_row,index)=>String(index)),
    sourceIndex:new Map(rows.map((row,index)=>[row,index])),
};

const component:NetworkGraphComponent={
    type:"networkGraph",
    id:"effort_tree",
    entities:[
        {id:"sr",label:"Service Request",field:"SrId",labelField:"SrLabel"},
        {id:"incident",label:"Incident",field:"IncidentId",labelField:"IncidentLabel"},
        {id:"inspection",label:"Inspection",field:"InspectionId",labelField:"InspectionLabel"},
        {id:"workOrder",label:"Work Order",field:"WorkOrderId",labelField:"WorkOrderLabel"},
    ],
    relationships:[
        {source:"sr",target:"incident"},
        {source:"incident",target:"inspection",branchLabel:"Inspections"},
        {source:"incident",target:"workOrder",branchLabel:"Work Orders"},
    ],
    directed:true,
    interaction:{enabled:true,internalMode:"highlight",externalMode:"selection"},
};

describe("networkGraph adapter",()=>{
    it("derives a deduplicated graph from flattened Power BI entity rows",()=>{
        const result=networkGraphAdapter.build(component,rows,context);
        const series=(result.option as any).series[0];

        expect(series.layout).toBe("none");
        expect(series.draggable).toBe(false);
        expect(series.data).toHaveLength(8);
        expect(series.links).toHaveLength(7);
        expect(series.data.filter((node:any)=>node.name==="Inspections")).toHaveLength(1);
        expect(series.data.filter((node:any)=>node.name==="Work Orders")).toHaveLength(1);
        expect(series.data.filter((node:any)=>node.name==="Inspection 10")).toHaveLength(1);
        expect(series.data.filter((node:any)=>node.name==="Work Order 20")).toHaveLength(1);
        expect(series.lineStyle).toMatchObject({color:"#111",width:1.25,opacity:.62,curveness:0});
        expect(series.edgeSymbolSize).toEqual([0,5]);
    });

    it("preserves entity-specific fields and exact unique source-row lineage",()=>{
        const result=networkGraphAdapter.build(component,rows,context);

        const inspectionBinding=result.bindings.find(binding=>
            binding.dataType==="node"&&binding.field==="InspectionId"&&binding.value==="INSP 10");
        const workOrderBinding=result.bindings.find(binding=>
            binding.dataType==="node"&&binding.field==="WorkOrderId"&&binding.value==="WO 20");
        const branchBinding=result.bindings.find(binding=>
            binding.dataType==="node"&&binding.field===undefined&&binding.value==="Inspections");

        expect(inspectionBinding?.sourceRowIndices).toEqual([0,1]);
        expect(workOrderBinding?.sourceRowIndices).toEqual([0,2]);
        expect(branchBinding?.sourceRowIndices).toEqual([0,1,2,3]);
    });

    it("keeps calm force behavior available without making it the operational default",()=>{
        const result=networkGraphAdapter.build({...component,layout:"force"},rows,context);
        const series=(result.option as any).series[0];

        expect(series).toMatchObject({
            type:"graph",
            layout:"force",
            roam:true,
            draggable:true,
            edgeSymbol:["none","arrow"],
            edgeSymbolSize:[0,5],
        });
        expect(series.force).toMatchObject({repulsion:260,edgeLength:120,gravity:.04,friction:.72});
    });

    it("keeps unrelated edges visible by default and supports explicit adjacency focus",()=>{
        const normal=(networkGraphAdapter.build(component,rows,context).option as any).series[0];
        const adjacency=(networkGraphAdapter.build({...component,focusMode:"adjacency"},rows,context).option as any).series[0];
        expect(normal.emphasis.focus).toBe("none");
        expect(normal.blur.lineStyle).toMatchObject({opacity:.62,width:1.25});
        expect(adjacency.emphasis.focus).toBe("adjacency");
    });

    it("controls node and edge tooltips independently without leaking entity IDs",()=>{
        const series=(networkGraphAdapter.build({...component,showNodeTooltip:true,showEdgeTooltip:false},rows,context).option as any).series[0];
        expect(series.data[0].tooltip.show).toBe(true);
        expect(series.data[0].tooltip.formatter()).toBe("Service Request 100");
        expect(series.data[0].tooltip.formatter()).not.toContain("sr");
        expect(series.links.every((link:any)=>link.tooltip.show===false)).toBe(true);
        const hidden=(networkGraphAdapter.build({...component,showNodeTooltip:false,showEdgeTooltip:true},rows,context).option as any).series[0];
        expect(hidden.data[0].tooltip.show).toBe(false);
        expect(hidden.links[0].tooltip.show).toBe(true);
    });

    it("renders and removes target arrows with the requested size",()=>{
        const directed=(networkGraphAdapter.build({...component,directed:true,arrowSize:9},rows,context).option as any).series[0];
        const undirected=(networkGraphAdapter.build({...component,directed:false,arrowSize:9},rows,context).option as any).series[0];
        expect(directed.edgeSymbol).toEqual(["none","arrow"]);
        expect(directed.edgeSymbolSize).toEqual([0,9]);
        expect(undirected.edgeSymbol).toEqual(["none","none"]);
        expect(undirected.edgeSymbolSize).toEqual([0,0]);
    });

    it("applies entity colors and label controls while preserving authored line breaks",()=>{
        const styled={...component,entities:component.entities.map((entity,index)=>({...entity,color:["#2563EB","#7C3AED","#16A34A","#EA580C"][index],symbol:index===0?"diamond" as const:undefined,nodeSize:index===0?30:undefined})),labelWidth:240,labelOverflow:"breakAll" as const,labelFontSize:13,labelLineHeight:18,labelDistance:10,labelPosition:"right" as const,autoCompact:false};
        styled.entities[0].labelField="Multiline";
        const multilineRows=rows.map(row=>({...row,Multiline:"500 MAYO SHELL RD\nGALENA PARK, TX 77547"}));
        const multilineContext={...context,sourceRows:multilineRows,sourceIndex:new Map(multilineRows.map((row,index)=>[row,index] as const))};
        const series=(networkGraphAdapter.build(styled,multilineRows,multilineContext).option as any).series[0];
        expect(Object.fromEntries(series.categories.map((category:any)=>[category.name,category.itemStyle.color]))).toMatchObject({"Service Request":"#2563EB",Incident:"#7C3AED",Inspection:"#16A34A","Work Order":"#EA580C"});
        expect(series.categories.find((category:any)=>category.name==="Group").itemStyle.color).toBe(categoricalColor("Group"));
        expect(series.data.find((node:any)=>node.category===0)).toMatchObject({name:"500 MAYO SHELL RD\nGALENA PARK, TX 77547",symbol:"diamond",symbolSize:30});
        expect(series.label).toMatchObject({width:240,overflow:"breakAll",fontSize:13,lineHeight:18,distance:10,position:"right"});
    });

    it("compacts based on maximum hierarchy-level density and honors explicit zoom",()=>{
        const denseRows=Array.from({length:12},(_item,index)=>({Parent:"P",Child:`C${index}`}));
        const denseContext={...context,sourceRows:denseRows,sourceRowKeys:denseRows.map((_row,index)=>String(index)),sourceIndex:new Map(denseRows.map((row,index)=>[row,index] as const))};
        const denseComponent:NetworkGraphComponent={type:"networkGraph",id:"dense",entities:[{id:"parent",field:"Parent"},{id:"child",field:"Child"}],relationships:[{source:"parent",target:"child"}],layout:"hierarchical",denseThreshold:8};
        const dense=(networkGraphAdapter.build(denseComponent,denseRows,denseContext).option as any).series[0];
        expect(dense.label.width).toBeLessThan(220); expect(dense.label.fontSize).toBeGreaterThanOrEqual(9); expect(dense.zoom).toBe(1.9);
        const disabled=(networkGraphAdapter.build({...denseComponent,autoCompact:false,initialZoom:1.4},denseRows,denseContext).option as any).series[0];
        expect(disabled.label.width).toBe(220); expect(disabled.zoom).toBe(1.4); expect(disabled.draggable).toBe(false);
        const draggable=(networkGraphAdapter.build({...denseComponent,draggable:true},denseRows,denseContext).option as any).series[0];
        expect(draggable.draggable).toBe(true);
    });

    it("supports arbitrary relationship depth rather than a four-table hierarchy",()=>{
        const deepRows:DataRow[]=[{A:"A1",B:"B1",C:"C1",D:"D1",E:"E1",F:"F1"}];
        const deepContext:ChartBuildContext={
            ...context,
            sourceRows:deepRows,
            sourceRowKeys:["0"],
            sourceIndex:new Map([[deepRows[0],0]]),
        };
        const deepComponent:NetworkGraphComponent={
            type:"networkGraph",
            id:"deep_tree",
            entities:["A","B","C","D","E","F"].map(field=>({
                id:field.toLowerCase(),
                label:field,
                field,
            })),
            relationships:[
                {source:"a",target:"b"},
                {source:"b",target:"c"},
                {source:"c",target:"d"},
                {source:"d",target:"e"},
                {source:"e",target:"f"},
            ],
            layout:"hierarchical",
            levelGap:120,
        };

        const result=networkGraphAdapter.build(deepComponent,deepRows,deepContext);
        const data=(result.option as any).series[0].data as Array<{name:string;x:number}>;

        const x=(name:string)=>data.find(node=>node.name===name)?.x??-1;
        expect(x("A1")).toBeLessThan(x("B1"));
        expect(x("B1")).toBeLessThan(x("C1"));
        expect(x("C1")).toBeLessThan(x("D1"));
        expect(x("D1")).toBeLessThan(x("E1"));
        expect(x("E1")).toBeLessThan(x("F1"));
        expect(x("B1")-x("A1")).toBe(120);
    });

    it("bounds node count and reports skipped relationship occurrences",()=>{
        const result=networkGraphAdapter.build({...component,maxNodes:2},rows,context);
        expect((result.option as any).series[0].data).toHaveLength(2);
        expect(result.warnings.join(" ")).toMatch(/node limit/);
    });
});

describe("networkGraph catalog and schema",()=>{
    it("uses entities and relationships as the only graph data contract",()=>{
        const example=JSON.parse(componentJsonExample("networkGraph"));

        expect(registeredChartTypes).toContain("networkGraph");
        expect(getChartAdapter({type:"networkGraph"} as any).type).toBe("networkGraph");
        expect(componentPromptReference()).toContain("networkGraph");
        expect(example.layout).toBe("hybrid");
        expect(example.entities).toHaveLength(2);
        expect(example.relationships).toHaveLength(1);
        expect(example.sourceField).toBeUndefined();
        expect(example.targetField).toBeUndefined();

        expect(validateSchema({version:"2.0",components:[example]}).valid).toBe(true);
        expect(validateSchema({
            version:"2.0",
            components:[{...example,relationships:[{source:"missing",target:"child"}]}],
        }).valid).toBe(false);
        expect(validateSchema({version:"2.0",components:[{...example,focusMode:"nearby"}]}).errors.join(" ")).toContain("focusMode");
        expect(validateSchema({version:"2.0",components:[{...example,initialZoom:9}]}).errors.join(" ")).toContain("initialZoom");
        expect(validateSchema({version:"2.0",components:[{...example,entities:example.entities.map((entity:any)=>({...entity,color:"url(javascript:bad)"}))}]}).valid).toBe(false);
        expect(validateSchema({
            version:"2.0",
            components:[{...example,sourceField:"legacy"}],
        }).valid).toBe(false);
        expect(validateSchema({
            version:"2.0",
            components:[{...example,edgeWidth:20}],
        }).valid).toBe(false);
    });

    it("exposes every declared entity field through the adapter field contract",()=>{
        expect(networkGraphAdapter.fields(component)).toEqual([
            "SrId","SrLabel",
            "IncidentId","IncidentLabel",
            "InspectionId","InspectionLabel",
            "WorkOrderId","WorkOrderLabel",
        ]);
    });

    it("teaches AI to use Power BI model relationships without a separate edge table",()=>{
        const promptData:any={
            rows:[{
                SrId:"SR 100",
                IncidentId:"SSO 1",
                InspectionId:"INSP 10",
                WorkOrderId:"WO 20",
            }],
            rowKeys:["0"],
            fields:{
                SrId:{key:"SrId",displayName:"SR ID",queryName:"SR[SrId]",sourceTable:"SR",sourceColumn:"SrId",qualifiedName:"SR.SrId",type:"dimension",roles:[],kind:"column",dataType:"text"},
                IncidentId:{key:"IncidentId",displayName:"Incident ID",queryName:"Incident[IncidentId]",sourceTable:"Incident",sourceColumn:"IncidentId",qualifiedName:"Incident.IncidentId",type:"dimension",roles:[],kind:"column",dataType:"text"},
                InspectionId:{key:"InspectionId",displayName:"Inspection ID",queryName:"Inspection[InspectionId]",sourceTable:"Inspection",sourceColumn:"InspectionId",qualifiedName:"Inspection.InspectionId",type:"dimension",roles:[],kind:"column",dataType:"text"},
                WorkOrderId:{key:"WorkOrderId",displayName:"Work Order ID",queryName:"WorkOrder[WorkOrderId]",sourceTable:"WorkOrder",sourceColumn:"WorkOrderId",qualifiedName:"WorkOrder.WorkOrderId",type:"dimension",roles:[],kind:"column",dataType:"text"},
            },
            aggregates:{},
            map:{},
        };

        const result=composeAiPrompt(promptData,{
            ...defaultAiPromptSettings,
            goal:"Build an operational relationship explorer from service request to incident, branching to inspections and work orders",
        });

        expect(result.prompt).toContain("networkGraph");
        expect(result.prompt).toContain("entities + relationships");
        expect(result.prompt).toContain("branchLabel");
        expect(result.prompt).toContain("Power BI model relationships");
        expect(result.prompt).toContain("do not create or require a separate edge table");
        expect(result.prompt).toContain("Any number of entity definitions");
        expect(result.prompt).not.toContain("sourceField and targetField");
    });
});
