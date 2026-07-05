import { describe, expect, it } from "vitest";
import type powerbi from "powerbi-visuals-api";
import { defaultConfigJson, parseConfig, resolveConfiguredField } from "../src/config/hyperpbiConfig";
import { readVisualState } from "../src/powerbi/visualState";

describe("studio configuration and persistence", () => {
    it("parses the default editor configuration", () => {
        const result = parseConfig(defaultConfigJson);
        expect(result.errors).toEqual([]); expect(result.config?.interactions?.crossFilter).toBe(true);
    });
    it("resolves normalized keys and Power BI display names", () => {
        const fields = { asset_id: { key: "asset_id", displayName: "Asset ID", type: "dimension" as const, roles: ["values"] } };
        expect(resolveConfiguredField(fields, "asset_id")).toBe("asset_id"); expect(resolveConfiguredField(fields, "Asset ID")).toBe("asset_id");
    });
    it("reads the persisted specification from visual properties", () => {
        const dataView = { metadata: { columns: [], objects: { hyperpbiState: { specification: "{\"version\":\"1.0\"}", configuration: defaultConfigJson } } } } as unknown as powerbi.DataView;
        expect(readVisualState(dataView).specification).toContain("version");
    });
});
