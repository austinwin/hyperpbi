import powerbi from "powerbi-visuals-api";
import { NormalizedField } from "../data/normalizeData";
import { FilterOperator } from "../schema/hyperpbiSchema";
import { ExternalSelectionFailureReason, InteractionDetails } from "./interactionDiagnostics";

export interface ExternalFilterTarget { table:string; column:string; }
export interface ExternalFilterResult { sent:boolean; reason?:ExternalSelectionFailureReason; target?:ExternalFilterTarget; filter?:powerbi.IFilter; }

type FilterHost=Pick<powerbi.extensibility.visual.IVisualHost,"applyJsonFilter">;
// Power BI requires these canonical schema identifiers; they are identifiers, not network requests.
// eslint-disable-next-line powerbi-visuals/no-http-string
const BASIC_SCHEMA="http://powerbi.com/product/schema#basic";const ADVANCED_SCHEMA="http://powerbi.com/product/schema#advanced";
const FILTER_MERGE=0 as powerbi.FilterAction;const FILTER_REMOVE=1 as powerbi.FilterAction;
const empty=(value:unknown)=>value===""||value===null||value===undefined||Array.isArray(value)&&value.length===0;
const primitive=(value:unknown):string|number|boolean=>value instanceof Date?value.toISOString():typeof value==="string"||typeof value==="number"||typeof value==="boolean"?value:String(value??"");

export function externalFilterTargetFor(field:NormalizedField|undefined):ExternalFilterTarget|undefined{const isColumn=field?.kind==="column"||field?.kind===undefined&&field?.type!=="measure"&&field?.type!=="schema";return isColumn&&field?.sourceTable&&field.sourceColumn?{table:field.sourceTable,column:field.sourceColumn}:undefined;}

export function applyExternalFilter(host:FilterHost,fields:Record<string,NormalizedField>,field:string,operator:FilterOperator,value:unknown,details:InteractionDetails={}):ExternalFilterResult{
    void details;if(empty(value)||operator==="between"&&(!Array.isArray(value)||value.length<2||value.some(empty)))return clearExternalFilter(host,details);
    const target=externalFilterTargetFor(fields[field]);if(!target)return{sent:false,reason:"field has no Power BI filter target"};
    let filter:powerbi.IFilter|undefined;
    if(operator==="="||operator==="in"||operator==="!="){
        const values=(Array.isArray(value)?value:[value]).filter(item=>!empty(item)).map(primitive);
        filter={$schema:BASIC_SCHEMA,target,operator:operator==="!="?"NotIn":"In",values} as powerbi.IFilter;
    }else{
        const names:Partial<Record<FilterOperator,string>>={contains:"Contains",">":"GreaterThan",">=":"GreaterThanOrEqual","<":"LessThan","<=":"LessThanOrEqual"};
        const conditions=operator==="between"&&Array.isArray(value)&&value.length>=2?[{operator:"GreaterThanOrEqual",value:primitive(value[0])},{operator:"LessThanOrEqual",value:primitive(value[1])}]:names[operator]?[{operator:names[operator],value:primitive(value)}]:undefined;
        if(!conditions)return{sent:false,reason:"unsupported external filter operator",target};
        filter={$schema:ADVANCED_SCHEMA,target,logicalOperator:"And",conditions} as powerbi.IFilter;
    }
    try{host.applyJsonFilter(filter,"general","filter",FILTER_MERGE);return{sent:true,target,filter};}catch{return{sent:false,reason:"host filter failed",target};}
}

export function clearExternalFilter(host:FilterHost,details:InteractionDetails={}):ExternalFilterResult{
    void details;try{host.applyJsonFilter(null as unknown as powerbi.IFilter,"general","filter",FILTER_REMOVE);return{sent:true};}catch{return{sent:false,reason:"host filter failed"};}
}
