import { describe, expect, it } from "vitest";
import { arcGisLayerRequestRevision } from "../src/components/maps/runtime/arcGisLayerRequestRevision";
import type { MapLayerDefinition } from "../src/schema/mapSchema";

const layer = (): MapLayerDefinition => ({
  id: "facilities",
  name: "Facilities",
  source: { type: "arcgisFeature", url: "https://example.test/FeatureServer/0", mode: "reference" },
  renderer: { type: "simple", symbol: { color: "#111" } },
  popup: { enabled: true, title: "Facility {{NAME}}", fields: [] },
});

describe("ArcGIS request revisions", () => {
  it("ignores presentation-only changes and includes query field changes", () => {
    const initial = layer();
    const appearance = layer();
    appearance.renderer = { type: "simple", symbol: { color: "#f00" } };
    appearance.opacity = 0.4;
    appearance.popup!.title = "Selected facility {{NAME}}";
    expect(arcGisLayerRequestRevision(appearance, undefined)).toBe(
      arcGisLayerRequestRevision(initial, undefined),
    );
    appearance.popup!.fields = [{ field: "STATUS", fieldSource: "service" }];
    expect(arcGisLayerRequestRevision(appearance, undefined)).not.toBe(
      arcGisLayerRequestRevision(initial, undefined),
    );
  });
});

