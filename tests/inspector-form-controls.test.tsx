import { render } from "preact";
import { act } from "preact/test-utils";
import { describe, expect, it, vi } from "vitest";
import { SpecificationInspector } from "../src/editor/inspector/SpecificationInspector";
import { mapStudioData } from "./map-studio-fixture";

const specification = JSON.stringify({
  version: "2.0",
  components: [{ type: "text", id: "note", title: "Original", text: "Hello", hidden: false }],
});

describe("Inspector form controls", () => {
  it("uses an inline checkbox row and drafts text until blur", () => {
    const onChange = vi.fn();
    const host = document.createElement("div");
    act(() => render(
      <SpecificationInspector json={specification} data={mapStudioData} selectedComponentId="note" onChange={onChange} />,
      host,
    ));
    const hidden = Array.from(host.querySelectorAll<HTMLElement>(".hp-studio-check"))
      .find((row) => row.textContent?.includes("hidden"))!;
    expect(hidden.querySelector('input[type="checkbox"]')).not.toBeNull();
    expect(hidden.querySelector("strong")?.textContent).toBe("hidden");

    const text = Array.from(host.querySelectorAll<HTMLLabelElement>("label"))
      .find((label) => label.querySelector(".hp-studio-field-label")?.textContent === "title")!
      .querySelector<HTMLInputElement>("input")!;
    act(() => {
      text.value = "Draft";
      text.dispatchEvent(new Event("input", { bubbles: true }));
    });
    expect(onChange).not.toHaveBeenCalled();
    act(() => text.dispatchEvent(new FocusEvent("blur")));
    expect(onChange).toHaveBeenCalledTimes(1);
  });

  it("restores a one-line draft on Escape", () => {
    const onChange = vi.fn();
    const host = document.createElement("div");
    act(() => render(
      <SpecificationInspector json={specification} data={mapStudioData} selectedComponentId="note" onChange={onChange} />,
      host,
    ));
    const text = Array.from(host.querySelectorAll<HTMLLabelElement>("label"))
      .find((label) => label.querySelector(".hp-studio-field-label")?.textContent === "title")!
      .querySelector<HTMLInputElement>("input")!;
    act(() => {
      text.value = "Discard me";
      text.dispatchEvent(new Event("input", { bubbles: true }));
    });
    act(() => {
      text.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    });
    expect(text.value).toBe("Original");
    expect(onChange).not.toHaveBeenCalled();
  });
});
