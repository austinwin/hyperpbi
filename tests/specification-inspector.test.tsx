import { h, render } from "preact";
import { act } from "preact/test-utils";
import { describe, expect, it, vi } from "vitest";
import { calculateAggregates } from "../src/data/aggregations";
import { normalizeMapBindings } from "../src/data/normalizeMapBindings";
import { SpecificationInspector } from "../src/editor/inspector/SpecificationInspector";

const fields = {
  status: {
    key: "status",
    displayName: "Status",
    type: "dimension" as const,
    roles: [],
  },
};
const rows = [{ status: "Open" }];
const data = {
  fields,
  rows,
  rowKeys: ["1"],
  aggregates: calculateAggregates(rows),
  map: normalizeMapBindings(rows, fields),
};

describe("SpecificationInspector", () => {
  it("selects from the tree and preserves valid JSON on invalid edits", () => {
    const onChange = vi.fn();
    const onSelect = vi.fn();
    const json = JSON.stringify({
      version: "2.0",
      components: [
        { type: "text", id: "note", text: "Hello", span: 6 },
      ],
    });
    const host = document.createElement("div");
    act(() =>
      render(
        h(SpecificationInspector, {
          json,
          data,
          onChange,
          onSelect,
          selectedComponentId: "note",
        }),
        host,
      ),
    );

    act(() => host.querySelector<HTMLButtonElement>('[role="treeitem"]')!.click());
    expect(onSelect).toHaveBeenCalledWith("note");

    const spanLabel = Array.from(
      host.querySelectorAll<HTMLLabelElement>("label.hp-studio-field-label"),
    ).find((label) => label.textContent === "span")!;
    const span = host.querySelector<HTMLInputElement>(`#${spanLabel.htmlFor}`)!;
    act(() => {
      span.value = "99";
      span.dispatchEvent(new Event("input", { bubbles: true }));
    });
    act(() => span.dispatchEvent(new FocusEvent("blur")));

    expect(onChange).not.toHaveBeenCalled();
    expect(host.textContent).toContain("Change wasn’t applied");
  });

  it("keeps complex-property selection in component state and shows parse errors", () => {
    const json = JSON.stringify({
      version: "2.0",
      components: [{ type: "table", id: "records", columns: ["status"] }],
    });
    const host = document.createElement("div");
    act(() =>
      render(
        h(SpecificationInspector, {
          json,
          data,
          onChange: vi.fn(),
          selectedComponentId: "records",
        }),
        host,
      ),
    );
    const select = host.querySelector<HTMLSelectElement>(
      ".hp-inspector-fragment select",
    )!;
    act(() => {
      select.value = "interaction";
      select.dispatchEvent(new Event("change", { bubbles: true }));
    });
    const area = host.querySelector<HTMLTextAreaElement>(
      ".hp-inspector-fragment textarea",
    )!;
    act(() => {
      area.value = "{";
      area.dispatchEvent(new Event("input", { bubbles: true }));
      host.querySelector<HTMLButtonElement>(
        ".hp-inspector-fragment button",
      )!.click();
    });
    expect(host.querySelector('[role="alert"]')).not.toBeNull();
  });
});
