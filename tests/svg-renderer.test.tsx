import { h, render } from "preact";
import { act } from "preact/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { calculateAggregates } from "../src/data/aggregations";
import { normalizeMapBindings } from "../src/data/normalizeMapBindings";
import type { NormalizedData } from "../src/data/normalizeData";
import { HyperPbiRoot } from "../src/render/HyperPbiRoot";
import type { HyperPbiSchema } from "../src/schema/hyperpbiSchema";
import { toRuntimeSettings, VisualFormattingSettingsModel } from "../src/settings";

const rows = [{ status: "Open", completion: 25 }, { status: "Closed", completion: 75 }];
const fields = { status: { key: "status", displayName: "Status", type: "dimension" as const, roles: ["values"], sourceTable: "Work", sourceColumn: "Status" }, completion: { key: "completion", displayName: "Completion", type: "measure" as const, kind: "measure" as const, dataType: "number" as const, roles: ["values"], sourceTable: "Work", sourceColumn: "Completion" } };
const data: NormalizedData = { rows, rowKeys: ["open", "closed"], fields, aggregates: calculateAggregates(rows), map: normalizeMapBindings(rows, fields, undefined, undefined, ["open", "closed"]) };
const settings = toRuntimeSettings(new VisualFormattingSettingsModel());
afterEach(() => document.body.replaceChildren());

describe("SVG renderer integration", () => {
    it("renders native declarative SVG with isolated IDs, rewritten references, and scoped animation", () => {
        const make = (id: string) => ({ type: "svg" as const, id, viewBox: "0 0 100 40", ariaLabel: id, elements: [{ type: "defs" as const, children: [{ type: "linearGradient" as const, id: "gradient", children: [{ type: "stop" as const, offset: "0%", stopColor: "#fff" }] }] }, { type: "rect" as const, id: "bar", x: 0, y: 0, width: { bind: "completion", scale: { domain: [0, 200], range: [0, 100], clamp: true } }, height: 20, fill: "url(#gradient)", animation: { preset: "progress-fill" as const, durationMs: 500 } }] });
        const schema: HyperPbiSchema = { version: "2.0", components: [make("first"), make("second")] };
        const host = document.createElement("div"); act(() => render(<HyperPbiRoot instanceId="visual8" schema={schema} data={data} settings={settings} renderMs={0} />, host));
        const gradients = Array.from(host.querySelectorAll("linearGradient")).map(node => node.id); expect(gradients).toHaveLength(2); expect(new Set(gradients).size).toBe(2); expect(gradients.every(id => id.includes("visual8"))).toBe(true);
        const rects = Array.from(host.querySelectorAll("rect")); expect(rects[0]?.getAttribute("fill")).toBe(`url(#${gradients[0]})`); expect(rects[0]?.getAttribute("width")).toBe("50"); expect(host.textContent).not.toContain("Unsupported component"); expect(host.querySelector('[data-hp-svg="hp-visual8-first"] style')?.textContent).toContain("@keyframes hp-visual8-first");
    });

    it("activates repeated marks by click and keyboard with original row selection", () => {
        const selectExternal = vi.fn(() => ({ sent: true as const }));
        const schema: HyperPbiSchema = { version: "2.0", components: [{ type: "svg", id: "statuses", viewBox: "0 0 200 60", ariaLabel: "Statuses", elements: [{ type: "g", repeat: { limit: 10, keyField: "status", children: [{ type: "circle", id: "dot", cx: { bind: "$index", scale: { domain: [0, 1], range: [20, 80] } }, cy: 20, r: 10, fill: "#2563eb", ariaLabel: "Status", interaction: { enabled: true, internalMode: "highlight", externalMode: "selection", field: "status", selectionMode: "replace" } }] } }] }] };
        const host = document.createElement("div"); act(() => render(<HyperPbiRoot instanceId="selection-svg" schema={schema} data={data} settings={settings} renderMs={0} selectExternal={selectExternal} />, host)); const marks = host.querySelectorAll<SVGCircleElement>("circle.hp-svg-interactive"); expect(marks).toHaveLength(2); expect(marks[0].getAttribute("tabindex")).toBe("0");
        act(() => marks[1].dispatchEvent(new MouseEvent("click", { bubbles: true }))); expect(selectExternal).toHaveBeenLastCalledWith([1], false, expect.objectContaining({ componentId: "statuses", field: "status" }));
        act(() => marks[0].dispatchEvent(new KeyboardEvent("keydown", { key: "Enter", bubbles: true }))); expect(selectExternal).toHaveBeenLastCalledWith([0], false, expect.objectContaining({ componentId: "statuses" }));
    });

    it("renders only the final dedicated-sanitizer output for svgMarkup", () => {
        const schema: HyperPbiSchema = { version: "2.0", components: [{ type: "svgMarkup", id: "raw", ariaLabel: "Raw status", svg: `<svg viewBox="0 0 100 40"><script>alert(1)</script><rect id="safe" onclick="bad()" width="100" height="40" fill="#2563eb"/><text x="10" y="20">{{status}}</text></svg>` }] };
        const host = document.createElement("div"); act(() => render(<HyperPbiRoot instanceId="raw-svg" schema={schema} data={data} settings={settings} renderMs={0} />, host)); const markupHost = host.querySelector(".hp-svg-markup-host")!; expect(markupHost.querySelector("svg")).not.toBeNull(); expect(markupHost.innerHTML).not.toMatch(/script|onclick|alert\(1\)|bad\(\)/i); expect(markupHost.textContent).toContain("Open"); expect(markupHost.querySelector("rect")?.getAttribute("fill")).toBe("#2563eb");
    });
});
