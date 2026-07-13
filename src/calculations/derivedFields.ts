import { DataRow, NormalizedField } from "../data/normalizeData";
import { CalculatedFieldDefinition } from "./calculationTypes";
import { evaluateExpression } from "./expressionEvaluator";

export function calculatedFieldDependencies(value:unknown,result=new Set<string>()):Set<string>{if(Array.isArray(value)){value.forEach(item=>calculatedFieldDependencies(item,result));return result;}if(!value||typeof value!=="object")return result;const node=value as Record<string,unknown>;if(typeof node.field==="string")result.add(node.field);if(typeof node.valueFromRow==="string")result.add(node.valueFromRow);Object.entries(node).forEach(([key,child])=>{if(!["field","valueFromRow","value"].includes(key))calculatedFieldDependencies(child,result);});return result;}
export function orderedCalculatedFields(definitions: CalculatedFieldDefinition[]): CalculatedFieldDefinition[] {
    const keys=new Set(definitions.map(item=>item.key));const pending=[...definitions];const result:CalculatedFieldDefinition[]=[];const done=new Set<string>();
    while(pending.length){const index=pending.findIndex(definition=>[...calculatedFieldDependencies(definition.expression)].filter(key=>keys.has(key)&&key!==definition.key).every(key=>done.has(key)));if(index<0)return[...result,...pending];const [definition]=pending.splice(index,1);done.add(definition.key);result.push(definition);} 
    return result;
}
export function calculatedFieldMetadata(fields:Record<string,NormalizedField>,definitions:CalculatedFieldDefinition[]=[]):Record<string,NormalizedField>{const result={...fields};for(const definition of orderedCalculatedFields(definitions)){const dependencies=[...calculatedFieldDependencies(definition.expression)].sort();result[definition.key]={key:definition.key,displayName:definition.label??definition.key,type:definition.type==="date"?"date":definition.type==="number"?"measure":"dimension",kind:"unknown",dataType:definition.type==="date"?"date":definition.type,origin:"calculated-field",roles:["calculation"],dependencies} as NormalizedField&{dependencies:string[]};}return result;}
export function applyDerivedFields(rows: DataRow[], fields: Record<string, NormalizedField>, definitions: CalculatedFieldDefinition[] = []): { rows: DataRow[]; fields: Record<string, NormalizedField>; warnings: string[] } {
    const warnings: string[] = []; const now = new Date(); const sorted = orderedCalculatedFields(definitions);
    const derivedRows = rows.map(row => { const next = { ...row }; sorted.forEach(definition => { next[definition.key] = evaluateExpression(definition.expression, next, { now, warnings }); }); return next; });
    const derivedFields = calculatedFieldMetadata(fields, definitions);
    return { rows: derivedRows, fields: derivedFields, warnings: Array.from(new Set(warnings)) };
}
