import type { UiAction } from "../../schema/uiSchema";
import type { MapAttributeSource } from "../attributes/mapFeatureAttributes";
import type { ResolvedMapFeature } from "../model/resolvedMapTypes";
import { featureAttribute } from "../attributes/mapFeatureAttributes";

export interface MapPopupCondition { field: string; fieldSource?: MapAttributeSource; operator: "=" | "!=" | ">" | "<" | "contains"; value: string | number | boolean; }
export interface MapPopupContentBlock {
    id: string;
    type: "field" | "text" | "image" | "link" | "button" | "chart" | "section";
    label?: string;
    field?: string;
    fieldSource?: MapAttributeSource;
    text?: string;
    url?: string;
    color?: string;
    colorWhen?: MapPopupCondition & { color: string };
    decimals?: number;
    units?: string;
    dateFormat?: "short" | "long" | "iso";
    when?: MapPopupCondition;
    uiAction?: UiAction;
    series?: Array<{ field: string; fieldSource?: MapAttributeSource; label?: string }>;
    children?: MapPopupContentBlock[];
}
export function popupConditionMatches(condition: MapPopupCondition | undefined, feature: ResolvedMapFeature): boolean {
    if (!condition) return true;
    const actual = featureAttribute(feature, condition.field, condition.fieldSource ?? "service");
    if (condition.operator === ">") return Number(actual) > Number(condition.value);
    if (condition.operator === "<") return Number(actual) < Number(condition.value);
    if (condition.operator === "contains") return String(actual ?? "").toLowerCase().includes(String(condition.value).toLowerCase());
    const equals = String(actual ?? "") === String(condition.value);
    return condition.operator === "!=" ? !equals : equals;
}
export function popupContentUrl(value: string): string | undefined {
    try { const url = new URL(value); return url.protocol === "https:" && !url.username && !url.password ? url.href : undefined; } catch { return undefined; }
}
export function popupContentTemplate(template: string, feature: ResolvedMapFeature, source: MapAttributeSource = "service"): string {
    return template.replace(/\{\{\s*([^{}]{1,120}?)\s*\}\}/g, (_, token: string) => {
        const explicit = /^(service|powerbi|joined)\.(.+)$/.exec(token.trim());
        return String(featureAttribute(feature, explicit?.[2] ?? token.trim(), explicit ? explicit[1] as MapAttributeSource : source) ?? "");
    });
}
