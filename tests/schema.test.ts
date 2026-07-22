import { describe, expect, it } from "vitest";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { calculateAggregates } from "../src/data/aggregations";
import { normalizeMapBindings } from "../src/data/normalizeMapBindings";
import type { NormalizedData } from "../src/data/normalizeData";
import { createDefaultSchema, defaultSchema } from "../src/schema/defaultSchema";
import { expandDefinitions } from "../src/schema/definitionExpansion";
import { expandPatterns } from "../src/schema/patternRegistry";
import { prepareSpecification } from "../src/schema/prepareSpecification";
import { validateSchema } from "../src/schema/validateSchema";

const rows = [{ category: "A", amount: 10, latitude: 29.7, longitude: -95.3 }];
const fields: NormalizedData["fields"] = {
  category: { key: "category", displayName: "Category", type: "dimension", dataType: "text", roles: ["values"] },
  amount: { key: "amount", displayName: "Amount", type: "measure", dataType: "number", roles: ["values"] },
  latitude: { key: "latitude", displayName: "Latitude", type: "latitude", dataType: "number", roles: ["values"] },
  longitude: { key: "longitude", displayName: "Longitude", type: "longitude", dataType: "number", roles: ["values"] },
};
const data: NormalizedData = {
  rows,
  rowKeys: ["row-0"],
  fields,
  aggregates: calculateAggregates(rows),
  map: normalizeMapBindings(rows, fields),
};

function dashboardFiles(directory: string): string[] {
  const results: string[] = [];
  for (const entry of readdirSync(directory)) {
    const candidate = resolve(directory, entry);
    if (statSync(candidate).isDirectory()) results.push(...dashboardFiles(candidate));
    else if (entry.endsWith(".json")) results.push(candidate);
  }
  return results;
}

describe("schema 2.0 validation", () => {
  it("accepts the bundled default", () => expect(validateSchema(defaultSchema).valid).toBe(true));

  it("generates a spatial default that passes full preparation without repairs", () => {
    const generated = createDefaultSchema(data);
    const prepared = prepareSpecification(generated, data, { repair: false });
    expect(generated.version).toBe("2.0");
    expect(prepared.errors).toEqual([]);
    expect(prepared.repairs).toEqual([]);
    expect(generated.components.map((component) => component.id)).toEqual(expect.arrayContaining(["record-summary", "overview-chart", "overview-map", "record-details"]));
  });

  it("rejects dashboard schema 1.0 in validation and production preparation", () => {
    const legacy = { version: "1.0", components: [{ type: "text", id: "legacy", text: "Old" }] };
    expect(validateSchema(legacy).errors.join(" ")).toContain("supports schema version “2.0” only");
    expect(prepareSpecification(legacy, data).errors.join(" ")).toContain("supports schema version “2.0” only");
  });

  it("rejects a missing version without inferring one", () => {
    const candidate = { components: [{ type: "text", id: "missing-version", text: "No version" }] };
    const prepared = prepareSpecification(candidate, data);
    expect(prepared.schema).toBeUndefined();
    expect(prepared.errors.join(" ")).toContain("Dashboard schema version is required");
    expect((prepared.authoring as Record<string, unknown>).version).toBeUndefined();
  });

  it("requires stable IDs and rejects unknown compatibility properties", () => {
    const missingId = validateSchema({ version: "2.0", components: [{ type: "text", text: "Missing" }] });
    expect(missingId.diagnostics).toContainEqual(expect.objectContaining({ code: "MISSING_REQUIRED_PROPERTY", path: "/components/0/id" }));
    for (const component of [
      { type: "drawer", id: "old-drawer" },
      { type: "stepper", id: "old-stepper" },
      { type: "button", id: "old-button", action: "clearFilters" },
      { type: "table", id: "old-table", selectable: true },
    ]) expect(validateSchema({ version: "2.0", components: [component] }).valid).toBe(false);
  });

  it("accepts canonical containers, interactions, maps, and design systems", () => {
    const result = validateSchema({
      version: "2.0",
      styles: { globalCss: ".hp-card { border-radius: 4px; }", components: { "*": { style: { minWidth: 0 } } } },
      components: [
        { type: "offcanvas", id: "details", children: [{ type: "detailPanel", id: "detail", selectedRow: true }] },
        { type: "table", id: "records", columns: ["category"], interaction: { enabled: true, internalMode: "highlight", externalMode: "selection", showSelector: true } },
        { type: "map", id: "locations", layers: [{ id: "points", name: "Points", source: { type: "powerbi", bindings: { latitude: "latitude", longitude: "longitude" } }, renderer: { type: "simple", symbol: { shape: "circle", fillColor: "#206bc4", size: 6 } } }] },
      ],
    });
    expect(result.errors).toEqual([]);
  });

  it("keeps every maintained dashboard example on valid schema 2.0", () => {
    for (const file of dashboardFiles(resolve(process.cwd(), "examples"))) {
      if (file.includes(`${resolve(process.cwd(), "examples", "config")}`) || file.endsWith("runtime_config.json") || file.endsWith("coverage.json")) continue;
      const value = JSON.parse(readFileSync(file, "utf8"));
      if (!Array.isArray(value.components)) continue;
      expect(value.version, file).toBe("2.0");
      const expanded = expandPatterns(expandDefinitions(value).value);
      expect(expanded.diagnostics, file).toEqual([]);
      expect(validateSchema(expanded.value).errors, file).toEqual([]);
    }
  });

  it("keeps practical ArcGIS examples internally consistent", () => {
    for (const file of ["arcgis-wastewater-live-map.json", "arcgis-wastewater-join-map.json"]) {
      const example = JSON.parse(readFileSync(resolve(process.cwd(), "examples/specs", file), "utf8"));
      const map = example.components[0];
      expect(map.view.center, file).toEqual([29.75, -95.35]);
      expect(map.layers[0].popup.title, file).toContain("{{FACILITYID}}");
      expect(map.toolbar.clearSelection, file).toBe(true);
      expect(map.layerPanel, file).toMatchObject({ visible: true, allowViewerReorder: true, allowViewerOpacity: true, allowViewerLabels: true });
    }
  });

  it("keeps the Power BI authoring surface focused on one Values role", () => {
    const capabilities = JSON.parse(readFileSync(resolve(process.cwd(), "capabilities.json"), "utf8"));
    const reportRenderer = readFileSync(resolve(process.cwd(), "src/render/HyperPbiRoot.tsx"), "utf8");
    const setupExperience = readFileSync(resolve(process.cwd(), "src/editor/SetupExperience.tsx"), "utf8");
    expect(capabilities.dataRoles).toEqual([{ displayName: "Values", name: "values", kind: "GroupingOrMeasure" }]);
    expect(capabilities.advancedEditModeSupport).toBe(2);
    expect(reportRenderer).not.toContain("Design with AI");
    expect(setupExperience).toContain("Select Edit");
  });
});
