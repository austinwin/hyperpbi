import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import type { MapComponent } from "../src/schema/hyperpbiSchema";
import type { MapJoinDefinition } from "../src/schema/mapSchema";
import { validateSchema } from "../src/schema/validateSchema";
import { prepareSpecification } from "../src/schema/prepareSpecification";
import { executeMapJoin } from "../src/maps/join/mapJoinEngine";
import { parseGeometry } from "../src/maps/geometryParser";
import type { ParsedArcGisFeature } from "../src/maps/arcgis/arcGisResponseParser";
import {
  createDemoData,
  parseDemoCsv,
  type DemoCsvSource,
} from "./helpers/mapDemoCsv";

interface DemoDataExpectation {
  file: string;
  keyField: string;
  columns: string[];
  rows: number;
  serviceFixture?: boolean;
}

interface DemoExpectation {
  spec: string;
  data: DemoDataExpectation[];
}

const demos: DemoExpectation[] = [
  {
    spec: "map-feature-showcase.json",
    data: [{
      file: "map-feature-showcase.csv",
      keyField: "asset_id",
      columns: ["asset_id", "asset_type", "status", "latitude", "longitude"],
      rows: 10,
    }],
  },
  {
    spec: "map-multiple-geometries.json",
    data: [
      {
        file: "map-multiple-geometries-facilities.csv",
        keyField: "facility_id",
        columns: ["facility_id", "facility_type", "status", "latitude", "longitude"],
        rows: 5,
      },
      {
        file: "map-multiple-geometries-segments.csv",
        keyField: "segment_id",
        columns: ["segment_id", "condition", "length_ft", "geometry"],
        rows: 4,
      },
      {
        file: "map-multiple-geometries-areas.csv",
        keyField: "area_id",
        columns: ["area_id", "priority", "geometry"],
        rows: 2,
      },
    ],
  },
  {
    spec: "map-selection-details.json",
    data: [{
      file: "map-selection-details.csv",
      keyField: "site_id",
      columns: ["site_id", "category", "severity", "latitude", "longitude"],
      rows: 8,
    }],
  },
  {
    spec: "arcgis-map-join-showcase.json",
    data: [
      {
        file: "arcgis-map-join-showcase.csv",
        keyField: "facility_id",
        columns: ["facility_id", "status", "work_count", "priority"],
        rows: 8,
      },
      {
        file: "arcgis-map-join-service-fixture.csv",
        keyField: "facilityid",
        columns: ["OBJECTID", "facilityid", "geometry"],
        rows: 8,
        serviceFixture: true,
      },
    ],
  },
  {
    spec: "arcgis-dynamic-identify-showcase.json",
    data: [],
  },
];

const specPath = (file: string) => resolve("examples/specs", file);
const dataPath = (file: string) => resolve("examples/data", file);
const loadSpec = (file: string) =>
  JSON.parse(readFileSync(specPath(file), "utf8")) as {
    components: MapComponent[];
  };

describe("map demo examples", () => {
  it.each(demos)("keeps $spec schema-valid with its CSV field manifest", (demo) => {
    const specification = loadSpec(demo.spec);
    const sources: DemoCsvSource[] = demo.data
      .filter((item) => !item.serviceFixture)
      .map((item) => ({
        text: readFileSync(dataPath(item.file), "utf8"),
        keyField: item.keyField,
      }));
    const data = createDemoData(sources);
    expect(validateSchema(specification).errors, demo.spec).toEqual([]);
    expect(prepareSpecification(specification, data).errors, demo.spec).toEqual([]);
  });

  it("keeps every demo dataset at five columns or fewer with the documented shape", () => {
    for (const demo of demos) {
      for (const expectation of demo.data) {
        const parsed = parseDemoCsv(readFileSync(dataPath(expectation.file), "utf8"));
        expect(parsed.headers, expectation.file).toEqual(expectation.columns);
        expect(parsed.headers.length, expectation.file).toBeLessThanOrEqual(5);
        expect(parsed.rows, expectation.file).toHaveLength(expectation.rows);
      }
    }
  });

  it("declares the stable details and selection contract on every interactive demo", () => {
    for (const demo of demos) {
      const component = loadSpec(demo.spec).components[0];
      if (component.layers?.every((layer) => layer.source.type === "arcgisDynamic")) {
        expect(component.featureDetails).toEqual({
          mode: "auto",
          clearSelectionOnBackgroundClick: false,
          clearSelectionOnClose: false,
        });
        expect(component.layers[0].source).toMatchObject({
          type: "arcgisDynamic",
          identify: { enabled: true },
        });
        expect(component.layers[0].interaction).toBeUndefined();
        continue;
      }
      expect(component.featureDetails, demo.spec).toEqual({
        mode: "auto",
        clearSelectionOnBackgroundClick: true,
        clearSelectionOnClose: false,
      });
      for (const layer of component.layers ?? []) {
        expect(layer.interaction, `${demo.spec}:${layer.id}`).toMatchObject({
          enabled: true,
          trigger: "click",
          externalMode: "selection",
          multiSelect: true,
          clearOnSecondClick: false,
        });
      }
    }
  });

  it("keeps duplicate raw A-01 identities in separate geometry layers", () => {
    const point = parseDemoCsv(
      readFileSync(dataPath("map-multiple-geometries-facilities.csv"), "utf8"),
    );
    const line = parseDemoCsv(
      readFileSync(dataPath("map-multiple-geometries-segments.csv"), "utf8"),
    );
    expect(point.rows.some((row) => row.facility_id === "A-01")).toBe(true);
    expect(line.rows.some((row) => row.segment_id === "A-01")).toBe(true);
  });

  it("joins the deterministic ArcGIS fixture at a complete, unambiguous match rate", () => {
    const specification = loadSpec("arcgis-map-join-showcase.json");
    const component = specification.components[0];
    const definition = component.layers?.[0];
    expect(definition?.join).toBeDefined();
    const powerBi = parseDemoCsv(
      readFileSync(dataPath("arcgis-map-join-showcase.csv"), "utf8"),
    );
    const service = parseDemoCsv(
      readFileSync(dataPath("arcgis-map-join-service-fixture.csv"), "utf8"),
    );
    const serviceFeatures: ParsedArcGisFeature[] = service.rows.map((row) => ({
      objectId: row.OBJECTID as number,
      attributes: { OBJECTID: row.OBJECTID, facilityid: row.facilityid },
      geometry: parseGeometry(row.geometry)?.geometry ?? null,
    }));
    const result = executeMapJoin({
      powerBiRows: powerBi.rows,
      powerBiRowIndices: powerBi.rows.map((_row, index) => index),
      powerBiRowKeys: powerBi.rows.map((row) => String(row.facility_id)),
      serviceFeatures,
      definition: definition!.join as MapJoinDefinition,
      layerId: definition!.id,
    });
    expect(result.features).toHaveLength(8);
    expect(result.diagnostics).toMatchObject({
      matchRate: 1,
      unmatchedPowerBiKeyCount: 0,
      duplicatePowerBiKeyCount: 0,
      duplicateServiceKeyCount: 0,
      cardinalityValid: true,
    });
  });
});
