import { describe, expect, it } from "vitest";
import { attributeSourceAvailable, defaultAttributeSource, featureAttribute } from "../src/maps/attributes/mapFeatureAttributes";
import type { ResolvedMapFeature } from "../src/maps/model/resolvedMapTypes";
import type { MapLayerDefinition } from "../src/schema/mapSchema";

const feature: ResolvedMapFeature = { id: "one", layerId: "layer", geometryType: "point", geometry: null, lat: 1, lon: 2, powerBiAttributes: { status: "powerbi" }, serviceAttributes: { status: "service" }, joinedAttributes: { status: "joined" }, powerBiRowIndices: [0], powerBiRowKeys: ["a"], selected: false };

describe("map attribute namespaces", () => {
    it("never falls through when names collide", () => {
        expect(featureAttribute(feature, "status", "powerbi")).toBe("powerbi");
        expect(featureAttribute(feature, "status", "service")).toBe("service");
        expect(featureAttribute(feature, "status", "joined")).toBe("joined");
        expect(featureAttribute(feature, "missing", "joined")).toBeUndefined();
    });
    it("uses deterministic defaults and rejects impossible reference sources", () => {
        const powerbi = { id: "p", name: "P", source: { type: "powerbi", bindings: {} } } as MapLayerDefinition;
        const reference = { id: "r", name: "R", source: { type: "arcgisFeature", url: "https://services.arcgis.com/x/FeatureServer/0", mode: "reference" } } as MapLayerDefinition;
        const joined = { ...reference, source: { ...reference.source, mode: "join" } } as MapLayerDefinition;
        expect(defaultAttributeSource(powerbi, "filter")).toBe("powerbi");
        expect(defaultAttributeSource(reference, "visibility")).toBe("service");
        expect(defaultAttributeSource(joined, "renderer")).toBe("joined");
        expect(attributeSourceAvailable(reference, "powerbi")).toBe(false);
        expect(attributeSourceAvailable(joined, "powerbi")).toBe(true);
    });
});
