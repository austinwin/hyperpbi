import { builderComponentOptions } from "../editor/builder/builderState";

export type PromptPrivacyMode = "samples" | "masked" | "summary" | "fields" | "types";
export type PromptJob = "create" | "improve" | "add-section" | "redesign-section" | "repair";
export interface AiPromptSettings {
    goal: string; audience: string; layoutPattern: string; stylePreset: string; designStyle: string; components: string[]; privacyMode: PromptPrivacyMode; sampleRows: number; selectedFields: string[];
    mapRequired: boolean; tableRequired: boolean; chartsRequired: boolean; controlsRequired: boolean; calculationsRequired: boolean; externalInteractions: boolean;
    job:PromptJob; insertionPosition:"before"|"after"|"inside";insertionContainer?:string; decisions:string; primaryEntity:string; applicationType:string; requiredSections:string; requiredFilters:string; importantKpis:string; detailPanelRequired:boolean; devicePriority:"desktop"|"balanced"|"mobile"; interactionExpectations:string; complexity:"simple"|"standard"|"advanced"; aliasOverrides:Record<string,string>;
}
export const defaultAiPromptSettings: AiPromptSettings = { goal: "Executive operations dashboard", audience: "Manager", layoutPattern: "KPI top row + charts + detail table", stylePreset: "Enterprise Light", designStyle: "Enterprise Light", components: ["KPI cards", "Metric grid", "Search box", "Filters/selectors", "Charts", "Table", "External Power BI selection"], privacyMode: "fields", sampleRows: 10, selectedFields: [], mapRequired: false, tableRequired: true, chartsRequired: true, controlsRequired: true,calculationsRequired:false,externalInteractions:true,job:"create",insertionPosition:"inside",decisions:"",primaryEntity:"",applicationType:"executive-overview",requiredSections:"",requiredFilters:"",importantKpis:"",detailPanelRequired:false,devicePriority:"balanced",interactionExpectations:"Filter related views and preserve Power BI selection",complexity:"standard",aliasOverrides:{} };
export const promptComponentOptions = builderComponentOptions;
