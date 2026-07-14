import { readFileSync } from "node:fs";
import { resolve } from "node:path";
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
    it.each([1440, 1024, 768, 480])("keeps pane state and selection at %spx", width => {
        Object.defineProperty(window, "innerWidth", { configurable: true, value: width });
        Object.defineProperty(window, "innerHeight", { configurable: true, value: 360 });
        const host = document.createElement("div");
        act(() => render(<SpecificationInspector json={specification} data={data} selectedComponentId="total" onSelect={vi.fn()} onChange={vi.fn()} />, host));
        const inspector = host.querySelector<HTMLElement>(".hp-spec-inspector")!;
        expect(inspector.dataset.activePane).toBe("tree");
        expect(host.querySelector(".hp-inspector-tree")).not.toBeNull();
        expect(host.querySelector(".hp-inspector-properties")).not.toBeNull();
        const properties = Array.from(host.querySelectorAll<HTMLButtonElement>('.hp-inspector-pane-switch [role="tab"]')).find(button => button.textContent === "Properties")!;
        act(() => properties.click());
        expect(inspector.dataset.activePane).toBe("properties");
        expect(host.textContent).toContain("/components/0/children/0");
        expect(host.textContent).toContain("total");
    });

    it("uses effective logical-dataset fields and supports keyboard tree navigation", () => {
        const onSelect = vi.fn();
        const host = document.createElement("div");
        act(() => render(<SpecificationInspector json={specification} data={data} selectedComponentId="total" onSelect={onSelect} onChange={vi.fn()} />, host));
        const fieldLabel = Array.from(host.querySelectorAll("label")).find(label => label.textContent?.startsWith("field"));
        expect(Array.from(fieldLabel!.querySelectorAll("option")).map(option => option.value)).toContain("double");
        const first = host.querySelector<HTMLButtonElement>('[role="treeitem"]')!;
        act(() => first.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true })));
        expect(onSelect).toHaveBeenCalledWith("total");
    });

    it("declares desktop resizing, container-responsive single-pane behavior, and narrow-height scrolling", () => {
        const css = readFileSync(resolve(process.cwd(), "src/styles/hyperpbi-inspector.css"), "utf8");
        expect(css).toContain("--hp-inspector-tree-width");
        expect(css).toContain("@container hp-inspector (max-width: 680px)");
        expect(css).toContain(".hp-inspector-body .is-mobile-hidden { display: none; }");
        expect(css).toContain("min-height: 0");
        expect(css).toContain("overflow: auto");
    });
});
