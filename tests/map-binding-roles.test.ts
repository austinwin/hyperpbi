import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import type { NormalizedField } from "../src/data/normalizeData";
import { resolveMapBindings } from "../src/maps/mapBindingResolver";

const field = (key: string, displayName: string, type: NormalizedField["type"], roles: string[] = []): NormalizedField => ({ key, displayName, type, roles, dataType: type === "latitude" || type === "longitude" ? "number" : "text" });

describe("dedicated map data roles", () => {
    it("prioritizes explicit configuration, then dedicated role, semantic type, and conservative name", () => {
        const fields = {
            semanticLatitude: field("semanticLatitude", "Latitude", "latitude", ["values"]),
            dedicatedLatitude: field("dedicatedLatitude", "Y coordinate", "measure", ["mapLatitude"]),
            longitudeByName: field("longitudeByName", "Longitude", "dimension", ["values"]),
            explicitLongitude: field("explicitLongitude", "Configured longitude", "measure", ["values"]),
        };
        expect(resolveMapBindings(fields)).toMatchObject({ latitude: "dedicatedLatitude", longitude: "longitudeByName" });
        expect(resolveMapBindings(fields, { longitude: "explicitLongitude" })).toMatchObject({ latitude: "dedicatedLatitude", longitude: "explicitLongitude" });
    });

    it("exposes Grouping coordinate roles in the shared Core and Maps capability source", async () => {
        const capabilities = JSON.parse(await readFile(resolve(process.cwd(), "capabilities.json"), "utf8"));
        const roles = Object.fromEntries(capabilities.dataRoles.map((role: { name: string; kind: string }) => [role.name, role.kind]));
        expect(roles).toMatchObject({ mapLatitude: "Grouping", mapLongitude: "Grouping", mapGeometry: "Grouping", mapAddress: "Grouping" });
        const selected = capabilities.dataViewMappings[0].table.rows.select.map((item: { for: { in: string } }) => item.for.in);
        expect(selected).toEqual(expect.arrayContaining(["values", "mapLatitude", "mapLongitude", "mapGeometry", "mapAddress"]));
    });
});
