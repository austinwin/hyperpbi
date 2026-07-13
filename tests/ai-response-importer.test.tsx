import { h, render } from "preact";
import { act } from "preact/test-utils";
import { describe, expect, it, vi } from "vitest";
import { calculateAggregates } from "../src/data/aggregations";
import { normalizeMapBindings } from "../src/data/normalizeMapBindings";
import type { NormalizedData } from "../src/data/normalizeData";
import { AiResponseImporter } from "../src/editor/ai/AiResponseImporter";

const data: NormalizedData = { fields: {}, rows: [], rowKeys: [], aggregates: calculateAggregates([]), map: normalizeMapBindings([], {}) };
const current = JSON.stringify({ version: "2.0", components: [{ type: "text", id: "one", text: "A" }, { type: "text", id: "two", text: "B" }] });

describe("AI response importer", () => {
    it("requires a successful preview before an explicit apply", () => {
        const onPreview = vi.fn(() => true);
        const onApply = vi.fn();
        const host = document.createElement("div");
        act(() => render(<AiResponseImporter data={data} currentSpecification={current} onPreview={onPreview} onApply={onApply} />, host));
        const response = JSON.stringify({ kind: "hyperpbi-change", version: "1.0", operation: "remove", targetId: "two" });
        const textarea = host.querySelector("textarea")!;
        act(() => { textarea.value = response; textarea.dispatchEvent(new Event("input", { bubbles: true })); });
        const buttons = Array.from(host.querySelectorAll<HTMLButtonElement>("button"));
        const apply = buttons.find(button => button.textContent === "Apply change")!;
        expect(apply.disabled).toBe(true);
        act(() => buttons.find(button => button.textContent?.includes("Validate resulting dashboard"))!.click());
        expect(onPreview).toHaveBeenCalledOnce();
        expect(onApply).not.toHaveBeenCalled();
        expect(apply.disabled).toBe(false);
        expect(host.textContent).toContain("Remove selected component (two)");
        act(() => apply.click());
        expect(onApply).toHaveBeenCalledOnce();
    });

    it("preserves the current dashboard and exposes repair controls after failure", () => {
        const onApply = vi.fn();
        const host = document.createElement("div");
        act(() => render(<AiResponseImporter data={data} currentSpecification={current} onPreview={vi.fn(() => true)} onApply={onApply} />, host));
        const textarea = host.querySelector("textarea")!;
        act(() => { textarea.value = JSON.stringify({ kind: "hyperpbi-change", version: "1.0", operation: "remove", targetId: "missing" }); textarea.dispatchEvent(new Event("input", { bubbles: true })); });
        act(() => Array.from(host.querySelectorAll<HTMLButtonElement>("button")).find(button => button.textContent?.includes("Validate resulting dashboard"))!.click());
        expect(onApply).not.toHaveBeenCalled();
        expect(host.textContent).toContain("does not exist");
        expect(host.textContent).toContain("Copy targeted repair prompt");
    });
});
