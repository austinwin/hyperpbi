import { describe, expect, it } from "vitest";
import { calculateAggregates } from "../src/data/aggregations";
import type { NormalizedData } from "../src/data/normalizeData";
import { defaultConfig } from "../src/config/hyperpbiConfig";
import { prepareAuthoringData, prepareLogicalDatasets } from "../src/editor/prepareAuthoringData";

const rows = [{ amount: 2, status: "Closed" }, { amount: 6, status: "Open" }, { amount: 8, status: "Open" }];
const data: NormalizedData = { rows, rowKeys: ["a", "b", "c"], fields: {
    amount: { key: "amount", displayName: "Amount", type: "measure", dataType: "number", roles: ["values"] },
    status: { key: "status", displayName: "Status", type: "dimension", dataType: "text", roles: ["values"] },
}, aggregates: calculateAggregates(rows), map: { hasGeometry: false, hasLatLon: false, hasXY: false, hasAddress: false, mode: "none", bindings: { tooltip: [], details: [] }, layers: [], warnings: [], invalidFeatureCount: 0 } };
const specification = JSON.stringify({ version: "2.0", calculations: { fields: [{ key: "double_amount", type: "number", expression: { op: "*", args: [{ field: "amount" }, { value: 2 }] } }] }, data: { datasets: {
    large: { source: "powerbi", filter: { field: "double_amount", operator: ">", value: 10 } },
    grouped: { source: "large", groupBy: ["status"], metrics: { total: { op: "sum", field: "double_amount" } } },
} }, components: [{ type: "map", id: "map", layers: [{ id: "points", name: "Points", dataset: "large", source: { type: "powerbi", bindings: {} } }] }] });

describe("shared authoring/runtime data preparation", () => {
    it("shares calculations, aliases, logical rows, fields, and grouped lineage", () => {
        const config = JSON.stringify({ ...defaultConfig, fields: { aliases: { amount: "revenue" } } });
        const prepared = prepareAuthoringData(specification, config, data);
        expect(prepared.errors).toEqual([]); expect(prepared.aliases.amount).toBe("revenue");
        expect(prepared.datasets?.get("powerbi")?.data.fields.double_amount?.dataType).toBe("number");
        expect(prepared.datasets?.get("large")?.data.rows.map(row => row.double_amount)).toEqual([12, 16]);
        expect(prepared.datasets?.get("grouped")?.data.rows).toEqual([{ status: "Open", total: 28 }]);
        expect(prepared.datasets?.get("grouped")?.lineage).toEqual([[1, 2]]);
        const runtime = prepareLogicalDatasets(prepared.configuredData!, prepared.specification!);
        expect(runtime.datasets.get("large")?.data.rows).toEqual(prepared.datasets?.get("large")?.data.rows);
    });
});
