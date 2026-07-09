import { describe, expect, it } from "vitest";
import { buildHyperPbiSkill } from "../src/ai/buildHyperPbiSkill";
import { calculateAggregates } from "../src/data/aggregations";
import { normalizeMapBindings } from "../src/data/normalizeMapBindings";
import { NormalizedData } from "../src/data/normalizeData";

describe("copyable AI skill", () => {
    it("includes the engine contract, global styling, security rules, and current fields", () => {
        const fields = { lead_by: { key: "lead_by", displayName: "LeadBy", type: "dimension" as const, roles: ["values"] } }; const rows = [{ lead_by: "Christian" }];
        const data: NormalizedData = { fields, rows, rowKeys: rows.map((_, i) => `row-${i}`), aggregates: calculateAggregates(rows), map: normalizeMapBindings(rows, fields, undefined, undefined, rows.map((_, i) => `row-${i}`)) };
        const skill = buildHyperPbiSkill(data);
        expect(skill).toContain("styles.globalCss"); expect(skill).toContain("lead_by"); expect(skill).toContain("No markdown fences");
    });
});
