import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Power BI capability contract", () => {
    const capabilities = JSON.parse(readFileSync(resolve(process.cwd(), "capabilities.json"), "utf8"));

    it("exposes exactly one flexible Values role", () => {
        expect(capabilities.dataRoles).toEqual([{ displayName: "Values", name: "values", kind: "GroupingOrMeasure" }]);
        expect(capabilities.dataViewMappings[0].table.rows.select).toEqual([{ for: { in: "values" } }]);
        expect(capabilities.dataViewMappings[0].conditions).toEqual([{ values: { max: 50 } }]);
    });

    it("contains no fixed map role contract", () => {
        expect(JSON.stringify(capabilities)).not.toMatch(/mapLatitude|mapLongitude|mapGeometry|mapAddress/);
    });
});
