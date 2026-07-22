import { describe, expect, it } from "vitest";
import { parseCsvText } from "../src/data/fileImport";
import { defaultWorkspaceData, resolveDataSource, type DataWorkspace } from "../src/data/dataWorkspace";
import { evaluateDatasets } from "../src/data/datasets";

describe("DataWorkspace", () => {
    const orders = parseCsvText("Status,Amount\nOpen,10\nClosed,20", "orders.csv");
    const targets = parseCsvText("Region,Target\nNorth,100", "targets.csv");
    const workspace: DataWorkspace = {
        defaultSourceId: orders.id,
        sources: { [orders.id]: orders, [targets.id]: targets }
    };

    it("exposes the selected default source through powerbi while retaining named sources", () => {
        expect(resolveDataSource(workspace, "powerbi")?.id).toBe(orders.id);
        expect(resolveDataSource(workspace, targets.id)?.name).toBe("targets");
        expect(defaultWorkspaceData(workspace)).toBe(orders.data);
    });

    it("lets derived datasets use uploaded source ids", () => {
        const evaluation = evaluateDatasets(
            orders.data,
            { targetSummary: { source: targets.id, groupBy: ["region"], metrics: { total: { op: "sum", field: "target" } } } },
            new Map(),
            {},
            { [orders.id]: orders.data, [targets.id]: targets.data }
        );
        expect(evaluation.errors).toEqual([]);
        expect(evaluation.datasets.get("targetSummary")?.data.rows).toEqual([{ region: "North", total: 100 }]);
    });
});
