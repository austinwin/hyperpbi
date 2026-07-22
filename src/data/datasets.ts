import { ExpressionNode } from "../calculations/calculationTypes";
import { evaluateExpression } from "../calculations/expressionEvaluator";
import { FilterOperator } from "../schema/hyperpbiSchema";
import { aggregateValue, calculateAggregates } from "./aggregations";
import { matchesFilter } from "./filtering";
import { DataRow, NormalizedData, NormalizedField, Primitive } from "./normalizeData";
import { resolveDatasetSchemas } from "./datasetSchema";
import { Diagnostic, DiagnosticCode } from "../schema/diagnostics";

export interface DatasetFilter { field: string; operator: FilterOperator; value: unknown; }
export interface DatasetMetric { op: "sum" | "avg" | "min" | "max" | "count" | "distinctCount" | "first"; field?: string; }
export interface DatasetSort { field: string; direction: "ascending" | "descending" | "asc" | "desc"; }
export interface DatasetDefinition {
    source: "powerbi" | string;
    select?: string[];
    rename?: Record<string,string>;
    filter?: DatasetFilter | DatasetFilter[];
    sort?: DatasetSort[];
    groupBy?: string[];
    metrics?: Record<string,DatasetMetric>;
    derive?: Record<string,ExpressionNode>;
    distinct?: boolean | string[];
    limit?: number;
}
export interface DatasetDiagnostic { name:string; inputRowCount:number; outputRowCount:number; evaluationMs:number; cacheStatus:"hit"|"miss"; lineageCount:number; warnings:string[]; }
export interface DatasetResult { name:string; data:NormalizedData; lineage:number[][]; diagnostic:DatasetDiagnostic; signature:string; rootRowKeys?:string[]; sourceId?:string; }
export interface DatasetEvaluation { datasets:Map<string,DatasetResult>; diagnostics:DatasetDiagnostic[]; errors:Array<{code:DiagnosticCode;dataset:string;message:string}>; schemaDiagnostics:Diagnostic[]; }

interface LineageRow { row:DataRow; lineage:number[]; }
const canonical = (value:unknown):string => { if(Array.isArray(value))return`[${value.map(canonical).join(",")}]`;if(value&&typeof value==="object")return`{${Object.entries(value as Record<string,unknown>).sort(([a],[b])=>a.localeCompare(b)).map(([k,v])=>`${JSON.stringify(k)}:${canonical(v)}`).join(",")}}`;return JSON.stringify(value); };
const valueKey=(value:Primitive)=>value instanceof Date?value.toISOString():String(value??"");
const uniqueSorted=(values:number[])=>Array.from(new Set(values)).sort((a,b)=>a-b);

function fieldsForRows(rows:DataRow[], source:Record<string,NormalizedField>):Record<string,NormalizedField>{
    const result:Record<string,NormalizedField>={};
    for(const [key,field] of Object.entries(source)){const numeric=rows.some(row=>typeof row[key]==="number"&&Number.isFinite(row[key]));const text=rows.some(row=>typeof row[key]==="string");const boolean=rows.some(row=>typeof row[key]==="boolean");const date=rows.some(row=>row[key] instanceof Date);const inferred=field.dataType&&field.dataType!=="unknown"?field.dataType:numeric?"number":date?"datetime":boolean?"boolean":text?"text":"unknown";result[key]={...field,dataType:inferred,type:field.dataType==="unknown"&&inferred==="number"?"measure":field.type};}
    return result;
}

function runDefinition(definition:DatasetDefinition,input:DatasetResult,name:string,schemaFields:Record<string,NormalizedField>,schemaWarnings:string[]):DatasetResult{
    const started=globalThis.performance?.now?.()??Date.now();let items:LineageRow[]=input.data.rows.map((row,index)=>({row:{...row},lineage:[...(input.lineage[index]??[])]}));const inputRowCount=items.length;const warnings:string[]=[...schemaWarnings];
    if(definition.filter){const filters=Array.isArray(definition.filter)?definition.filter:[definition.filter];items=items.filter(item=>filters.every(filter=>matchesFilter(item.row[filter.field],filter.operator,filter.value)));}
    if(definition.derive){items=items.map(item=>{const row={...item.row};for(const [key,expression] of Object.entries(definition.derive??{}))row[key]=evaluateExpression(expression,row,{warnings});return{row,lineage:item.lineage};});}
    if(definition.rename){items=items.map(item=>{const row={...item.row};for(const [from,to] of Object.entries(definition.rename??{})){if(from in row){row[to]=row[from];delete row[from];}}return{row,lineage:item.lineage};});}
    if(definition.select){const selected=new Set(definition.select);items=items.map(item=>({row:Object.fromEntries(Object.entries(item.row).filter(([key])=>selected.has(key))) as DataRow,lineage:item.lineage}));}
    if(definition.groupBy?.length||definition.metrics){const groups=new Map<string,LineageRow[]>();const groupBy=definition.groupBy??[];for(const item of items){const key=canonical(groupBy.map(field=>item.row[field]));const group=groups.get(key)??[];group.push(item);groups.set(key,group);}items=Array.from(groups.values()).map(group=>{const row:DataRow={};for(const field of groupBy)row[field]=group[0].row[field];for(const [key,metric] of Object.entries(definition.metrics??{}))row[key]=aggregateValue(group.map(item=>item.row),metric.field,metric.op);return{row,lineage:uniqueSorted(group.flatMap(item=>item.lineage))};});}
    if(definition.distinct){const keys=Array.isArray(definition.distinct)?definition.distinct:Object.keys(items[0]?.row??{});const groups=new Map<string,LineageRow[]>();for(const item of items){const key=canonical(keys.map(field=>item.row[field]));const group=groups.get(key)??[];group.push(item);groups.set(key,group);}items=Array.from(groups.values()).map(group=>({row:group[0].row,lineage:uniqueSorted(group.flatMap(item=>item.lineage))}));}
    if(definition.sort?.length){const sorts=definition.sort;items=[...items].sort((a,b)=>{for(const sort of sorts){const comparison=String(a.row[sort.field]??"").localeCompare(String(b.row[sort.field]??""),undefined,{numeric:true});if(comparison)return comparison*(sort.direction==="descending"||sort.direction==="desc"?-1:1);}return 0;});}
    if(definition.limit!==undefined)items=items.slice(0,Math.max(0,Math.floor(definition.limit)));
    const rows=items.map(item=>item.row);const lineage=items.map(item=>item.lineage);const sourceRowKeys=input.rootRowKeys??input.data.rowKeys;const rowKeys=lineage.map((indices,index)=>indices.length?indices.map(sourceIndex=>sourceRowKeys[sourceIndex]??String(sourceIndex)).join("|"):`dataset:${name}:${index}`);const fields=fieldsForRows(rows,schemaFields);
    const data:NormalizedData={...input.data,rows,rowKeys,fields,aggregates:calculateAggregates(rows),map:{...input.data.map,layers:[],warnings:[...input.data.map.warnings,"Logical datasets are mapped through their component bindings."]}};
    const evaluationMs=(globalThis.performance?.now?.()??Date.now())-started;const diagnostic:DatasetDiagnostic={name,inputRowCount,outputRowCount:rows.length,evaluationMs,cacheStatus:"miss",lineageCount:new Set(lineage.flat()).size,warnings:Array.from(new Set(warnings))};
    return{name,data,lineage,diagnostic,signature:canonical({definition,input:input.signature}),rootRowKeys:sourceRowKeys,sourceId:input.sourceId};
}

