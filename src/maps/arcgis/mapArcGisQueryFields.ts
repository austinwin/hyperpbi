import type { ArcGisFeatureLayerSource, MapLayerDefinition, MapRendererDefinition } from "../../schema/mapSchema";
import { defaultAttributeSource, type MapAttributePurpose, type MapAttributeSource } from "../attributes/mapFeatureAttributes";

function effectiveSource(layer: MapLayerDefinition, explicit: MapAttributeSource | undefined, purpose: MapAttributePurpose): MapAttributeSource {
    return explicit ?? defaultAttributeSource(layer, purpose);
}
function templateFields(template: string, fields: Set<string>): void {
    for (const match of template.matchAll(/\{\{\s*([^{}]{1,120}?)\s*\}\}/g)) {
        const field = match[1]?.trim();
        if (field) fields.add(field);
    }
}

function rendererFields(layer: MapLayerDefinition, renderer: MapRendererDefinition | undefined, fields: Set<string>): void {
    if (!renderer) return;
    const raw = renderer as unknown as Record<string, unknown>;
    const source = effectiveSource(layer, "fieldSource" in renderer ? renderer.fieldSource : undefined, "renderer");
    if (source !== "service") return;
    for (const property of ["field", "field1", "field2", "field3", "weightField", "aggregateField"]) {
        if (typeof raw[property] === "string" && raw[property]) fields.add(String(raw[property]));
    }
}

/** Return only fields that must come from the ArcGIS service namespace. */
export function collectArcGisQueryFields(layer: MapLayerDefinition, source: ArcGisFeatureLayerSource): string[] {
    const fields = new Set<string>();
    if (layer.join?.serviceField) fields.add(layer.join.serviceField);
    rendererFields(layer, layer.renderer, fields);

    const labelSource = effectiveSource(layer, layer.labels?.fieldSource, "label");
    if (labelSource === "service") {
        if (layer.labels?.field) fields.add(layer.labels.field);
        if (layer.labels?.template) templateFields(layer.labels.template, fields);
    }

    for (const field of layer.popup?.fields ?? []) if (effectiveSource(layer, field.fieldSource, "popup") === "service") fields.add(field.field);
    for (const field of layer.tooltip?.fields ?? []) if (effectiveSource(layer, field.fieldSource, "tooltip") === "service") fields.add(field.field);
    const tooltipTemplateSource = effectiveSource(layer, layer.tooltip?.defaultFieldSource, "tooltip");
    if (layer.tooltip?.template && tooltipTemplateSource === "service") templateFields(layer.tooltip.template, fields);
    const popupTemplateSource = effectiveSource(layer, layer.popup?.defaultFieldSource, "popup");
    if (layer.popup?.title && popupTemplateSource === "service") templateFields(layer.popup.title, fields);
    if (layer.popup?.html && popupTemplateSource === "service") templateFields(layer.popup.html, fields);

    if (layer.visibility?.conditionField && effectiveSource(layer, layer.visibility.conditionFieldSource, "visibility") === "service") fields.add(layer.visibility.conditionField);
    for (const filter of layer.filter ? (Array.isArray(layer.filter) ? layer.filter : [layer.filter]) : []) {
        if (effectiveSource(layer, filter.fieldSource, "filter") === "service") fields.add(filter.field);
    }
    if (layer.interaction?.field && effectiveSource(layer, layer.interaction.fieldSource, "interaction") === "service") fields.add(layer.interaction.field);
    for (const field of source.outFields ?? []) if (field) fields.add(field);
    return [...fields];
}
