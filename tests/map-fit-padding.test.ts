import { describe, expect, it } from "vitest";
import { DEFAULT_MAP_FIT_PADDING, normalizeFitPadding, validFitPadding } from "../src/maps/view/mapFitPadding";
import { validateMapComponentSchema } from "../src/schema/mapSchemaValidation";

describe("map fit padding ratio", () => {
    it("defaults to 0.08 and defensively bounds runtime input", () => {
        expect(DEFAULT_MAP_FIT_PADDING).toBe(0.08);
        expect(normalizeFitPadding(undefined)).toBe(0.08);
        expect(normalizeFitPadding(0)).toBe(0);
        expect(normalizeFitPadding(0.1)).toBe(0.1);
        expect(normalizeFitPadding(24)).toBe(0.5);
        expect(normalizeFitPadding(Number.NaN)).toBe(0.08);
    });

    it.each([-0.01, 1, 24])("rejects unsafe authored ratio %s", value => {
        expect(validFitPadding(value)).toBe(false);
        const diagnostics = validateMapComponentSchema({ type: "map", view: { fitPadding: value } }, "/components/0", "map");
        expect(diagnostics).toEqual(expect.arrayContaining([expect.objectContaining({ code: "MAP_FIT_PADDING_OUT_OF_RANGE" })]));
    });
});
