import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { parseCsvText } from "../src/data/fileImport";
import { createGeoLibrePowerBiCompatMap } from "../src/components/geolibre/powerBiCompat";
import type { GeoLibreComponent } from "../src/components/geolibre/types";
import { powerBiLayerId } from "../src/components/geolibre/projectBridge";
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

    const geolibre = result.schema!.components.find(
      (component) => component.type === "geolibre",
    ) as GeoLibreComponent | undefined;
    expect(geolibre?.project).toBeDefined();
    const powerBiMap = createGeoLibrePowerBiCompatMap(
      geolibre!,
      geolibre!.project!.document,
    );
    expect(powerBiMap).toMatchObject({
      type: "map",
      engine: "leaflet",
      id: "austin_gis",
      dataset: "facilities",
      height: 640,
      view: { center: [30.2672, -97.7431], zoom: 10 },
      basemap: { type: "osm", visible: true },
    });
    expect(powerBiMap.layers?.[0]).toMatchObject({
      id: powerBiLayerId("facilities"),
      dataset: "facilities",
      source: {
        type: "powerbi",
        bindings: {
          latitude: "latitude",
          longitude: "longitude",
        },
      },
      renderer: {
        type: "simple",
        symbol: {
          fillColor: "#2563eb",
          outlineColor: "#ffffff",
          radius: 7,
        },
      },
    });
  });
});
