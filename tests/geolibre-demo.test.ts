import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseCsvText } from "../src/data/fileImport";
import { validateReferences } from "../src/schema/validateReferences";
import { validateV2Schema } from "../src/schema/validateV2Schema";

const demoDirectory = resolve("examples/geolibre-austin-demo");

describe("GeoLibre Austin demo", () => {
  it("uses one portable Field Manifest across CSV, Playground, and Power BI", () => {
    const source = parseCsvText(
      readFileSync(resolve(demoDirectory, "data.csv"), "utf8"),
      "data.csv",
    );
    const specification = JSON.parse(
      readFileSync(resolve(demoDirectory, "specification.json"), "utf8"),
    );
    const result = validateV2Schema(specification);

    expect(result.diagnostics.filter((item) => item.severity === "error")).toEqual([]);
    expect(result.schema).toBeDefined();
    expect(source.data.rows).toHaveLength(16);
    expect(source.data.fields.latitude?.dataType).toBe("number");
    expect(source.data.fields.longitude?.dataType).toBe("number");
    expect(Object.keys(source.data.fields)).toEqual([
      "siteid",
      "sitename",
      "latitude",
      "longitude",
      "status",
      "facilitytype",
      "district",
      "openworkorders",
      "inspectionscore",
      "lastinspection",
    ]);
    expect(validateReferences(result.schema!, source.data)).toEqual([]);
  });
});
