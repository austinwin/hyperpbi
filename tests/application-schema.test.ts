import { describe, expect, it } from "vitest";
import { getComponentDescriptor } from "../src/catalog/componentDescriptors";
import { validateV2Schema } from "../src/schema/validateV2Schema";

const validSpecification = () => ({
    version: "2.0",
    data: { datasets: {
        regions: { source: "powerbi", groupBy: ["region"], metrics: { total: { field: "amount", op: "sum" } } },
        sites: { source: "powerbi", select: ["region", "site", "amount"] },
    } },
    components: [{
        type: "split", id: "workspace", resizable: true, persist: "local", sizes: [40, 60], minSizes: [20, 25], maxSizes: [75, 80],
        responsive: { xs: { stack: true }, md: { stack: false } },
        children: [
            { type: "barChart", id: "trend", heightMode: "fill", category: "region", measure: "amount", events: { zoom: { enabled: true }, brush: { enabled: true, targets: ["details"], interaction: { internalMode: "filter", internalScope: "others" } } }, drill: { initialLevel: "regions", levels: [{ id: "regions", dataset: "regions", category: "region", measure: "total" }, { id: "sites", dataset: "sites", category: "site", measure: "amount", parentField: "region" }] } },
            { type: "table", id: "details", heightMode: "fill", columns: ["site", "amount"], pagination: false, export: { enabled: true, formats: ["csv", "xlsx"], scope: "selectedOrFiltered" }, virtualization: { enabled: true, threshold: 100, rowHeight: 30, overscan: 12 } },
        ],
    }, {
        type: "map", id: "map", tools: { rectangleSelection: { enabled: true, selectionMode: "replace" }, lassoSelection: { enabled: true, selectionMode: "add", minimumPoints: 4 } }, toolbar: { rectangleSelection: true, lassoSelection: true }, layers: [],
    }],
});

describe("application dashboard schema", () => {
    it("accepts the reusable responsive, split, chart, table, and map contracts", () => {
        const result = validateV2Schema(validSpecification());
        expect(result.valid).toBe(true);
        expect(result.diagnostics.filter(diagnostic => diagnostic.severity === "error")).toEqual([]);
    });

    it("rejects infeasible sizing, bad virtual rows, missing drill data, and broken linked targets", () => {
        const input = validSpecification() as any;
        input.components[0].responsive.md.span = 3.5;
        input.components[0].minSizes = [80, 30];
        input.components[0].children[0].events.brush.targets = ["missing"];
        input.components[0].children[0].drill.levels[1].dataset = "missingDataset";
        input.components[0].children[1].virtualization.rowHeight = 10;
        input.components[0].children[1].virtualization.threshold = 5001;
        input.components[1].tools.lassoSelection.minimumPoints = 2;
        const result = validateV2Schema(input);
        expect(result.valid).toBe(false);
        expect(result.diagnostics).toEqual(expect.arrayContaining([
            expect.objectContaining({ path: "/components/0/responsive/md/span" }),
            expect.objectContaining({ path: "/components/0/minSizes" }),
            expect.objectContaining({ code: "UNKNOWN_COMPONENT_TARGET", received: "missing" }),
            expect.objectContaining({ code: "UNKNOWN_DATASET", received: "missingDataset" }),
            expect.objectContaining({ path: "/components/0/children/1/virtualization/rowHeight" }),
            expect.objectContaining({ path: "/components/0/children/1/virtualization/threshold" }),
            expect.objectContaining({ path: "/components/1/tools/lassoSelection/minimumPoints" }),
        ]));
    });

    it("exposes every new contract through Inspector descriptors", () => {
        expect(getComponentDescriptor("split")?.inspector.map(item => item.property)).toEqual(expect.arrayContaining(["responsive", "heightMode", "sizes", "resizable", "persist"]));
        expect(getComponentDescriptor("table")?.inspector.map(item => item.property)).toEqual(expect.arrayContaining(["export", "virtualization"]));
        expect(getComponentDescriptor("barChart")?.inspector.map(item => item.property)).toEqual(expect.arrayContaining(["events", "drill"]));
        expect(getComponentDescriptor("map")?.inspector.map(item => item.property)).toContain("tools");
    });
});
