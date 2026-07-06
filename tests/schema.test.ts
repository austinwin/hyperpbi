import { describe, expect, it } from "vitest";
import { defaultSchema } from "../src/schema/defaultSchema";
import { validateSchema } from "../src/schema/validateSchema";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { migrateSchema } from "../src/schema/schemaMigrations";

describe("schema validation", () => {
    it("accepts the bundled default", () => expect(validateSchema(defaultSchema).valid).toBe(true));
    it("rejects executable component types", () => {
        const result = validateSchema({ version: "1.0", components: [{ type: "script", code: "alert(1)" }] });
        expect(result.valid).toBe(false);
    });
    it("limits component spans", () => expect(validateSchema({ version: "1.0", components: [{ type: "text", span: 99 }] }).valid).toBe(false));
    it("migrates AI-generated tab components to children", () => {
        const migrated = migrateSchema({ version: "1.0", components: [{ type: "tabs", id: "main", tabs: [{ id: "overview", title: "Overview", components: [{ type: "text", id: "inside", text: "Ready" }] }] }] });
        const result = validateSchema(migrated);
        expect(result.errors).toEqual([]);
        expect((result.schema?.components[0] as { tabs: Array<{ children: unknown[] }> }).tabs[0].children).toHaveLength(1);
    });
    it("accepts a global design system", () => expect(validateSchema({ version: "1.0", styles: { globalCss: ".hp-card { border-radius: 4px; }", components: { "*": { style: { minWidth: 0 } }, kpi: { css: ".value { font-size: 20px; }" } } }, components: [] }).valid).toBe(true));
    it("accepts the guided-builder component set",()=>expect(validateSchema({version:"1.0",components:[{type:"drawer",id:"detail_drawer",children:[{type:"detailPanel",id:"detail",selectedRow:true}]},{type:"filterDrawer",id:"filters",children:[{type:"segmentedControl",id:"status",field:"status"}]},{type:"timeline",id:"activity",dateField:"date",titleField:"name"},{type:"matrix",id:"matrix",rows:["status"],columns:["type"],values:[{field:"amount",aggregation:"sum"}]},{type:"smallMultiples",id:"small",splitField:"region",chart:{type:"barChart",category:"status",measure:"amount"}},{type:"advancedChart",id:"radar",options:{radar:{indicator:[]},series:[{type:"radar",data:[]}]}}]}).valid).toBe(true));
    it("requires safe minimum contracts for new data components",()=>{expect(validateSchema({version:"1.0",components:[{type:"timeline"},{type:"matrix",rows:[],values:[]},{type:"advancedChart"}]}).errors).toHaveLength(3);});
    it("keeps every shipped example valid", () => {
        const directory = resolve(process.cwd(), "examples");
        for (const file of readdirSync(directory).filter(name => name.endsWith(".json"))) {
            const result = validateSchema(JSON.parse(readFileSync(resolve(directory, file), "utf8")));
            expect(result.errors, file).toEqual([]);
        }
    });
    it("keeps the guided operations specification valid",()=>{const result=validateSchema(JSON.parse(readFileSync(resolve(process.cwd(),"examples/specs/guided-operations-dashboard.json"),"utf8")));expect(result.errors).toEqual([]);});
    it("keeps the Power BI authoring surface intentionally simple", () => {
        const capabilities = JSON.parse(readFileSync(resolve(process.cwd(), "capabilities.json"), "utf8"));
        const reportRenderer = readFileSync(resolve(process.cwd(), "src/render/HyperPbiRoot.tsx"), "utf8");
        const setupExperience = readFileSync(resolve(process.cwd(), "src/editor/SetupExperience.tsx"), "utf8");
        expect(capabilities.dataRoles).toEqual([{ displayName: "Values", name: "values", kind: "GroupingOrMeasure" }]);
        expect(capabilities.advancedEditModeSupport).toBe(2);
        expect(reportRenderer).not.toContain("Design with AI");
        expect(setupExperience).toContain("Select Edit");
        expect(capabilities.objects.hyperpbiState.properties.studioLayout).toBeDefined();
        expect(capabilities.supportsLandingPage).toBe(true);
        expect(capabilities.supportsEmptyDataView).toBe(true);
        expect(capabilities.supportsMultiVisualSelection).toBe(true);
    });
});
