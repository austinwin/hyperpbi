import { describe, expect, it } from "vitest";
import type powerbi from "powerbi-visuals-api";
import { defaultConfig, defaultConfigJson, parseConfig, resolveConfiguredField } from "../src/config/hyperpbiConfig";
import { readVisualState } from "../src/powerbi/visualState";
import { toRuntimeSettings, VisualFormattingSettingsModel } from "../src/settings";

describe("studio configuration and persistence", () => {
    it("parses the default editor configuration", () => {
        const result = parseConfig(defaultConfigJson);
        expect(result.errors).toEqual([]); expect(result.config?.interactions?.crossFilter).toBe(true);expect(defaultConfig.renderer).toEqual({showHeader:false,showRowCount:false,showStudioButton:true});expect(result.config?.security).toMatchObject({cssMode:"scoped",htmlMode:"sanitized",showSanitizerWarnings:false});
    });
    it("resolves canonical keys without accepting Power BI display names", () => {
        const fields = { asset_id: { key: "asset_id", displayName: "Asset ID", type: "dimension" as const, roles: ["values"] } };
        expect(resolveConfiguredField(fields, "asset_id")).toBe("asset_id"); expect(resolveConfiguredField(fields, "Asset ID")).toBeUndefined();
    });
    it("reads the persisted specification from visual properties", () => {
        const dataView = { metadata: { columns: [], objects: { hyperpbiState: { specification: "{\"version\":\"2.0\",\"components\":[]}", configuration: defaultConfigJson } } } } as unknown as powerbi.DataView;
        expect(readVisualState(dataView).specification).toContain("version");
    });
    it("does not clamp the configured table display setting to 10,000",()=>{const model=new VisualFormattingSettingsModel();model.dataLimit.maxRows.value=25000;expect(toRuntimeSettings(model).table.maxRows).toBe(25000);});
});
