import { h, render } from "preact";
import { act } from "preact/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { InteractionQuickSetup, recommendedInteraction } from "../src/editor/inspector/InteractionQuickSetup";

afterEach(() => document.body.replaceChildren());

describe("guided component linking", () => {
  const fields = [{ key: "zone", label: "Zone", powerBiTarget: "Water.Zone" }];
  const components = [
    { id: "chart", type: "barChart" },
    { id: "details", type: "table" },
    { id: "map", type: "map" },
  ];

  it("generates existing schema 2.0 interaction properties, without a new key", () => {
    const result = recommendedInteraction(
      { type: "barChart", id: "chart", category: "zone" } as never,
      fields,
    );
    expect(result).toMatchObject({
      enabled: true,
      internalMode: "filter",
      internalScope: "others",
      externalMode: "auto",
      field: "zone",
      clearOnSecondClick: true,
    });
    expect(result.targets).toBeUndefined();
  });

  it("makes the local and Power BI paths visible and updates behavior", () => {
    const onChange = vi.fn();
    const host = document.createElement("div");
    act(() => render(h(InteractionQuickSetup, {
      component: { type: "barChart", id: "chart", category: "zone" },
      components,
      fields,
      onChange,
    }), host));
    expect(host.textContent).toContain("Power BI: selection");
    expect(host.textContent).toContain("No internal linking");
    const select = host.querySelector<HTMLSelectElement>('[aria-label="Within HyperPBI"]')!;
    act(() => {
      select.value = "highlight";
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({
      enabled: true,
      internalMode: "highlight",
      internalScope: "others",
    }));
  });

  it("links to a named receiving component, rather than inventing a data key", () => {
    const onChange = vi.fn();
    const host = document.createElement("div");
    act(() => render(h(InteractionQuickSetup, {
      component: { type: "barChart", id: "chart", category: "zone", interaction: { internalMode: "filter", internalScope: "others" } },
      components,
      fields,
      onChange,
    }), host));
    const select = host.querySelector<HTMLSelectElement>('[aria-label="Linked components"]')!;
    act(() => {
      select.value = "specific";
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(onChange).toHaveBeenCalledWith(expect.objectContaining({ targets: ["details"] }));
  });

  it("identifies Power BI model-column readiness for external filters", () => {
    const host = document.createElement("div");
    act(() => render(h(InteractionQuickSetup, {
      component: { type: "select", id: "slicer", field: "zone", interaction: { externalMode: "filter", field: "zone" } },
      components,
      fields,
      onChange: vi.fn(),
    }), host));
    expect(host.textContent).toContain("Model column: Water.Zone.");
  });
});
