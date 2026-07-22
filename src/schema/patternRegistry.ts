import { Diagnostic } from "./diagnostics";

type RecordValue=Record<string,unknown>;
export interface PatternDefinition { id:string;required:string[];optional:string[];fieldProperties:string[];example:RecordValue;expand:(pattern:RecordValue)=>RecordValue[]; }
const interaction={internalMode:"filter",externalMode:"auto"};
const child=(parent:string,suffix:string)=>`${parent}--${suffix}`;
const fields=(value:unknown):string[]=>Array.isArray(value)?value.filter((item):item is string=>typeof item==="string"):[];
export const patternRegistry:Record<string,PatternDefinition>={
    "kpi-row":{id:"kpi-row",required:["id","fields"],optional:["title","dataset","variant","span"],fieldProperties:["fields"],example:{type:"pattern",pattern:"kpi-row",id:"summary",fields:["revenue","orders"]},expand:p=>[{type:"grid",id:child(String(p.id),"grid"),title:p.title,span:p.span,columns:Math.min(4,Math.max(1,fields(p.fields).length)),children:fields(p.fields).map((field,index)=>({type:"kpi",id:child(String(p.id),`kpi-${index+1}`),field,title:field,dataset:p.dataset,variant:p.variant??"executive",ariaLabel:`${field} key performance indicator`,interaction}))}]},
    "trend-and-breakdown":{id:"trend-and-breakdown",required:["id","date","measure","breakdown"],optional:["title","dataset","aggregation"],fieldProperties:["date","measure","breakdown"],example:{type:"pattern",pattern:"trend-and-breakdown",id:"performance",date:"month",measure:"completed",breakdown:"status"},expand:p=>[{type:"grid",id:child(String(p.id),"grid"),title:p.title,children:[{type:"lineChart",id:child(String(p.id),"trend"),title:"Trend",dataset:p.dataset,category:p.date,measure:p.measure,aggregation:p.aggregation??"sum",span:8,ariaLabel:"Trend over time",interaction},{type:"barChart",id:child(String(p.id),"breakdown"),title:"Breakdown",dataset:p.dataset,category:p.breakdown,measure:p.measure,aggregation:p.aggregation??"sum",span:4,ariaLabel:"Category breakdown",interaction}]}]},
    "record-explorer":{id:"record-explorer",required:["id","columns","details"],optional:["title","dataset","pageSize"],fieldProperties:["columns"],example:{type:"pattern",pattern:"record-explorer",id:"records",columns:["recordId","status"],details:{titleField:"recordId",fields:["status"]}},expand:p=>{const detail=(p.details&&typeof p.details==="object"?p.details:{}) as RecordValue;return[{type:"section",id:child(String(p.id),"section"),title:p.title??"Records",children:[{type:"table",id:child(String(p.id),"table"),dataset:p.dataset,columns:p.columns,pageSize:p.pageSize??25,pagination:true,search:true,showRowCount:true,ariaLabel:`${p.title??"Records"} table`,interaction:{...interaction,showSelector:true}},{type:"offcanvas",id:child(String(p.id),"details"),title:"Record details",dataset:p.dataset,openWhen:"selectedRow",ariaLabel:"Selected record details",children:[{type:"detailPanel",id:child(String(p.id),"detail-panel"),selectedRow:true,groups:[{fields:fields(detail.fields)}]}]}]}];}},
    "map-and-details":{id:"map-and-details",required:["id"],optional:["title","dataset","height","details"],fieldProperties:[],example:{type:"pattern",pattern:"map-and-details",id:"locations",title:"Locations"},expand:p=>[{type:"grid",id:child(String(p.id),"grid"),title:p.title,children:[{type:"map",id:child(String(p.id),"map"),dataset:p.dataset,height:p.height??420,span:8,layers:[],ariaLabel:`${p.title??"Locations"} map`,interaction},{type:"offcanvas",id:child(String(p.id),"details"),title:"Location details",dataset:p.dataset,openWhen:"selectedRow",ariaLabel:"Selected location details",children:[{type:"detailPanel",id:child(String(p.id),"detail-panel"),selectedRow:true,groups:[{fields:fields((p.details as RecordValue|undefined)?.fields)}]}]}]}]}
};

export interface PatternExpansionResult {
    value: unknown;
    diagnostics: Diagnostic[];
    ownerByRuntimeId: Record<string, string>;
}

export function expandPatterns(value: unknown): PatternExpansionResult {
    if (!value || typeof value !== "object" || Array.isArray(value)) {
        return { value, diagnostics: [], ownerByRuntimeId: {} };
    }
    const root = { ...(value as RecordValue) };
    const diagnostics: Diagnostic[] = [];
    const ownerByRuntimeId: Record<string, string> = {};
    const recordOwners = (node: unknown, owner: string): void => {
        if (Array.isArray(node)) { node.forEach(item => recordOwners(item, owner)); return; }
        if (!node || typeof node !== "object") return;
        const entry = node as RecordValue;
        if (typeof entry.id === "string") ownerByRuntimeId[entry.id] = owner;
        Object.values(entry).forEach(childValue => recordOwners(childValue, owner));
    };
    const expandList = (items: unknown[], path: string): unknown[] => items.flatMap((item, index) => {
        if (!item || typeof item !== "object" || Array.isArray(item)) return [item];
        const component = { ...(item as RecordValue) };
        if (component.type === "pattern") {
            const pattern = patternRegistry[String(component.pattern)];
            if (!pattern) {
                diagnostics.push({ code: "UNKNOWN_COMPONENT_TYPE", severity: "error", path: `${path}/${index}/pattern`, componentId: typeof component.id === "string" ? component.id : undefined, message: `Application pattern “${String(component.pattern)}” is not supported.`, received: component.pattern, suggestions: Object.keys(patternRegistry).sort() });
                return [];
            }
            for (const property of pattern.required) if (component[property] === undefined) diagnostics.push({ code: "MISSING_REQUIRED_PROPERTY", severity: "error", path: `${path}/${index}/${property}`, componentId: typeof component.id === "string" ? component.id : undefined, message: `Pattern ${pattern.id} requires property “${property}”.` });
            const expanded = pattern.expand(component);
            if (typeof component.id === "string") recordOwners(expanded, component.id);
            return expanded;
        }
        if (typeof component.id === "string") ownerByRuntimeId[component.id] = component.id;
        if (Array.isArray(component.children)) component.children = expandList(component.children, `${path}/${index}/children`);
        if (Array.isArray(component.footer)) component.footer = expandList(component.footer, `${path}/${index}/footer`);
        if (Array.isArray(component.tabs)) component.tabs = component.tabs.map((tab, tabIndex) => {
            if (!tab || typeof tab !== "object" || Array.isArray(tab)) return tab;
            const canonical = { ...(tab as RecordValue) };
            const children = (canonical.children ?? canonical.components ?? canonical.content ?? []) as unknown[];
            delete canonical.components;
            delete canonical.content;
            canonical.children = expandList(children, `${path}/${index}/tabs/${tabIndex}/children`);
            return canonical;
        });
        return [component];
    });
    for (const key of ["components", "toolbar", "leftPanel", "rightPanel"]) if (Array.isArray(root[key])) root[key] = expandList(root[key] as unknown[], `/${key}`);
    return { value: root, diagnostics, ownerByRuntimeId };
}
