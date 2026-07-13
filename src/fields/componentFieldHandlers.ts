import type { FieldReferenceDescriptor, FieldTraversalHandler } from "../catalog/componentDescriptors";
import { aggregationFieldPolicy } from "./aggregationFieldPolicy";
import type { FieldReferenceOccurrence, FieldReferenceSource } from "./specificationFieldReferences";

type Json = Record<string, unknown>;
type Requirement = FieldReferenceOccurrence["requirement"];
type Handler = (context: ComponentFieldHandlerContext) => void;

export interface ComponentFieldHandlerContext {
    component: Json;
    descriptorField: FieldReferenceDescriptor;
    componentPath: string;
    componentId?: string;
    effectiveDataset: string;
    emit(occurrence: FieldReferenceOccurrence): void;
}

const object = (value: unknown): value is Json => Boolean(value) && typeof value === "object" && !Array.isArray(value);
const pointer = (value: string) => value.replace(/~/g, "~0").replace(/\//g, "~1");
const sourceFor = (context: ComponentFieldHandlerContext): FieldReferenceSource => context.effectiveDataset === "powerbi" ? "powerbi" : "dataset";
const preserved = (reference: string) => /^(metric|state|selected|config|configuration|runtime)\./.test(reference) || reference.startsWith("$");

function emitValue(context: ComponentFieldHandlerContext, owner: Json, key: string, path: string, requirement: Requirement = context.descriptorField.requirement, source: FieldReferenceSource = sourceFor(context)): void {
    const value = owner[key];
    if (typeof value !== "string" || !value || preserved(value) || source === "service" || source === "joined") return;
    context.emit({ reference: value, path, componentId: context.componentId, datasetName: context.effectiveDataset, requirement, source, set: next => { owner[key] = next; } });
}

function emitArray(context: ComponentFieldHandlerContext, owner: Json, key: string, path: string, requirement: Requirement = context.descriptorField.requirement): void {
    const values = owner[key];
    if (!Array.isArray(values)) return;
    values.forEach((value, index) => {
        if (typeof value !== "string" || preserved(value)) return;
        context.emit({ reference: value, path: `${path}/${index}`, componentId: context.componentId, datasetName: context.effectiveDataset, requirement, source: sourceFor(context), set: next => { values[index] = next; } });
    });
}

function expression(context: ComponentFieldHandlerContext, node: unknown, path: string): void {
    if (Array.isArray(node)) { node.forEach((item, index) => expression(context, item, `${path}/${index}`)); return; }
    if (!object(node)) return;
    emitValue(context, node, "field", `${path}/field`);
    componentFieldHandlers["value-from-row"]({ ...context, component: node, componentPath: path, descriptorField: { property: "valueFromRow", requirement: "any", handler: "value-from-row" } });
    for (const [key, child] of Object.entries(node)) if (!["field", "valueFromRow", "value"].includes(key)) expression(context, child, `${path}/${pointer(key)}`);
}

const tokenPattern = /{{\s*(?:(row|item|datum|field|sum|avg|min|max|distinctCount|metric|state|selected|config|configuration|runtime)\.)?([A-Za-z][A-Za-z0-9_-]*)\s*}}/g;
function templateString(context: ComponentFieldHandlerContext, owner: Json, key: string, path: string, source: FieldReferenceSource = sourceFor(context)): void {
    const value = owner[key];
    if (typeof value !== "string") return;
    for (const match of value.matchAll(tokenPattern)) {
        const namespace = match[1];
        const reference = match[2];
        if (!reference || ["metric", "state", "selected", "config", "configuration", "runtime"].includes(namespace)) continue;
        const originalToken = match[0];
        const replacement = (next: string) => `{{${namespace ? `${namespace}.` : ""}${next}}}`;
        context.emit({
            reference,
            path: `${path}#${match.index ?? 0}`,
            componentId: context.componentId,
            datasetName: context.effectiveDataset,
            requirement: "any",
            source,
            set: next => { owner[key] = String(owner[key]).replace(originalToken, replacement(next)); },
        });
    }
}

function templateValue(context: ComponentFieldHandlerContext, value: unknown, path: string, owner?: Json, key?: string): void {
    if (owner && key !== undefined && typeof value === "string") { templateString(context, owner, key, path); return; }
    if (Array.isArray(value)) { value.forEach((item, index) => templateValue(context, item, `${path}/${index}`)); return; }
    if (!object(value)) return;
    for (const [childKey, child] of Object.entries(value)) templateValue(context, child, `${path}/${pointer(childKey)}`, value, childKey);
}

function action(context: ComponentFieldHandlerContext, value: unknown, path: string): void {
    if (Array.isArray(value)) { value.forEach((item, index) => action(context, item, `${path}/${index}`)); return; }
    if (!object(value)) return;
    emitValue(context, value, "field", `${path}/field`);
    componentFieldHandlers["value-from-row"]({ ...context, component: value, componentPath: path, descriptorField: { property: "valueFromRow", requirement: "any", handler: "value-from-row" } });
    if (value.where !== undefined) componentFieldHandlers["where-expression"]({ ...context, component: value, componentPath: path, descriptorField: { property: "where", requirement: "any", handler: "where-expression" } });
    for (const [key, child] of Object.entries(value)) if (!["field", "valueFromRow", "where", "value"].includes(key) && (Array.isArray(child) || object(child))) action(context, child, `${path}/${pointer(key)}`);
}

function mapLayers(context: ComponentFieldHandlerContext): void {
    const layers = context.component[context.descriptorField.property];
    if (!Array.isArray(layers)) return;
    layers.forEach((raw, index) => {
        if (!object(raw)) return;
        const path = `${context.componentPath}/${context.descriptorField.property}/${index}`;
        const source = object(raw.source) ? raw.source : {};
        const sourceType = String(source.type ?? "powerbi");
        const defaultSource: FieldReferenceSource = sourceType === "powerbi" ? sourceFor(context) : raw.join ? "joined" : "service";
        if (object(source.bindings)) for (const key of Object.keys(source.bindings)) emitValue(context, source.bindings, key, `${path}/source/bindings/${pointer(key)}`, ["latitude", "longitude", "x", "y", "size"].includes(key) ? "numeric" : "any", sourceFor(context));
        if (object(raw.join)) emitValue(context, raw.join, "powerBiField", `${path}/join/powerBiField`, "any", sourceFor(context));
        if (object(raw.renderer)) {
            const fieldSource = (raw.renderer.fieldSource ?? defaultSource) as FieldReferenceSource;
            const type = String(raw.renderer.type ?? "");
            if (type === "heatmap") emitValue(context, raw.renderer, "weightField", `${path}/renderer/weightField`, "numeric", fieldSource);
            else if (type === "cluster") emitValue(context, raw.renderer, "aggregateField", `${path}/renderer/aggregateField`, ["sum", "avg", "min", "max"].includes(String(raw.renderer.clusterLabel)) ? "numeric" : "any", fieldSource);
            else emitValue(context, raw.renderer, "field", `${path}/renderer/field`, ["classBreaks", "continuousColor", "proportionalSize"].includes(type) || type === "densityGrid" && ["sum", "avg"].includes(String(raw.renderer.statistic)) ? "numeric" : "any", fieldSource);
        }
        if (object(raw.labels)) {
            const fieldSource = (raw.labels.fieldSource ?? defaultSource) as FieldReferenceSource;
            emitValue(context, raw.labels, "field", `${path}/labels/field`, "any", fieldSource);
            templateString(context, raw.labels, "template", `${path}/labels/template`, fieldSource);
        }
        for (const section of ["popup", "tooltip"]) {
            const sectionValue = raw[section];
            if (!object(sectionValue)) continue;
            if (Array.isArray(sectionValue.fields)) sectionValue.fields.forEach((item, itemIndex) => { if (object(item)) emitValue(context, item, "field", `${path}/${section}/fields/${itemIndex}/field`, "any", (item.fieldSource ?? defaultSource) as FieldReferenceSource); });
            for (const key of ["html", "template", "title"]) templateString(context, sectionValue, key, `${path}/${section}/${key}`, defaultSource);
        }
        // Visibility conditions and declarative interaction payloads operate on
        // the Power BI-backed row context even when the visual layer is joined
        // to an external service. Service/joined attributes stay explicit in
        // renderer, label, popup, and tooltip fieldSource metadata.
        if (object(raw.visibility)) emitValue(context, raw.visibility, "conditionField", `${path}/visibility/conditionField`, "any", sourceFor(context));
        if (object(raw.interaction)) emitValue(context, raw.interaction, "field", `${path}/interaction/field`, "any", sourceFor(context));
    });
}

function svgElements(context: ComponentFieldHandlerContext): void {
    const visit = (value: unknown, path: string): void => {
        if (Array.isArray(value)) { value.forEach((item, index) => visit(item, `${path}/${index}`)); return; }
        if (!object(value)) return;
        if (typeof value.bind === "string") emitValue(context, value, "bind", `${path}/bind`); else if (object(value.bind)) emitValue(context, value.bind, "field", `${path}/bind/field`);
        if (object(value.when)) emitValue(context, value.when, "field", `${path}/when/field`);
        if (object(value.repeat)) { emitValue(context, value.repeat, "field", `${path}/repeat/field`); emitValue(context, value.repeat, "keyField", `${path}/repeat/keyField`); }
        for (const [key, child] of Object.entries(value)) {
            if (["bind", "when", "repeat"].includes(key)) continue;
            if (typeof child === "string") templateString(context, value, key, `${path}/${pointer(key)}`); else visit(child, `${path}/${pointer(key)}`);
        }
    };
    visit(context.component[context.descriptorField.property], `${context.componentPath}/${context.descriptorField.property}`);
}

export const componentFieldHandlers: Record<FieldTraversalHandler, Handler> = {
    scalar(context) {
        let requirement = context.descriptorField.requirement;
        if (["field", "measure", "valueField"].includes(context.descriptorField.property) && context.component.aggregation !== undefined) requirement = aggregationFieldPolicy(context.component.aggregation).fieldType;
        emitValue(context, context.component, context.descriptorField.property, `${context.componentPath}/${context.descriptorField.property}`, requirement);
    },
    "field-array"(context) { emitArray(context, context.component, context.descriptorField.property, `${context.componentPath}/${context.descriptorField.property}`); },
    "matrix-rows"(context) { emitArray(context, context.component, context.descriptorField.property, `${context.componentPath}/${context.descriptorField.property}`); },
    "table-columns"(context) {
        const items = context.component[context.descriptorField.property];
        if (!Array.isArray(items)) return;
        items.forEach((item, index) => {
            if (typeof item === "string" && !preserved(item)) context.emit({ reference: item, path: `${context.componentPath}/${context.descriptorField.property}/${index}`, componentId: context.componentId, datasetName: context.effectiveDataset, requirement: context.descriptorField.requirement, source: sourceFor(context), set: next => { items[index] = next; } });
            else if (object(item)) emitValue(context, item, "field", `${context.componentPath}/${context.descriptorField.property}/${index}/field`);
        });
    },
    "matrix-values"(context) {
        const items = context.component[context.descriptorField.property];
        if (!Array.isArray(items)) return;
        items.forEach((item, index) => { if (object(item)) { const policy = aggregationFieldPolicy(item.aggregation); emitValue(context, item, "field", `${context.componentPath}/${context.descriptorField.property}/${index}/field`, policy.fieldType); if (object(item.where)) emitValue(context, item.where, "field", `${context.componentPath}/${context.descriptorField.property}/${index}/where/field`, policy.whereFieldType); } });
    },
    "combo-series"(context) {
        const items = context.component[context.descriptorField.property]; if (!Array.isArray(items)) return;
        items.forEach((item, index) => { if (object(item)) emitValue(context, item, "field", `${context.componentPath}/${context.descriptorField.property}/${index}/field`, aggregationFieldPolicy(item.aggregation).fieldType); });
    },
    "radar-indicators"(context) {
        const items = context.component[context.descriptorField.property]; if (!Array.isArray(items)) return;
        items.forEach((item, index) => { if (object(item)) emitValue(context, item, "field", `${context.componentPath}/${context.descriptorField.property}/${index}/field`, "numeric"); });
    },
    "display-metrics"(context) {
        const items = context.component[context.descriptorField.property]; if (!Array.isArray(items)) return;
        items.forEach((item, index) => { if (!object(item)) return; const policy = aggregationFieldPolicy(item.aggregation, "first"); emitValue(context, item, "field", `${context.componentPath}/${context.descriptorField.property}/${index}/field`, policy.fieldType); if (item.where !== undefined) expression(context, item.where, `${context.componentPath}/${context.descriptorField.property}/${index}/where`); });
    },
    "detail-groups"(context) {
        const groups = context.component[context.descriptorField.property]; if (!Array.isArray(groups)) return;
        groups.forEach((group, groupIndex) => { if (!object(group) || !Array.isArray(group.fields)) return; group.fields.forEach((item, index) => { const path = `${context.componentPath}/${context.descriptorField.property}/${groupIndex}/fields/${index}`; if (typeof item === "string") { const fields = group.fields as unknown[]; context.emit({ reference: item, path, componentId: context.componentId, datasetName: context.effectiveDataset, requirement: "any", source: sourceFor(context), set: next => { fields[index] = next; } }); } else if (object(item)) emitValue(context, item, "field", `${path}/field`); }); });
    },
    "item-bindings"(context) {
        const items = context.component[context.descriptorField.property]; if (!Array.isArray(items)) return;
        items.forEach((item, index) => { if (!object(item)) return; for (const binding of ["field", "primaryField", "secondaryField", "badgeField", "valueField", "labelField"]) emitValue(context, item, binding, `${context.componentPath}/${context.descriptorField.property}/${index}/${binding}`, binding === "valueField" ? "numeric" : "any"); if (item.where !== undefined) expression(context, item.where, `${context.componentPath}/${context.descriptorField.property}/${index}/where`); });
    },
    "repeat-bindings"(context) {
        const repeat = context.component[context.descriptorField.property]; if (!object(repeat)) return;
        for (const key of ["distinctBy", "sortBy", "keyField", "field"]) emitValue(context, repeat, key, `${context.componentPath}/${context.descriptorField.property}/${key}`);
        templateString(context, repeat, "template", `${context.componentPath}/${context.descriptorField.property}/template`);
    },
    template(context) { templateValue(context, context.component[context.descriptorField.property], `${context.componentPath}/${context.descriptorField.property}`, context.component, context.descriptorField.property); },
    interaction(context) { const value = context.component[context.descriptorField.property]; if (object(value)) emitValue(context, value, "field", `${context.componentPath}/${context.descriptorField.property}/field`); },
    "event-actions"(context) { const value = context.component[context.descriptorField.property]; if (object(value)) for (const [event, eventValue] of Object.entries(value)) action(context, eventValue, `${context.componentPath}/${context.descriptorField.property}/${pointer(event)}`); },
    "where-expression"(context) { expression(context, context.component[context.descriptorField.property], `${context.componentPath}/${context.descriptorField.property}`); },
    "value-from-row"(context) { emitValue(context, context.component, context.descriptorField.property, `${context.componentPath}/${context.descriptorField.property}`); },
    "map-layers": mapLayers,
    "svg-elements": svgElements,
    "nested-chart"() { /* Traversed as a descriptor-declared single component container. */ },
};

export const registeredComponentFieldHandlers = Object.freeze(Object.keys(componentFieldHandlers) as FieldTraversalHandler[]);
export const composedComponentFieldHandlers = Object.freeze(["where-expression", "value-from-row"] as const);

export function dispatchComponentField(context: ComponentFieldHandlerContext): void {
    const handler = componentFieldHandlers[context.descriptorField.handler];
    if (!handler) throw new Error(`Descriptor field handler “${context.descriptorField.handler}” is not registered for ${String(context.component.type)}.${context.descriptorField.property}.`);
    handler(context);
}
