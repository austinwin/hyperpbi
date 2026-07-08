import { describe, expect, it } from "vitest";
import { calculateAggregates } from "../src/data/aggregations";
import { filterRows } from "../src/data/filtering";
import { NormalizedData } from "../src/data/normalizeData";
import { renderTemplate } from "../src/render/renderTemplate";
import { normalizeMapBindings } from "../src/data/normalizeMapBindings";

const rows = [{ region: "North", cost: 100 }, { region: "South", cost: 300 }, { region: "North", cost: 200 }];

describe("normalized data operations", () => {
    it("aggregates once into reusable dictionaries", () => {
        const aggregates = calculateAggregates(rows);
        expect(aggregates.count).toBe(3); expect(aggregates.sum.cost).toBe(600); expect(aggregates.avg.cost).toBe(200); expect(aggregates.distinctCount.region).toBe(2);
    });
    it("combines filters and global search", () => {
        expect(filterRows(rows, [{ id: "min", field: "cost", operator: ">=", value: 200 }], "north")).toEqual([{ region: "North", cost: 200 }]);
    });
    it("only expands supported template tokens", () => {
        const fields: NormalizedData["fields"] = { cost: { key: "cost", displayName: "Cost", type: "measure", roles: ["measure"] } };
        const data: NormalizedData = { fields, rows, rowKeys: rows.map((_, i) => `row-${i}`), aggregates: calculateAggregates(rows), map: normalizeMapBindings(rows, fields, undefined, undefined, rows.map((_, i) => `row-${i}`)) };
        expect(renderTemplate("{{title}} {{count}} {{sum.cost}} {{field.cost.displayName}} {{constructor.constructor}}", data, {}, "Ops")).toBe("Ops 3 600 Cost ");
    });
});
