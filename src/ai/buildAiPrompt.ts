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

HyperPBI renders full enterprise dashboards from JSON. It supports professional application shells (root \`app\`), layouts, KPI cards, metric grids, safe controls, tabs, collapsibles, tables, ECharts charts, Leaflet maps, sanitized HTML/CSS, safe JSON calculations, custom components, slots, Power BI report selections, declarative UI actions, cards, dropdowns, modals, offcanvas panels, list groups, data grids, empty/loading states, accordions, steps, toasts, and more. It does not execute JavaScript.

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

Key guidance:
- Use \`app\` for professional application layout (navbar, sidebar, page header). Do not rebuild navbar/sidebar through custom HTML or enormous styles.globalCss blocks.
- Prefer first-class card, list, data grid, offcanvas, and menu primitives.
- Prefer first-class chart types, including comboChart, waterfallChart, sankeyChart, treemapChart, funnelChart, and radarChart. Use advancedChart only when no semantic chart supports the request; never override semantic chart data through options.
- Give every overlay an explicit unique ID. Use dropdown for commands, popover for contextual interactive content, offcanvas for persistent details or filters, and modal only for focused blocking tasks.
- Use custom HTML only for genuinely custom data presentations.
- Use UI actions for navigation/overlay behavior (openOverlay, setTab, showToast, etc.).
- Use universal interactions for data filtering and Power BI selection.
- Keep Power BI dashboards compact and enterprise-grade.
- Do not generate irrelevant web-app functionality.
- Tabulator is not bundled; HyperPBI native tables are the supported table engine.
- Never set ECharts useDirtyRect=true; the Power BI runtime forces dirty rectangles and lazy updates off. Built-in charts replace complete options on update.
- Map Layers, Legend, and Location Search are compact mutually exclusive toolbar popovers. Location Search uses the Runtime Config geocoder and is separate from Zoom to Selection.
- Map search is user-triggered only: never geocode on render or keystrokes. Maps-package WebAccess and explicit privacy acknowledgment are required; the Core package never performs external geocoding.
- Viewer layer opacity is entered from 0 through 100 percent and stored in specifications/runtime state from 0 through 1.

Interaction behavior: every new component must include the universal interaction object. Auto externally filters controls/slicers and selects exact identities for rows, chart points, map features, timeline items, and custom row actions. Internal and external modes are independent. Use internalMode:"none" when the source must stay unchanged. Use externalMode:"filter" only with an explicit unambiguous model-column field. Never emit deprecated internal, external, selectable, or table selectionMode properties.

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
