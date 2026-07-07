import { NormalizedData } from "../data/normalizeData";
import { AiPromptSettings } from "./aiPromptSettings";
import { fieldDictionaryForPrompt } from "./fieldDictionaryForPrompt";
import { sampleRowsForPrompt } from "./sampleRowsForPrompt";
import { specShape } from "./promptTemplates";
import { buildHyperPbiSkill } from "./buildHyperPbiSkill";
import { designPresetPrompt } from "../design/stylePresets";
import { minimalDashboardJson } from "./minimalDashboard";

export function buildAiPrompt(data: NormalizedData, settings: AiPromptSettings, viewport?: { width: number; height: number }): string {
    const fields = fieldDictionaryForPrompt(data, settings.selectedFields, settings.privacyMode === "types"); const samples = sampleRowsForPrompt(data, settings.privacyMode, settings.sampleRows, settings.selectedFields);
    const skill = buildHyperPbiSkill(data,false);
    const requirements = [...settings.components, settings.mapRequired ? "Map" : "", settings.tableRequired ? "Table" : "", settings.chartsRequired ? "Charts" : "", settings.controlsRequired ? "Filters and controls" : "", settings.calculationsRequired ? "Calculated fields/metrics" : "", settings.externalInteractions ? "Power BI external selections" : ""].filter(Boolean);
    return `You are generating a HyperPBI dashboard specification for a Power BI custom visual.

return this exact shape expanded, not markdown.
${minimalDashboardJson}

HyperPBI renders full enterprise dashboards from JSON. It supports layouts, KPI cards, metric grids, safe controls, tabs, collapsibles, tables, ECharts charts, Leaflet maps, sanitized HTML/CSS, safe JSON calculations, custom components, slots, and Power BI report selections. It does not execute JavaScript.

Follow this HyperPBI engine skill exactly:
${skill}

Dashboard goal: ${settings.goal}
Audience: ${settings.audience}
Layout pattern: ${settings.layoutPattern}
Design preset: ${settings.stylePreset || settings.designStyle}
${designPresetPrompt(settings.stylePreset || settings.designStyle)}
Current visual size: ${viewport?.width ?? "unknown"} x ${viewport?.height ?? "unknown"} pixels
Requested components: ${requirements.join(", ")}

Use only normalized field keys from this dictionary. Prefer stable table-qualified keys such as workorders_status. displayName is a UI label only; never use it as a JSON field reference. Never invent a field:
${JSON.stringify(fields, null, 2)}

Sample rows or safe summaries (${settings.privacyMode} mode):
${JSON.stringify(samples, null, 2)}

Every component needs a unique validation-friendly id. Components may use css and slots; custom components may use sanitized html, props, repeat, and predefined interactions only. Use compact enterprise spacing, restrained colors, useful tables/maps, and avoid decorative chart clutter.

Required output:
- Return only one valid JSON object.
- Do not use markdown fences or explanations.
- Do not add comments.
- Do not use JavaScript, functions, eval, or event handlers.
- Use only provided normalized field keys.
- Use the calculation DSL for derived logic.
- Use global CSS through styles.globalCss, reusable defaults through styles.components, and component CSS through css.
- Include version "1.0" and a components array.

Minimal shape reference:
${specShape}`;
}
