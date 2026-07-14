import { describe, expect, it } from "vitest";
import { act } from "preact/test-utils";
import { button, mountMapStudio } from "./map-studio-fixture";

describe("Map Studio join editor", () => {
    it("configures an ArcGIS join and previews bounded local keys", () => {
        const mounted = mountMapStudio();
        act(() => button(mounted.host, "Add ArcGIS feature layer").click());
        act(() => button(mounted.host, "join").click());
        const enabled = mounted.host.querySelector('input[type="checkbox"]') as HTMLInputElement;
        act(() => { enabled.checked = true; enabled.dispatchEvent(new Event("change", { bubbles: true })); });
        expect(JSON.parse(mounted.json()).components[0].layers[1]).toMatchObject({ source: { type: "arcgisFeature", mode: "join" }, join: { enabled: true } });
        expect(mounted.host.textContent).toContain("Local join preview");
        expect(mounted.host.textContent).toContain("does not create a Power BI model relationship");
        mounted.cleanup();
    });
});
