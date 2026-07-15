import { act } from "preact/test-utils";
import { describe, expect, it } from "vitest";
import { button, mountMapStudio } from "./map-studio-fixture";

describe("Map Studio interaction editor", () => {
    it("authors the existing interaction contract and reports compatibility", () => {
        const mounted = mountMapStudio(); act(() => button(mounted.host, "Selection").click());
        expect(mounted.host.textContent).toContain("Local highlight"); expect(mounted.host.textContent).toContain("Power BI selection"); expect(mounted.host.textContent).toContain("Power BI filter");
        const field = mounted.host.querySelector('[aria-label="Interaction field"]') as HTMLSelectElement;
        act(() => { field.value = "status"; field.dispatchEvent(new Event("change", { bubbles: true })); });
        expect(JSON.parse(mounted.json()).components[0].layers[0].interaction.field).toBe("status");
        mounted.cleanup();
    });
    it("does not imply external selection for reference-only ArcGIS features", () => {
        const mounted = mountMapStudio(); act(() => button(mounted.host, "+ Add layer").click()); act(() => button(mounted.host, "ArcGIS feature layer").click()); act(() => button(mounted.host, "Selection").click());
        expect(mounted.host.textContent).toContain("reference-only ArcGIS features have no Power BI identities"); mounted.cleanup();
    });
});
