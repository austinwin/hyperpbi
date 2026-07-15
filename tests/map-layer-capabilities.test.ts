import { describe, expect, it } from "vitest";
import { resolveMapLayerCapabilities } from "../src/maps/model/mapLayerCapabilities";

describe("map layer capabilities", () => {
  it("exposes feature interaction only where executable", () => {
    expect(resolveMapLayerCapabilities("arcgisFeature")).toMatchObject({
      popup: true,
      join: true,
      selection: true,
      serviceRenderer: true,
    });
    expect(resolveMapLayerCapabilities("arcgisDynamic")).toMatchObject({
      display: true,
      featureInteraction: true,
      popup: true,
      join: false,
      selection: false,
      identify: true,
    });
    expect(resolveMapLayerCapabilities("arcgisTile")).toMatchObject({
      display: true,
      featureInteraction: false,
      popup: false,
      identify: false,
    });
  });
});

