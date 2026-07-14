import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { mapCapabilityByPath, mapCapabilityRegistry } from "../src/maps/mapCapabilityRegistry";
import { acceptedMapSchemaPaths } from "../src/schema/mapSchemaValidation";
import { validateV2Schema } from "../src/schema/validateV2Schema";

const specification = (layer: Record<string, unknown>) => ({ version: "2.0", components: [{ type: "map", id: "map", layers: [{ id: "layer", name: "Layer", source: { type: "powerbi", bindings: { latitude: "lat", longitude: "lon" } }, ...layer }] }] });

describe("map schema/runtime capability parity", () => {
    it("registers every accepted capability once with concrete ownership and test evidence", () => {
        expect(new Set(mapCapabilityRegistry.map(entry => entry.schemaPath)).size).toBe(mapCapabilityRegistry.length);
        expect(acceptedMapSchemaPaths).toEqual(new Set(mapCapabilityRegistry.filter(entry => entry.status !== "unsupported").map(entry => entry.schemaPath)));
        for (const entry of mapCapabilityRegistry) {
            expect(entry.runtimeModule).not.toBe("");
            expect(entry.validationModule).not.toBe("");
            expect(entry.studioSupport).not.toBe("");
            expect(entry.documentationSection).toContain("schema-runtime-capability-status");
            expect(existsSync(resolve(process.cwd(), entry.focusedTestFile))).toBe(true);
            if (["partial", "experimental", "deprecated"].includes(entry.status)) expect(entry.limitation).toBeTruthy();
        }
        for (const required of ["map.layers[].dataset", "map.layers[].source.powerbi.bindings.latitude", "map.layers[].renderer.classBreaks.breaks[].symbol", "map.layers[].labels.backgroundColor", "map.layers[].popup.actions[].uiAction", "map.layers[].filter[].field", "map.bookmarks[].center"]) expect(mapCapabilityByPath.has(required)).toBe(true);
    });

    it("rejects unknown nested properties and unsupported natural breaks", () => {
        const unknown = validateV2Schema(specification({ popup: { enabled: true, fields: [{ field: "name", executable: true }] } }));
        expect(unknown.diagnostics).toContainEqual(expect.objectContaining({ code: "UNKNOWN_PROPERTY", path: "/components/0/layers/0/popup/fields/0/executable" }));
        const unsupported = validateV2Schema(specification({ renderer: { type: "classBreaks", field: "value", method: "naturalBreaks" } }));
        expect(unsupported.valid).toBe(false);
        expect(unsupported.diagnostics).toContainEqual(expect.objectContaining({ code: "INVALID_ENUM_VALUE", path: "/components/0/layers/0/renderer/method" }));
    });

    it("emits limitations for partial and experimental input and documents the same statuses", () => {
        const result = validateV2Schema({ version: "2.0", components: [{ type: "map", id: "map", view: { preserveView: true, fitMode: "firstLayer" }, layers: [] }] });
        expect(result.valid).toBe(true);
        expect(result.diagnostics.filter(item => item.code === "MAP_CAPABILITY_LIMITATION")).toHaveLength(2);
        const docs = readFileSync(resolve(process.cwd(), "docs/map-services.md"), "utf8");
        for (const status of ["Implemented", "Partial", "Experimental", "Rejected"]) expect(docs).toContain(`| ${status} |`);
        expect(docs).toContain("basic `hideOverlaps`");
    });
});
