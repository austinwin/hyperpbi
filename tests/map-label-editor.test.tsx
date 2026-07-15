import { describe, expect, it } from "vitest";
import { act } from "preact/test-utils";
import { button, mountMapStudio } from "./map-studio-fixture";

describe("Map Studio label editor", () => {
    it("configures declarative labels against the effective dataset", () => {
        const mounted = mountMapStudio();
        act(() => button(mounted.host, "Labels").click());
        const enabled = Array.from(mounted.host.querySelectorAll<HTMLInputElement>('input[type="checkbox"]')).find((input) => input.closest("label")?.textContent?.includes("Enable labels"))!;
        act(() => { enabled.checked = true; enabled.dispatchEvent(new Event("change", { bubbles: true })); });
        const field = mounted.host.querySelector('[aria-label="Label field"]') as HTMLSelectElement;
        act(() => { field.value = "status"; field.dispatchEvent(new Event("change", { bubbles: true })); });
        expect(JSON.parse(mounted.json()).components[0].layers[0].labels).toMatchObject({ enabled: true, field: "status", fieldSource: "powerbi" });
        mounted.cleanup();
    });
});
