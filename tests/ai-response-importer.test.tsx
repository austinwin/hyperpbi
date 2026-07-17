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
    it("promotes the complete validated result through the preview transaction", () => {
        const onPreview = vi.fn(() => true);
        const host = document.createElement("div");
        act(() => render(<AiResponseImporter data={data} currentSpecification={current} onPreview={onPreview} />, host));
        const response = JSON.stringify({ kind: "hyperpbi-change", version: "1.0", operation: "remove", targetId: "two" });
        const textarea = host.querySelector("textarea")!;
        act(() => { textarea.value = response; textarea.dispatchEvent(new Event("input", { bubbles: true })); });
        const validateButton = Array.from(host.querySelectorAll<HTMLButtonElement>("button"))
            .find(button => button.textContent?.includes("Validate response & preview"));
        expect(validateButton).toBeDefined();
        act(() => validateButton!.click());
        expect(onPreview).toHaveBeenCalledOnce();
        const promoted = JSON.parse(onPreview.mock.calls[0][0]);
        expect(promoted.components.map((component: { id: string }) => component.id)).toEqual(["one"]);
        expect(host.textContent).not.toContain("Apply change");
        expect(host.textContent).toContain("Remove selected component (two)");
        expect(host.textContent).toContain("synchronized with the working JSON");
    });

    it("preserves the current dashboard and exposes repair controls after failure", () => {
        const onPreview = vi.fn(() => true);
        const host = document.createElement("div");
        act(() => render(<AiResponseImporter data={data} currentSpecification={current} onPreview={onPreview} />, host));
        const textarea = host.querySelector("textarea")!;
        act(() => { textarea.value = JSON.stringify({ kind: "hyperpbi-change", version: "1.0", operation: "remove", targetId: "missing" }); textarea.dispatchEvent(new Event("input", { bubbles: true })); });
        const validateButton = Array.from(host.querySelectorAll<HTMLButtonElement>("button"))
            .find(button => button.textContent?.includes("Validate response & preview"));
        expect(validateButton).toBeDefined();
        act(() => validateButton!.click());
        expect(onPreview).not.toHaveBeenCalled();
        expect(host.textContent).toContain("does not exist");
        expect(host.textContent).toContain("Copy targeted repair prompt");
    });
});