export function evaluateDatasets(base:NormalizedData,definitions:Record<string,DatasetDefinition>={},cache=new Map<string,DatasetResult>(),lineageOptions:{sourceIndices?:number[];sourceRowKeys?:string[]}={},sourceData:Record<string,NormalizedData>={}):DatasetEvaluation{
    const schemaEvaluation=resolveDatasetSchemas(base,definitions,sourceData);
    const baseLineage=base.rows.map((_row,index)=>[lineageOptions.sourceIndices?.[index]??index]);const sourceRowKeys=lineageOptions.sourceRowKeys??base.rowKeys;const baseResult:DatasetResult={name:"powerbi",data:base,lineage:baseLineage,diagnostic:{name:"powerbi",inputRowCount:base.rows.length,outputRowCount:base.rows.length,evaluationMs:0,cacheStatus:"miss",lineageCount:new Set(baseLineage.flat()).size,warnings:[]},signature:canonical({rowKeys:base.rowKeys,rows:base.rows,fields:Object.keys(base.fields),baseLineage}),rootRowKeys:sourceRowKeys,sourceId:"powerbi"};
    const sourceResults=new Map(Object.entries(sourceData).map(([sourceId,data])=>{const lineage=data.rows.map((_row,index)=>[index]);const result:DatasetResult={name:sourceId,data,lineage,diagnostic:{name:sourceId,inputRowCount:data.rows.length,outputRowCount:data.rows.length,evaluationMs:0,cacheStatus:"miss",lineageCount:data.rows.length,warnings:[]},signature:canonical({sourceId,rowKeys:data.rowKeys,rows:data.rows,fields:Object.keys(data.fields)}),rootRowKeys:data.rowKeys,sourceId};return[sourceId,result] as const;}));
    const datasets=new Map<string,DatasetResult>([["powerbi",baseResult]]);const errors:DatasetEvaluation["errors"]=schemaEvaluation.diagnostics.filter(item=>item.severity==="error").map(item=>({code:item.code,dataset:String(item.received??item.path.split("/")[3]??"unknown"),message:item.message}));const visiting=new Set<string>();
    const resolve=(name:string):DatasetResult|undefined=>{if(datasets.has(name))return datasets.get(name);const definition=definitions[name];const schema=schemaEvaluation.datasets.get(name);if(!definition||!schema||visiting.has(name))return undefined;visiting.add(name);const input=definition.source==="powerbi"?baseResult:sourceResults.get(definition.source)??resolve(definition.source);visiting.delete(name);if(!input)return undefined;const signature=canonical({definition,input:input.signature,fields:schema.fields});const cached=cache.get(signature);if(cached){const hit={...cached,diagnostic:{...cached.diagnostic,cacheStatus:"hit" as const,evaluationMs:0}};datasets.set(name,hit);return hit;}const schemaWarnings=schemaEvaluation.diagnostics.filter(item=>item.path.startsWith(`/data/datasets/${name}/`)&&item.severity!=="info").map(item=>item.message);const result=runDefinition(definition,input,name,schema.fields,schemaWarnings);cache.set(signature,result);datasets.set(name,result);return result;};
    Object.keys(definitions).sort().forEach(resolve);return{datasets,diagnostics:Array.from(datasets.values()).filter(item=>item.name!=="powerbi").map(item=>item.diagnostic),errors,schemaDiagnostics:schemaEvaluation.diagnostics};
}

export function sourceIndicesForDatasetRow(result:DatasetResult,rowIndex:number):number[]{return [...(result.lineage[rowIndex]??[])];}
