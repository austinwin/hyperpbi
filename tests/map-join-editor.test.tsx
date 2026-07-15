import { describe, expect, it } from "vitest";
import { act } from "preact/test-utils";
import { button, mountMapStudio } from "./map-studio-fixture";

describe("Map Studio join editor", () => {
    it("guides ArcGIS joins and keeps them inactive until a valid preview is saved", () => {
        const mounted = mountMapStudio();
        act(() => button(mounted.host, "+ Add layer").click());
        act(() => button(mounted.host, "ArcGIS feature layer").click());
        act(() => button(mounted.host, "Join").click());
        expect(mounted.host.textContent).toContain("Join is not active");
        expect(button(mounted.host, "Save join").disabled).toBe(true);
        expect(mounted.host.querySelectorAll(".hp-map-join-steps li")).toHaveLength(14);
        expect(mounted.host.textContent).toContain("Local join preview");
        expect(mounted.host.textContent).toContain("does not create a Power BI model relationship");
        mounted.cleanup();
    });
});
