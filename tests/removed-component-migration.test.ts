import { expect, it } from "vitest";
import { validateSchema } from "../src/schema/validateSchema";

it("explains migration for the removed GIS workspace without claiming project conversion", () => {
    const result = validateSchema({ version: "2.0", components: [{ type: "geolibre", id: "legacy" }] });
    expect(JSON.stringify(result)).toContain("Export supported layers to GeoJSON or ArcGIS REST");
    expect(JSON.stringify(result)).toContain("Native project conversion is not supported");
});
