import { describe, expect, it } from "vitest";
import {
  appendJsonPointer,
  componentPathById,
  escapeJsonPointerToken,
} from "../src/schema/jsonPointer";
import { calculateAggregates } from "../src/data/aggregations";
import { normalizeMapBindings } from "../src/data/normalizeMapBindings";
import { prepareSpecification } from "../src/schema/prepareSpecification";

describe("canonical map diagnostic JSON pointers", () => {
  it("escapes pointer tokens", () => {
    expect(escapeJsonPointerToken("a/b~c")).toBe("a~1b~0c");
    expect(appendJsonPointer("/components/3", "layers", 10, "a/b~c")).toBe(
      "/components/3/layers/10/a~1b~0c",
    );
  });

  it("finds root and nested maps without embedding component IDs", () => {
    const paths = componentPathById({
      components: [
        { type: "map", id: "map/root" },
        {
          type: "tabs",
          id: "tabs",
          tabs: [
            { id: "one", content: [{ type: "map", id: "map~nested" }] },
          ],
        },
      ],
    });
    expect(paths["map/root"]).toBe("/components/0");
    expect(paths["map~nested"]).toBe("/components/1/tabs/0/content/0");
    expect(appendJsonPointer(paths["map~nested"], "layers", 1)).toBe(
      "/components/1/tabs/0/content/0/layers/1",
    );
  });

  it("keeps generated pattern components anchored to the saved owner pointer", () => {
    const data = {
      rows: [],
      rowKeys: [],
      fields: {},
      aggregates: calculateAggregates([]),
      map: normalizeMapBindings([], {}),
    };
    const prepared = prepareSpecification(
      {
        version: "2.0",
        components: [
          { type: "pattern", pattern: "map-and-details", id: "locations" },
        ],
      },
      data,
      { repair: false },
    );
    expect(prepared.ownerByRuntimeId["locations--map"]).toBe("locations");
    expect(prepared.componentPathById.locations).toBe("/components/0");
    expect(prepared.componentPathById["locations--map"]).toBeUndefined();
  });
});
