import { getComponentDescriptor } from "../catalog/componentDescriptors";
import { visitSpecificationComponents } from "../catalog/componentTraversal";
import type { DatasetSchemaEvaluation } from "../data/datasetSchema";
import type { NormalizedData } from "../data/normalizeData";
import { closestMatches, type Diagnostic } from "../schema/diagnostics";
import { aggregationFieldPolicy, aggregationFieldRequirement } from "./aggregationFieldPolicy";
import { dispatchComponentField } from "./componentFieldHandlers";
import { FieldResolver } from "./fieldResolver";

type Json = Record<string, unknown>;
export type FieldReferenceSource = "powerbi" | "dataset" | "service" | "joined" | "metric" | "state" | "unknown";
export interface FieldReferenceOccurrence {
    reference: string;
    path: string;
    componentId?: string;
    datasetName: string;
    requirement: "any" | "numeric";
    source: FieldReferenceSource;
    set(nextReference: string): void;
}

const object = (value: unknown): value is Json => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const pointer = (value: string) => value.replace(/~/g, "~0").replace(/\//g, "~1");

function expression(node: unknown, path: string, add: (owner: Json, key: string, path: string, requirement?: "any" | "numeric") => void): void {
    if (Array.isArray(node)) { node.forEach((item, index) => expression(item, `${path}/${index}`, add)); return; }
    if (!object(node)) return;
    for (const property of ["field", "valueFromRow"]) if (typeof node[property] === "string") add(node, property, `${path}/${property}`);
    for (const [key, value] of Object.entries(node)) if (!["field", "valueFromRow", "value"].includes(key)) expression(value, `${path}/${pointer(key)}`, add);
}

function datasetReferences(specification: Json, result: FieldReferenceOccurrence[]): void {
    const datasets = object(specification.data) && object(specification.data.datasets) ? specification.data.datasets : {};
    for (const [name, raw] of Object.entries(datasets)) {
        if (!object(raw)) continue;
        const base = `/data/datasets/${pointer(name)}`;
        const sourceName = String(raw.source ?? "powerbi");
        const add = (owner: Json, key: string, path: string, requirement: "any" | "numeric" = "any") => {
            if (typeof owner[key] !== "string") return;
            result.push({ reference: String(owner[key]), path, datasetName: sourceName, requirement, source: "dataset", set: next => { owner[key] = next; } });
        };
        if (Array.isArray(raw.select)) raw.select.forEach((item, index) => {
            if (typeof item === "string") result.push({ reference: item, path: `${base}/select/${index}`, datasetName: sourceName, requirement: "any", source: "dataset", set: next => { (raw.select as unknown[])[index] = next; } });
        });
        if (object(raw.rename)) for (const from of Object.keys(raw.rename)) result.push({
            reference: from,
            path: `${base}/rename/${pointer(from)}`,
            datasetName: sourceName,
            requirement: "any",
            source: "dataset",
            set: next => { const target = (raw.rename as Json)[from]; delete (raw.rename as Json)[from]; (raw.rename as Json)[next] = target; },
        });
        for (const key of ["groupBy", "distinct"]) if (Array.isArray(raw[key])) (raw[key] as unknown[]).forEach((item, index) => {
            if (typeof item === "string") result.push({ reference: item, path: `${base}/${key}/${index}`, datasetName: sourceName, requirement: "any", source: "dataset", set: next => { (raw[key] as unknown[])[index] = next; } });
        });
        const filters = Array.isArray(raw.filter) ? raw.filter : [raw.filter];
        filters.forEach((item, index) => { if (object(item)) { add(item, "field", `${base}/filter/${index}/field`); if (item.where) expression(item.where, `${base}/filter/${index}/where`, add); } });
        if (Array.isArray(raw.sort)) raw.sort.forEach((item, index) => { if (object(item)) add(item, "field", `${base}/sort/${index}/field`); });
        if (object(raw.metrics)) for (const [metric, item] of Object.entries(raw.metrics)) if (object(item)) {
            const policy = aggregationFieldPolicy(item.op, "first");
            add(item, "field", `${base}/metrics/${pointer(metric)}/field`, policy.fieldType);
            if (item.where) expression(item.where, `${base}/metrics/${pointer(metric)}/where`, add);
        }
        if (object(raw.derive)) for (const [key, value] of Object.entries(raw.derive)) expression(value, `${base}/derive/${pointer(key)}`, add);
    }
}

function calculationReferences(specification: Json, result: FieldReferenceOccurrence[]): void {
    if (!object(specification.calculations)) return;
    const add = (owner: Json, key: string, path: string, requirement: "any" | "numeric" = "any") => {
        if (typeof owner[key] === "string") result.push({ reference: String(owner[key]), path, datasetName: "powerbi", requirement, source: "powerbi", set: next => { owner[key] = next; } });
    };
    if (Array.isArray(specification.calculations.fields)) specification.calculations.fields.forEach((item, index) => { if (object(item)) expression(item.expression, `/calculations/fields/${index}/expression`, add); });
    if (Array.isArray(specification.calculations.metrics)) specification.calculations.metrics.forEach((item, index) => {
        if (!object(item)) return;
        const policy = aggregationFieldRequirement(typeof item.aggregation === "string" ? item.aggregation : undefined, "first");
        add(item, "field", `/calculations/metrics/${index}/field`, policy.requirement);
        if (item.where) expression(item.where, `/calculations/metrics/${index}/where`, add);
    });
}

export function specificationFieldReferences(specification: unknown): FieldReferenceOccurrence[] {
    if (!object(specification)) return [];
    const result: FieldReferenceOccurrence[] = [];
    visitSpecificationComponents(specification, visit => {
        const type = typeof visit.component.type === "string" ? visit.component.type : "";
        const descriptor = getComponentDescriptor(type);
        if (!descriptor) return;
        const componentId = typeof visit.component.id === "string" ? visit.component.id : undefined;
        for (const descriptorField of descriptor.fields) dispatchComponentField({
            component: visit.component,
            descriptorField,
            componentPath: visit.path,
            componentId,
            effectiveDataset: visit.datasetName,
            emit: occurrence => result.push(occurrence),
        });
    });
    datasetReferences(specification, result);
    calculationReferences(specification, result);
    return result;
}

export function canonicalizeSpecificationFieldReferences(specification: unknown, data: NormalizedData, datasets: DatasetSchemaEvaluation, aliasOverrides: Record<string, string> = {}): Diagnostic[] {
    const diagnostics: Diagnostic[] = [];
    const resolver = new FieldResolver(data, aliasOverrides);
    for (const occurrence of specificationFieldReferences(specification)) {
        if (occurrence.path.startsWith("/data/")) continue;
        const scope = datasets.datasets.get(occurrence.datasetName) ?? datasets.datasets.get("powerbi");
        if (!scope) continue;
        let key = occurrence.reference;
        let field = scope.fields[key];
        if (!field) {
            const resolved = resolver.resolve(occurrence.reference);
            if (resolved.status === "resolved" && resolved.key && scope.fields[resolved.key]) {
                key = resolved.key;
                field = scope.fields[key];
                occurrence.set(key);
            } else {
                diagnostics.push({
                    code: resolved.status === "ambiguous" ? "AMBIGUOUS_FIELD" : occurrence.datasetName === "powerbi" ? "UNKNOWN_FIELD" : "UNKNOWN_DATASET_FIELD",
                    severity: "error",
                    path: occurrence.path,
                    componentId: occurrence.componentId,
                    message: resolved.status === "ambiguous" ? `Field “${occurrence.reference}” is ambiguous.` : `Field “${occurrence.reference}” is not available in dataset “${occurrence.datasetName}”.`,
                    received: occurrence.reference,
                    suggestions: resolved.candidates ?? closestMatches(occurrence.reference, Object.keys(scope.fields)),
                });
                continue;
            }
        }
        if (occurrence.requirement === "numeric" && field.dataType && field.dataType !== "unknown" && field.dataType !== "number") diagnostics.push({
            code: occurrence.datasetName === "powerbi" ? "FIELD_TYPE_MISMATCH" : "NON_NUMERIC_DATASET_FIELD",
            severity: "error",
            path: occurrence.path,
            componentId: occurrence.componentId,
            message: `Field “${key}” in dataset “${occurrence.datasetName}” must be numeric, but it is ${field.dataType}.`,
            received: key,
        });
    }
    return diagnostics;
}

/** Canonicalizes base aliases before calculation and dataset static schemas can be built. */
export function canonicalizePreSchemaFieldReferences(specification: unknown, data: NormalizedData, aliasOverrides: Record<string, string> = {}): void {
    const resolver = new FieldResolver(data, aliasOverrides);
    const calculated = new Set<string>();
    if (object(specification) && object(specification.calculations) && Array.isArray(specification.calculations.fields)) specification.calculations.fields.forEach(item => { if (object(item) && typeof item.key === "string") calculated.add(item.key); });
    for (const occurrence of specificationFieldReferences(specification)) {
        if (!occurrence.path.startsWith("/data/") && !occurrence.path.startsWith("/calculations/")) continue;
        if (calculated.has(occurrence.reference)) continue;
        const resolved = resolver.resolve(occurrence.reference);
        if (resolved.status === "resolved" && resolved.key) occurrence.set(resolved.key);
    }
}
