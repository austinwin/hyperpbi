import { describe, expect, it } from "vitest";
import { resolveMapSizing } from "../src/components/maps/runtime/mapSizing";

describe("map sizing", () => {
  it("normalizes fixed, fill, aspect ratio, and Studio preview modes", () => {
    expect(resolveMapSizing({ type: "map", height: 100 }).frameStyle).toMatchObject({
      height: "220px",
      minHeight: "220px",
    });
    expect(resolveMapSizing({ type: "map", heightMode: "fill", minHeight: 180 })).toMatchObject({
      mode: "fill",
      frameStyle: { height: "100%", minHeight: "180px" },
    });
    expect(resolveMapSizing({ type: "map", heightMode: "aspectRatio", aspectRatio: 2 }).frameStyle.aspectRatio).toBe("2");
    expect(resolveMapSizing({ type: "map" }, { studioPreview: true }).mode).toBe("fill");
  });
});

