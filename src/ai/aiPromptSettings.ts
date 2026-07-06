import { builderComponentOptions } from "../editor/builder/builderState";

export type PromptPrivacyMode = "samples" | "masked" | "summary" | "fields" | "types";
export interface AiPromptSettings {
    goal: string; audience: string; layoutPattern: string; stylePreset: string; designStyle: string; components: string[]; privacyMode: PromptPrivacyMode; sampleRows: number; selectedFields: string[];
    mapRequired: boolean; tableRequired: boolean; chartsRequired: boolean; controlsRequired: boolean; calculationsRequired: boolean; externalInteractions: boolean;
}
export const defaultAiPromptSettings: AiPromptSettings = { goal: "Executive operations dashboard", audience: "Manager", layoutPattern: "KPI top row + charts + detail table", stylePreset: "Enterprise Light", designStyle: "Enterprise Light", components: ["KPI cards", "Metric grid", "Search box", "Filters/selectors", "Charts", "Table", "External Power BI selection"], privacyMode: "fields", sampleRows: 10, selectedFields: [], mapRequired: false, tableRequired: true, chartsRequired: true, controlsRequired: true, calculationsRequired: false, externalInteractions: true };
export const promptComponentOptions = builderComponentOptions;
