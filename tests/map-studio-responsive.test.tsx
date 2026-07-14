import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";
import { mountMapStudio } from "./map-studio-fixture";

describe("Map Studio responsive contract", () => {
  it("provides pane switching and a narrow property selector without losing selection", () => {
    const mounted = mountMapStudio();
    expect(mounted.host.querySelector('.hp-map-studio-pane-switch [role="tab"]')).not.toBeNull();
    const selector = mounted.host.querySelector<HTMLSelectElement>(".hp-map-property-select select")!;
    expect(Array.from(selector.options).map((option) => option.value)).toContain("diagnostics");
    expect(mounted.host.querySelector('.hp-map-studio-layer[draggable="true"]')).not.toBeNull();
    mounted.cleanup();
  });

  it("uses Map Studio container width for single-pane and compact property modes", () => {
    const css = readFileSync(resolve(process.cwd(), "src/styles/hyperpbi-map-studio.css"), "utf8");
    expect(css).toContain("container: hp-map-studio / inline-size");
    expect(css).toContain("@container hp-map-studio (max-width: 720px)");
    expect(css).toContain("@container hp-map-studio (max-width: 560px)");
    expect(css).toContain(".hp-map-property-select");
    expect(css).toContain("grid-template-columns: 140px minmax(320px, 1fr)");
  });
});
