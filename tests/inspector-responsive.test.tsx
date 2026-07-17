import { h, render } from "preact";
import { act } from "preact/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { SpecificationInspector } from "../src/editor/inspector/SpecificationInspector";
import { calculateAggregates } from "../src/data/aggregations";
import { normalizeMapBindings } from "../src/data/normalizeMapBindings";

const rows = [{ status: "Open", amount: 10 }];
const fields = {
    status: { key: "status", displayName: "Status", type: "dimension" as const, dataType: "text" as const, roles: [] },
    amount: { key: "amount", displayName: "Amount", type: "measure" as const, dataType: "number" as const, roles: [] },
};
const data = { fields, rows, rowKeys: ["1"], aggregates: calculateAggregates(rows), map: normalizeMapBindings(rows, fields) };
const specification = JSON.stringify({ version: "2.0", data: { datasets: { regional: { source: "powerbi", select: ["status", "amount", "double"], derive: { double: { op: "*", args: [{ field: "amount" }, { value: 2 }] } } } } }, components: [
    { type: "section", id: "overview", children: [{ type: "countUp", id: "total", dataset: "regional", field: "double", aggregation: "sum" }] },
] });

afterEach(() => document.body.replaceChildren());

describe("responsive Visual Inspector", () => {
    it("connects pane tabs to their panels and preserves selection while switching", () => {
        const host = document.createElement("div");
        act(() => render(<SpecificationInspector json={specification} data={data} selectedComponentId="total" onSelect={vi.fn()} onChange={vi.fn()} />, host));
        const inspector = host.querySelector<HTMLElement>(".hp-spec-inspector")!;
        expect(inspector.dataset.activePane).toBe("tree");
        const tabs = Array.from(host.querySelectorAll<HTMLButtonElement>('.hp-inspector-pane-switch [role="tab"]'));
        const [tree, properties] = tabs;
        expect(tree.getAttribute("aria-selected")).toBe("true");
        expect(host.querySelector(`#${tree.getAttribute("aria-controls")}`)?.getAttribute("role")).toBe("tabpanel");
        expect(host.querySelector(`#${properties.getAttribute("aria-controls")}`)?.getAttribute("role")).toBe("tabpanel");
        act(() => properties.click());
        expect(inspector.dataset.activePane).toBe("properties");
        expect(properties.getAttribute("aria-selected")).toBe("true");
        expect(host.textContent).toContain("/components/0/children/0");
        expect(host.textContent).toContain("total");
    });

    it("uses effective logical-dataset fields and supports keyboard tree navigation", () => {
        const onSelect = vi.fn();
        const host = document.createElement("div");
        act(() => render(<SpecificationInspector json={specification} data={data} selectedComponentId="total" onSelect={onSelect} onChange={vi.fn()} />, host));
        const fieldLabel = Array.from(host.querySelectorAll<HTMLLabelElement>("label")).find(label => label.textContent?.trim() === "field")!;
        const field = host.querySelector<HTMLSelectElement>(`#${fieldLabel.htmlFor}`)!;
        expect(Array.from(field.options).map(option => option.value)).toContain("double");
        const first = host.querySelector<HTMLButtonElement>('[role="treeitem"]')!;
        act(() => first.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true })));
        expect(onSelect).toHaveBeenCalledWith("total");
    });

    it("uses a roving tree tab stop and presents an actionable empty search state", () => {
        const host = document.createElement("div");
        act(() => render(<SpecificationInspector json={specification} data={data} selectedComponentId="total" onSelect={vi.fn()} onChange={vi.fn()} />, host));
        const items = Array.from(host.querySelectorAll<HTMLButtonElement>('[role="treeitem"]'));
        expect(items.map(item => item.tabIndex)).toEqual([-1, 0]);
        expect(items.map(item => item.getAttribute("aria-level"))).toEqual(["1", "2"]);
        expect(items[0].getAttribute("aria-expanded")).toBe("true");

        const search = host.querySelector<HTMLInputElement>('input[type="search"]')!;
        act(() => {
            search.value = "does-not-exist";
            search.dispatchEvent(new Event("input", { bubbles: true }));
        });
        expect(host.querySelector('[role="tree"] [role="treeitem"]')).toBeNull();
        expect(host.querySelector(".hp-inspector-search-empty")?.textContent).toContain("No matching components");
        expect(host.querySelector<HTMLButtonElement>('[aria-label="Clear component search"]')).not.toBeNull();
    });
});
