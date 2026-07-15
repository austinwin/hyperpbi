import { describe, expect, it } from "vitest";
import { act } from "preact/test-utils";
import { button, mountMapStudio } from "./map-studio-fixture";

describe("Map Studio renderer editor", () => {
    it("writes a typed renderer and shows bounded domain values", () => {
        const mounted = mountMapStudio();
        act(() => button(mounted.host, "Renderer").click());
        const renderer = mounted.host.querySelector('[aria-label="Renderer type"]') as HTMLSelectElement;
        act(() => { renderer.value = "classBreaks"; renderer.dispatchEvent(new Event("change", { bubbles: true })); });
        const field = mounted.host.querySelector('[aria-label="field"]') as HTMLSelectElement;
        act(() => { field.value = "amount"; field.dispatchEvent(new Event("change", { bubbles: true })); });
        expect(JSON.parse(mounted.json()).components[0].layers[0].renderer).toMatchObject({ type: "classBreaks", field: "amount", method: "quantile" });
        expect(mounted.host.textContent).toContain("Bounded values/domain preview");
        mounted.cleanup();
    });
});
