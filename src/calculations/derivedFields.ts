import { DataRow, NormalizedField } from "../data/normalizeData";
import { CalculatedFieldDefinition } from "./calculationTypes";
import { evaluateExpression } from "./expressionEvaluator";

function ordered(definitions: CalculatedFieldDefinition[]): CalculatedFieldDefinition[] {
    const pending = [...definitions]; const result: CalculatedFieldDefinition[] = []; const done = new Set<string>();
    while (pending.length) { const index = pending.findIndex(definition => { const text = JSON.stringify(definition.expression); return !definitions.some(other => other.key !== definition.key && text.includes(`\"field\":\"${other.key}\"`) && !done.has(other.key)); }); if (index < 0) return [...result, ...pending]; const [definition] = pending.splice(index, 1); done.add(definition.key); result.push(definition); }
    return result;
}
export function applyDerivedFields(rows: DataRow[], fields: Record<string, NormalizedField>, definitions: CalculatedFieldDefinition[] = []): { rows: DataRow[]; fields: Record<string, NormalizedField>; warnings: string[] } {
    const warnings: string[] = []; const now = new Date(); const sorted = ordered(definitions);
    const derivedRows = rows.map(row => { const next = { ...row }; sorted.forEach(definition => { next[definition.key] = evaluateExpression(definition.expression, next, { now, warnings }); }); return next; });
    const derivedFields = { ...fields }; definitions.forEach(definition => { derivedFields[definition.key] = { key: definition.key, displayName: definition.label ?? definition.key, type: definition.type === "date" ? "date" : definition.type === "number" ? "measure" : "dimension", roles: ["calculation"] }; });
    return { rows: derivedRows, fields: derivedFields, warnings: Array.from(new Set(warnings)) };
}
