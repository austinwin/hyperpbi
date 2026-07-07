import { componentCategories, componentsByCategory } from "../../catalog/componentCatalog";
import { customComponentTemplates } from "../../components/custom/customComponentTemplates";
import { copyText } from "../textActions";
import { minimalDashboardJson } from "../../ai/minimalDashboard";

const capabilityLabels:Record<string,string>={fields:"Fields",calculations:"Calc",css:"CSS",slots:"Slots",interactions:"Click",externalSelection:"Power BI",customHtml:"HTML"};
function componentJson(type:string):string {
    const base:Record<string,unknown>={type,id:type.replace(/[^A-Za-z0-9_-]/g,"_")};
    if(["searchBox","textInput","numberInput","slider","select","multiSelect","segmentedControl","dateRange"].includes(type))base.field="__field_key__";
    if(["kpi","infoCard","statusBadge","progressBar"].includes(type))Object.assign(base,{field:"__field_key__",aggregation:"first"});
    if(type==="metricGrid")base.metrics=[{title:"Metric",field:"__field_key__",aggregation:"count"}];
    if(type==="statList")base.items=[{label:"Value",field:"__field_key__"}];
    if(type==="detailPanel")base.groups=[{fields:["__field_key__"]}];
    if(type==="timeline")Object.assign(base,{dateField:"__field_key__",titleField:"__field_key__"});
    if(["barChart","horizontalBarChart","lineChart","areaChart","pieChart","donutChart","heatmap"].includes(type))Object.assign(base,{category:"__field_key__",measure:"__field_key__",aggregation:"count"});
    if(type==="scatterChart")Object.assign(base,{x:"__field_key__",y:"__field_key__"});
    if(type==="gauge")Object.assign(base,{measure:"__field_key__",aggregation:"avg"});
    if(type==="advancedChart")base.options={series:[]};
    if(type==="smallMultiples")Object.assign(base,{splitField:"__field_key__",chart:{type:"barChart",category:"__field_key__",measure:"__field_key__"}});
    if(type==="table")base.columns=["__field_key__"];
    if(type==="matrix")Object.assign(base,{rows:["__field_key__"],values:[{field:"__field_key__",aggregation:"count"}]});
    if(type==="map")base.settings={fitBounds:true};
    if(type==="text")base.text="Text"; if(type==="markdown")base.text="## Heading"; if(type==="html"||type==="custom")base.html="<div>Content</div>";
    if(["grid","flex","section","leftPanel","rightPanel","split","toolbar","collapsible","accordion","stepper","drawer","filterDrawer"].includes(type))base.children=[];
    if(type==="tabs")base.tabs=[{id:"tab_1",title:"Tab",children:[]}];
    if(type==="button")Object.assign(base,{label:"Clear",action:"clearFilters"});
    if(type==="buttonGroup")base.buttons=[{id:"action",label:"Action",value:"value"}];
    if(type==="toggle")base.label="Toggle"; if(type==="alert")base.text="Alert";
    return JSON.stringify(base);
}
export function AiPromptComponentReference({fieldKeys=[]}:{fieldKeys?:string[]}) {
    return <details class="hp-ai-details hp-catalog"><summary>Component catalog & safe custom templates</summary><p>Recommended components cover most dashboards. Expand only the category you need; Advanced components are specialized.</p><section class="hp-minimal-dashboard"><strong>Minimal dashboard JSON</strong><pre>{minimalDashboardJson}</pre><button type="button" onClick={()=>void copyText(minimalDashboardJson)}>Copy minimal dashboard JSON</button></section>{componentCategories.map(category=><details open={category==="Display"}><summary>{category}</summary><div class="hp-catalog-grid">{componentsByCategory(category).map(component=>{const example=componentJson(component.type);return <article class={`hp-level-${component.level}`}><header><strong>{component.label}</strong><code>{component.type}</code></header><p>{component.useWhen}</p><div>{Object.entries(component.capability).filter(([,enabled])=>enabled).map(([key])=><span>{capabilityLabels[key]}</span>)}</div><details class="hp-component-json"><summary>Component JSON</summary><pre>{example}</pre><button type="button" onClick={()=>void copyText(example)}>Copy JSON</button></details></article>;})}</div></details>)}<section class="hp-template-gallery"><h4>Custom component templates</h4><div>{customComponentTemplates(fieldKeys).map(template=><article><strong>{template.name}</strong><span>{template.description}</span><button type="button" onClick={()=>void copyText(JSON.stringify(template.component))}>Copy component JSON</button></article>)}</div></section></details>;
}
