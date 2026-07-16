import { describe, expect, it } from "vitest";
import { validateSchema } from "../src/schema/validateSchema";
import { button, mountMapStudio, mapStudioSpecification } from "./map-studio-fixture";
import { act } from "preact/test-utils";

describe("map feature interaction trigger contract", () => {
  it("accepts click and rejects change and auto only for map layers", () => {
    for (const trigger of ["click", "change", "auto"] as const) {
      const candidate = JSON.parse(mapStudioSpecification);
      candidate.components[0].layers[0].interaction = {
        enabled: true,
        trigger,
        internalMode: "highlight",
      };
      const result = validateSchema(candidate);
      const triggerIssue = result.diagnostics?.find(
        (item) => item.code === "MAP_INTERACTION_TRIGGER_UNSUPPORTED",
      );
      expect(Boolean(triggerIssue), trigger).toBe(trigger !== "click");
      if (triggerIssue)
        expect(triggerIssue.path).toBe("/components/0/layers/0/interaction/trigger");
    }
    const nonMap = validateSchema({
      version: "2.0",
      components: [{
        type: "table",
        id: "records",
        columns: ["status"],
        interaction: { enabled: true, trigger: "change", internalMode: "filter" },
      }],
    });
    expect(nonMap.diagnostics?.some((item) => item.code === "MAP_INTERACTION_TRIGGER_UNSUPPORTED")).toBe(false);
  });

  it("offers a fixed click-only value in Map Studio", () => {
    const mounted = mountMapStudio();
    act(() => button(mounted.host, "Interactions").click());
    const trigger = mounted.host.querySelector('[aria-label="Map interaction trigger"]') as HTMLInputElement;
    expect(trigger.value).toBe("click");
    expect(trigger.readOnly).toBe(true);
    expect(mounted.host.textContent).toContain("on click only");
    mounted.cleanup();
  });

  it("repairs an existing unsupported trigger when the interaction is edited", () => {
    const candidate = JSON.parse(mapStudioSpecification);
    candidate.components[0].layers[0].interaction = {
      enabled: true,
      trigger: "auto",
      internalMode: "highlight",
    };
    const mounted = mountMapStudio(JSON.stringify(candidate));
    act(() => button(mounted.host, "Interactions").click());
    const enabled = mounted.host.querySelector(
      '.hp-map-form-grid input[type="checkbox"]',
    ) as HTMLInputElement;
    act(() => {
      enabled.checked = false;
      enabled.dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(JSON.parse(mounted.json()).components[0].layers[0].interaction).toMatchObject({
      enabled: false,
      trigger: "click",
    });
    mounted.cleanup();
  });
});
