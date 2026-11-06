import type { Diagnostic } from "../../schema/diagnostics";

const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === "object" && !Array.isArray(value);
export function validatePopupContent(value: unknown, path: string, componentId?: string): Diagnostic[] {
    const diagnostics: Diagnostic[] = [], ids = new Set<string>(); let count = 0;
    const error = (at: string, message: string) => diagnostics.push({ code: "INVALID_PROPERTY_TYPE", severity: "error", path: at, componentId, message } as Diagnostic);
    const condition = (value: unknown, at: string, color = false) => {
        if (!record(value) || typeof value.field !== "string" || !["=", "!=", ">", "<", "contains"].includes(String(value.operator)) || !["string", "number", "boolean"].includes(typeof value.value) || value.fieldSource !== undefined && !["service", "powerbi", "joined"].includes(String(value.fieldSource))) error(at, "Popup conditions need a field, valid fieldSource, operator and primitive value.");
        else if (color && (typeof value.color !== "string" || !/^#[\da-f]{6}$/i.test(value.color))) error(at, "Conditional colors must use six-digit HEX.");
    };
    const visit = (blocks: unknown, at: string, depth: number) => {
        if (!Array.isArray(blocks) || blocks.length > 40 || depth > 3) { error(at, "Popup content must have at most 40 blocks and three section levels."); return; }
        blocks.forEach((raw, index) => {
            const blockPath = `${at}/${index}`;
            if (++count > 80) { if (count === 81) error(at, "Popup content exceeds 80 total blocks."); return; }
            if (!record(raw) || typeof raw.id !== "string" || !raw.id || ids.has(raw.id) || !["field", "text", "image", "link", "button", "chart", "section"].includes(String(raw.type))) { error(blockPath, "Popup blocks need a unique id and supported type."); return; }
            ids.add(raw.id);
            const allowed = new Set(["id", "type", "label", "field", "fieldSource", "text", "url", "color", "colorWhen", "decimals", "units", "dateFormat", "when", "uiAction", "series", "children"]);
            for (const key of Object.keys(raw)) if (!allowed.has(key)) error(`${blockPath}/${key}`, `Unsupported popup block property: ${key}.`);
            for (const key of ["label", "field", "text", "url", "color", "units"]) if (raw[key] !== undefined && typeof raw[key] !== "string") error(`${blockPath}/${key}`, `${key} must be text.`);
            if (raw.fieldSource !== undefined && !["service", "powerbi", "joined"].includes(String(raw.fieldSource))) error(`${blockPath}/fieldSource`, "Choose a service, powerbi or joined field source.");
            if (raw.decimals !== undefined && (!Number.isInteger(raw.decimals) || Number(raw.decimals) < 0 || Number(raw.decimals) > 10)) error(`${blockPath}/decimals`, "Decimal precision must be an integer from 0 through 10.");
            if (raw.dateFormat !== undefined && !["short", "long", "iso"].includes(String(raw.dateFormat))) error(`${blockPath}/dateFormat`, "Date format must be short, long or iso.");
            if (raw.when !== undefined) condition(raw.when, `${blockPath}/when`);
            if (raw.colorWhen !== undefined) condition(raw.colorWhen, `${blockPath}/colorWhen`, true);
            if (raw.uiAction !== undefined && (!record(raw.uiAction) || !["showToast", "clearFilters", "openOverlay", "setTab", "refresh"].includes(String(raw.uiAction.type)))) error(`${blockPath}/uiAction`, "Popup block buttons support declarative supported structured UI actions.");
            if (raw.series !== undefined) {
                if (!Array.isArray(raw.series) || raw.series.length > 12 || raw.series.some(item => !record(item) || typeof item.field !== "string" || item.fieldSource !== undefined && !["powerbi", "service", "joined"].includes(String(item.fieldSource)))) error(`${blockPath}/series`, "Charts need at most 12 named fields with valid field sources.");
            }
            if (raw.children !== undefined) visit(raw.children, `${blockPath}/children`, depth + 1);
        });
    };
    visit(value, path, 0); return diagnostics;
}
