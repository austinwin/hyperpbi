import { describe, expect, it } from "vitest";
import { componentDescriptors } from "../src/catalog/componentDescriptors";
import { composedComponentFieldHandlers, registeredComponentFieldHandlers } from "../src/fields/componentFieldHandlers";
import { specificationFieldReferences } from "../src/fields/specificationFieldReferences";

describe("descriptor component field handlers", () => {
    it("registers every declared handler and justifies composed handlers", () => {
        const declared = new Set(componentDescriptors.flatMap(descriptor => descriptor.fields.map(field => field.handler)));
        for (const handler of declared) expect(registeredComponentFieldHandlers).toContain(handler);
        const used = new Set([...declared, ...composedComponentFieldHandlers]);
        expect(registeredComponentFieldHandlers.filter(handler => !used.has(handler))).toEqual([]);
    });

    it("emits occurrences from descriptor metadata, including inherited datasets and nested charts", () => {
        const specification = { version: "2.0", data: { datasets: { regional: { source: "powerbi", select: ["region", "amount"] } } }, components: [
            { type: "smallMultiples", id: "multiples", dataset: "regional", splitField: "region", chart: { type: "barChart", id: "nested", category: "region", measure: "amount", aggregation: "sum" } },
            { type: "custom", id: "custom", dataset: "regional", html: "{{region}} {{state.mode}}", interactions: { onClick: { action: "selectWhere", where: { left: { field: "region" }, right: { valueFromRow: "region" } } } } },
        ] };
        const occurrences = specificationFieldReferences(specification);
        expect(occurrences).toEqual(expect.arrayContaining([
            expect.objectContaining({ path: "/components/0/splitField", datasetName: "regional" }),
            expect.objectContaining({ path: "/components/0/chart/category", datasetName: "regional" }),
            expect.objectContaining({ path: "/components/0/chart/measure", requirement: "numeric" }),
            expect.objectContaining({ path: "/components/1/html#0" }),
            expect.objectContaining({ path: "/components/1/interactions/onClick/where/left/field" }),
            expect.objectContaining({ path: "/components/1/interactions/onClick/where/right/valueFromRow" }),
        ]));
        expect(occurrences.some(item => item.reference === "state.mode")).toBe(false);
    });

    it("uses aggregation semantics in the matrix handler", () => {
        const specification = { version: "2.0", components: [{ type: "matrix", id: "matrix", rows: ["region"], columns: ["month"], values: [
            { field: "recordId", aggregation: "count" },
            { field: "recordId", aggregation: "distinctCount" },
            { field: "amount", aggregation: "sum" },
        ] }] };
        const values = specificationFieldReferences(specification).filter(item => item.path.includes("/values/"));
        expect(values.map(item => item.requirement)).toEqual(["any", "any", "numeric"]);
        expect(specificationFieldReferences(specification)).toContainEqual(expect.objectContaining({ path: "/components/0/columns/0", reference: "month" }));
    });

    it("preserves authored map namespaces for visibility and interactions", () => {
        const specification = { version: "2.0", components: [{ type: "map", id: "map", layers: [{
            id: "joined", name: "Joined", source: { type: "arcgisFeature", url: "https://services.example/FeatureServer" },
            join: { powerBiField: "facilityId", serviceField: "FACILITY_ID" },
            renderer: { type: "uniqueValue", field: "SERVICE_STATUS", fieldSource: "service" },
            visibility: { conditionField: "SERVICE_STATUS", conditionFieldSource: "service" },
            interaction: { field: "FACILITY_ID", fieldSource: "service" },
        }] }] };
        const occurrences = specificationFieldReferences(specification);
        expect(occurrences).toEqual(expect.arrayContaining([
            expect.objectContaining({ path: "/components/0/layers/0/join/powerBiField", reference: "facilityId", source: "powerbi" }),
            expect.objectContaining({ path: "/components/0/layers/0/renderer/field", reference: "SERVICE_STATUS", source: "service" }),
            expect.objectContaining({ path: "/components/0/layers/0/visibility/conditionField", reference: "SERVICE_STATUS", source: "service" }),
            expect.objectContaining({ path: "/components/0/layers/0/interaction/field", reference: "FACILITY_ID", source: "service" }),
        ]));
        expect(occurrences.some(item => item.reference === "FACILITY_ID" || item.reference === "SERVICE_STATUS")).toBe(true);
    });
});
