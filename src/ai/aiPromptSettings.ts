export type PromptPrivacyMode = "samples" | "masked" | "summary" | "fields" | "types";
export interface AiPromptSettings {
    goal: string; audience: string; designStyle: string; components: string[]; privacyMode: PromptPrivacyMode; sampleRows: number; selectedFields: string[];
    mapRequired: boolean; tableRequired: boolean; chartsRequired: boolean; controlsRequired: boolean; calculationsRequired: boolean; externalInteractions: boolean;
}
export const defaultAiPromptSettings: AiPromptSettings = { goal: "Executive operations dashboard", audience: "Manager", designStyle: "Enterprise compact", components: ["KPI cards", "Metric grid", "Bar chart", "Table", "Tabs", "Search box"], privacyMode: "fields", sampleRows: 10, selectedFields: [], mapRequired: false, tableRequired: true, chartsRequired: true, controlsRequired: true, calculationsRequired: false, externalInteractions: true };
export const promptComponentOptions = ["KPI cards","Metric grid","Bar chart","Line chart","Gauge","Heatmap","Table","Map","Tabs","Collapsible sections","Left filter panel","Search box","Slider","Select/multi-select","HTML header/callout","Detail panel","Custom component"];
