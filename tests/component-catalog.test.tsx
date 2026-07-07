import { h, render } from "preact";
import { describe, expect, it } from "vitest";
import { componentTypeNames } from "../src/catalog/componentCatalog";
import { componentJsonExample, componentJsonExamples } from "../src/catalog/componentJsonExamples";
import { AiPromptComponentReference } from "../src/editor/ai/AiPromptComponentReference";
import { validateSchema } from "../src/schema/validateSchema";

describe("AI component catalog",()=>{
    it("provides complete copyable JSON for every standard component",()=>{const host=document.createElement("div");render(h(AiPromptComponentReference,{fieldKeys:["field"]}),host);expect(host.querySelectorAll(".hp-component-json")).toHaveLength(componentTypeNames.length);expect(host.querySelectorAll(".hp-component-json button")).toHaveLength(componentTypeNames.length);expect(host.textContent).toContain("Copy minimal dashboard JSON");expect(host.textContent).toContain("Copy component JSON");expect(host.textContent).toContain("Complete component JSON");expect(host.innerHTML).toContain("__field_key__");});
    it("has an intensive valid example with no generic fallback for every catalog type",()=>{expect(Object.keys(componentJsonExamples).sort()).toEqual([...componentTypeNames].sort());for(const type of componentTypeNames){const json=componentJsonExample(type);const component=JSON.parse(json) as Record<string,unknown>;expect(component.type).toBe(type);expect(component.id).toBeTruthy();expect(Object.keys(component).length).toBeGreaterThanOrEqual(7);expect(json.length).toBeGreaterThan(180);expect(validateSchema({version:"1.0",components:[component]})).toMatchObject({valid:true,errors:[]});}});
    it("documents full KPI, table, map, interaction, and advanced chart configuration",()=>{expect(componentJsonExamples.kpi).toMatchObject({field:"__field_key__",aggregation:"sum",format:"currency",intent:"primary"});expect(componentJsonExamples.table).toMatchObject({pagination:true,search:true,resizableColumns:true,selectable:true,external:true});expect(componentJsonExamples.map).toHaveProperty("settings.showLegend",true);expect(componentJsonExamples.custom).toHaveProperty("interactions.onClick.externalMode","filter");expect(componentJsonExamples.advancedChart).toHaveProperty("options.toolbox.show",true);});
    it("fails loudly when a catalog example is missing",()=>expect(()=>componentJsonExample("unknownComponent")).toThrow("Missing component JSON example"));
});
