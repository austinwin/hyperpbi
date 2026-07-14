import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const mapCss = readFileSync("src/styles/hyperpbi-map.css", "utf8");
const leafletRuntime = readFileSync("src/components/maps/LeafletMap.tsx", "utf8");

describe("map popup layering contract", () => {
  it("keeps vectors, labels, tooltips, popups, toolbar, and popovers in explicit order", () => {
    expect(leafletRuntime).toContain('tooltipPane.style.zIndex = "850"');
    expect(leafletRuntime).toContain('popupPane.style.zIndex = "1000"');
    expect(leafletRuntime).toContain("400 + index");
    expect(leafletRuntime).toContain("600 + index");
    expect(mapCss).toMatch(/\.hp-map-toolbar\s*\{[^}]*z-index:\s*1100/);
    expect(mapCss).toMatch(/\.hp-map-toolbar-popover\s*\{[^}]*z-index:\s*1200/);
    expect(mapCss).not.toMatch(/\.hp-map-frame\s*\{[^}]*overflow:\s*visible/);
  });

  it("binds bounded auto-pan popup options to the dedicated pane", () => {
    expect(leafletRuntime).toContain("pane: popupPaneName");
    expect(leafletRuntime).toContain("autoPan: true");
    expect(leafletRuntime).toContain("keepInView: true");
    expect(leafletRuntime).toContain("autoPanPaddingTopLeft: [16, 56]");
    expect(mapCss).toContain("max-height: min(360px, 55vh)");
  });
});
