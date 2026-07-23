import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const mapCss = readFileSync("src/styles/hyperpbi-map.css", "utf8");
const leafletRuntime = readFileSync("src/components/maps/LeafletMap.tsx", "utf8");
const detailsRuntime = readFileSync("src/components/maps/MapFeatureDetails.tsx", "utf8");

describe("canonical map feature-details layering", () => {
  it("keeps vectors, labels, tooltips, details, toolbar, and popovers in explicit order", () => {
    expect(leafletRuntime).toContain('tooltipPane.style.zIndex = "850"');
    expect(leafletRuntime).toContain("mapLayerPaneZIndex(layer, index)");
    expect(leafletRuntime).toContain('layer.geometryType === "polygon"');
    expect(leafletRuntime).toContain('layer.geometryType === "polyline"');
    expect(leafletRuntime).toContain('addPattern("hp-map-pattern-crosshatch"');
    expect(leafletRuntime).toContain("600 + index");
    expect(leafletRuntime).not.toContain("popupPaneName");
    expect(mapCss).toContain("--hp-map-z-toolbar: 900");
    expect(mapCss).toContain("--hp-map-z-details: 1000");
    expect(mapCss).toContain("--hp-map-z-popover: 1100");
    expect(mapCss).toContain('.hp-map-fill-pattern-dots { fill: url("#hp-map-pattern-dots"); }');
    expect(mapCss).toMatch(/\.hp-map-viewport-clip\s*\{[^}]*overflow:\s*hidden/);
    expect(mapCss).toMatch(/\.hp-map-overlay-root\s*\{[^}]*overflow:\s*visible/);
  });

  it("renders bounded canonical details modes outside the Leaflet popup API", () => {
    expect(detailsRuntime).toContain('class={`hp-map-feature-details is-${mode}`}');
    expect(detailsRuntime).toContain('mode === "panel"');
    expect(detailsRuntime).not.toContain("legacyPopup");
    expect(mapCss).toMatch(/\.hp-map-feature-details\s*\{[^}]*max-height:/);
  });
});
