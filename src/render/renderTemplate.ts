import { DataRow, NormalizedData } from "../data/normalizeData";
import { formatValue } from "../utils/formatValue";

const tokenPattern = /\{\{\s*([A-Za-z][A-Za-z0-9_.-]{0,100})\s*\}\}/g;

export interface TemplateContext { selected?: Record<string, unknown>; row?: DataRow; props?: Record<string, unknown>; state?: Record<string, unknown>; title?: string; }
export function renderTemplate(template: string, data: NormalizedData, selected: Record<string, unknown> = {}, title = "", context: TemplateContext = {}): string {
    return template.replace(tokenPattern, (_match, token: string) => {
        if (token === "title") return context.title ?? title;
        if (token === "count") return String(data.rows.length);
        const [namespace, key, property] = token.split(".");
        if (!key) return "";
        if (namespace === "field") return property === "displayName" || !property ? data.fields[key]?.displayName ?? "" : "";
        if (namespace === "selected") return formatValue((context.selected ?? selected)[key]);
        if (namespace === "row") return formatValue(context.row?.[key]);
        if (namespace === "prop") return formatValue(context.props?.[key] as never);
        if (namespace === "state") return formatValue(context.state?.[key] as never);
        if (namespace === "metric") return formatValue(data.calculatedMetrics?.[key]);
        if (["sum", "avg", "min", "max", "distinctCount", "first"].includes(namespace)) {
            const record = data.aggregates[namespace as keyof typeof data.aggregates];
            return typeof record === "object" ? formatValue(record[key]) : "";
        }
        return "";
    });
}
