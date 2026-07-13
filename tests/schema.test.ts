import { describe, expect, it } from "vitest";
import { defaultSchema } from "../src/schema/defaultSchema";
import { validateSchema } from "../src/schema/validateSchema";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { migrateSchema } from "../src/schema/schemaMigrations";
import { expandDefinitions } from "../src/schema/definitionExpansion";
import { expandPatterns } from "../src/schema/patternRegistry";

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
    it("validates map tooltip fields, sources, labels, formats, templates, and enabled state", () => {
        const valid = validateSchema({ version: "1.0", components: [{ type: "map", layers: [{ id: "assets", name: "Assets", source: { type: "powerbi" }, tooltip: { enabled: true, template: "{{NAME}}", fields: [{ field: "NAME", fieldSource: "service", label: "Name", format: "text" }] } }] }] });
        expect(valid.errors).toEqual([]);
        const invalid = validateSchema({ version: "1.0", components: [{ type: "map", layers: [{ id: "assets", name: "Assets", source: { type: "powerbi" }, tooltip: { enabled: "yes", template: 4, fields: [{ field: " ", fieldSource: "remote", label: 2, format: false }] } }] }] });
        expect(invalid.errors).toEqual(expect.arrayContaining([
            expect.stringContaining("enabled"), expect.stringContaining("template"), expect.stringContaining("nonblank"),
            expect.stringContaining("fieldSource"), expect.stringContaining("label"), expect.stringContaining("format"),
        ]));
    });
    it("keeps every shipped example valid", () => {
        const directory = resolve(process.cwd(), "examples");
        for (const file of readdirSync(directory).filter(name => name.endsWith(".json"))) {
            const result = validateSchema(JSON.parse(readFileSync(resolve(directory, file), "utf8")));
            expect(result.errors, file).toEqual([]);
        }
    });
    it("keeps the guided operations specification valid",()=>{const result=validateSchema(JSON.parse(readFileSync(resolve(process.cwd(),"examples/specs/guided-operations-dashboard.json"),"utf8")));expect(result.errors).toEqual([]);});
    it("keeps version 2 example specifications structurally valid after compilation",()=>{const directory=resolve(process.cwd(),"examples/specs");for(const file of readdirSync(directory).filter(name=>name.startsWith("v2-")&&name.endsWith(".json"))){const input=JSON.parse(readFileSync(resolve(directory,file),"utf8"));const expanded=expandPatterns(expandDefinitions(input).value);expect(expanded.diagnostics,file).toEqual([]);expect(validateSchema(expanded.value).errors,file).toEqual([]);}});
    it("keeps practical ArcGIS examples internally consistent", () => {
        for (const file of ["arcgis-wastewater-live-map.json", "arcgis-wastewater-join-map.json"]) {
            const example = JSON.parse(readFileSync(resolve(process.cwd(), "examples/specs", file), "utf8"));
            const map = example.components[0];
            expect(map.view.center, file).toEqual([29.75, -95.35]);
            expect(map.layers[0].popup.title, file).toContain("{{FACILITYID}}");
            expect(map.toolbar.clearSelection, file).toBe(true);
            expect(map.toolbar.legend, file).toBe(true);
            expect(map.layerPanel, file).toMatchObject({ visible: true, allowViewerReorder: true, allowViewerOpacity: true, allowViewerLabels: true });
        }
        const live = JSON.parse(readFileSync(resolve(process.cwd(), "examples/specs/arcgis-wastewater-live-map.json"), "utf8"));
        expect(live.components[0].layers[0].source.outFields).not.toContain("SHAPE");
        const joined = JSON.parse(readFileSync(resolve(process.cwd(), "examples/specs/arcgis-wastewater-join-map.json"), "utf8"));
        expect(joined.description).toContain("Bind the Power BI FacilityID field");
        expect(joined.components[0].layers[0].tooltip.fields.every((field: { fieldSource?: string }) => Boolean(field.fieldSource))).toBe(true);
    });
    it("keeps the Power BI authoring surface focused while exposing dedicated map roles", () => {
        const capabilities = JSON.parse(readFileSync(resolve(process.cwd(), "capabilities.json"), "utf8"));
        const reportRenderer = readFileSync(resolve(process.cwd(), "src/render/HyperPbiRoot.tsx"), "utf8");
        const setupExperience = readFileSync(resolve(process.cwd(), "src/editor/SetupExperience.tsx"), "utf8");
        expect(capabilities.dataRoles).toEqual([
            { displayName: "Values", name: "values", kind: "GroupingOrMeasure" },
            { displayName: "Map Latitude", name: "mapLatitude", kind: "Grouping" },
            { displayName: "Map Longitude", name: "mapLongitude", kind: "Grouping" },
            { displayName: "Map Geometry", name: "mapGeometry", kind: "Grouping" },
            { displayName: "Map Address", name: "mapAddress", kind: "Grouping" },
        ]);
        expect(capabilities.dataViewMappings[0].table.rows.select.map((entry: { for: { in: string } }) => entry.for.in)).toEqual(capabilities.dataRoles.map((role: { name: string }) => role.name));
        expect(capabilities.advancedEditModeSupport).toBe(2);
        expect(reportRenderer).not.toContain("Design with AI");
        expect(setupExperience).toContain("Select Edit");
        expect(capabilities.objects.hyperpbiState.properties.studioLayout).toBeDefined();
        expect(capabilities.supportsLandingPage).toBe(true);
        expect(capabilities.supportsEmptyDataView).toBe(true);
        expect(capabilities.supportsMultiVisualSelection).toBe(true);
    });
});
