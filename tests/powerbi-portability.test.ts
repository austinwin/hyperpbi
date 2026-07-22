import { describe, expect, it } from "vitest";
import { defaultConfig } from "../src/config/hyperpbiConfig";
import { parseCsvText } from "../src/data/fileImport";
import type { HyperPbiSchema } from "../src/schema/hyperpbiSchema";
import { analyzePowerBiPortability, rewriteDefaultSourceForPowerBi } from "../src/playground/powerBiPortability";

describe("Power BI portability", () => {
    const orders = parseCsvText("Status,Amount\nOpen,10", "orders.csv");
    const targets = parseCsvText("Region,Target\nNorth,100", "targets.csv");
    const workspace = { defaultSourceId: orders.id, sources: { [orders.id]: orders, [targets.id]: targets } };

    it("rewrites only the selected default uploaded source", () => {
        const specification: HyperPbiSchema = { version: "2.0", data: { datasets: { open: { source: orders.id, filter: { field: "status", operator: "=", value: "Open" } } } }, components: [{ type: "table", id: "rows", dataset: "open", columns: ["status"] }] };
        const result = analyzePowerBiPortability(specification, defaultConfig, workspace);
        expect(result.status).toBe("compatible-after-default-source-rewrite");
        expect(result.powerBiSpecification?.data?.datasets?.open.source).toBe("powerbi");
        expect(rewriteDefaultSourceForPowerBi(specification, orders.id).data?.datasets?.open.source).toBe("powerbi");
    });

    it("does not claim compatibility for an independent source", () => {
        const specification: HyperPbiSchema = { version: "2.0", data: { datasets: { targets: { source: targets.id } } }, components: [{ type: "table", id: "targets", dataset: "targets", columns: ["region", "target"] }] };
        const result = analyzePowerBiPortability(specification, defaultConfig, workspace);
        expect(result.status).toBe("not-fully-portable");
        expect(result.issues.map(issue => issue.code)).toContain("INDEPENDENT_UPLOADED_SOURCE");
        expect(result.powerBiSpecification).toBeUndefined();
    });

    it("reports invalid field bindings as actionable blockers", () => {
        const specification: HyperPbiSchema = { version: "2.0", components: [{ type: "table", id: "bad", columns: ["missing"] }] };
        const result = analyzePowerBiPortability(specification, defaultConfig, workspace);
        expect(result.status).toBe("not-fully-portable");
        expect(result.issues.some(issue => issue.code === "INVALID_FIELD_BINDING")).toBe(true);
    });
});
