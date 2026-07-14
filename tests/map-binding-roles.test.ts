import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import type { NormalizedField } from "../src/data/normalizeData";
import { resolveMapBindings } from "../src/maps/mapBindingResolver";

const field = (key: string, displayName: string, type: NormalizedField["type"], roles: string[] = []): NormalizedField => ({ key, displayName, type, roles, dataType: type === "latitude" || type === "longitude" ? "number" : "text" });

describe("Values-only map binding discovery", () => {
    it("prioritizes explicit configuration, then semantic type, and conservative exact names", () => {
        const fields = {
            semanticLatitude: field("semanticLatitude", "Latitude", "latitude", ["values"]),
            dedicatedLatitude: field("dedicatedLatitude", "Y coordinate", "measure", ["mapLatitude"]),
            longitudeByName: field("longitudeByName", "Longitude", "dimension", ["values"]),
            explicitLongitude: field("explicitLongitude", "Configured longitude", "measure", ["values"]),
        };
        expect(resolveMapBindings(fields)).toMatchObject({ latitude: "semanticLatitude", longitude: "longitudeByName" });
        expect(resolveMapBindings(fields, { longitude: "explicitLongitude" })).toMatchObject({ latitude: "semanticLatitude", longitude: "explicitLongitude" });
        expect(resolveMapBindings(fields, { latitude: "missing" })).toMatchObject({ latitude: undefined });
    });

    it("exposes only the shared Values role and maps every table row through it", async () => {
        const capabilities = JSON.parse(await readFile(resolve(process.cwd(), "capabilities.json"), "utf8"));
        expect(capabilities.dataRoles).toEqual([{ displayName: "Values", name: "values", kind: "GroupingOrMeasure" }]);
        const selected = capabilities.dataViewMappings[0].table.rows.select.map((item: { for: { in: string } }) => item.for.in);
        expect(selected).toEqual(["values"]);
        expect(JSON.stringify(capabilities)).not.toMatch(/mapLatitude|mapLongitude|mapGeometry|mapAddress/);
    });
});
