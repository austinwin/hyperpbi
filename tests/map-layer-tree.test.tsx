import { describe, expect, it } from "vitest";
import { act } from "preact/test-utils";
import { button, mountMapStudio } from "./map-studio-fixture";

describe("Map Studio layer tree", () => {
    it("creates groups and supports keyboard-safe ordered layers", () => {
        const mounted = mountMapStudio();
        act(() => button(mounted.host, "+ Add layer").click());
        act(() => button(mounted.host, "Layer group").click());
        expect(JSON.parse(mounted.json()).components[0].layerGroups[0]).toMatchObject({ id: "layer-group", name: "Layer group" });
        act(() => button(mounted.host, "+ Add layer").click());
        act(() => button(mounted.host, "Power BI layer").click());
        const select = mounted.host.querySelector('[aria-label="Layer group"]') as HTMLSelectElement;
        act(() => { select.value = "layer-group"; select.dispatchEvent(new Event("change", { bubbles: true })); });
        expect(JSON.parse(mounted.json()).components[0].layers[1].groupId).toBe("layer-group");
        const selected = mounted.host.querySelector('[aria-label="Select layer Power BI layer"]') as HTMLButtonElement;
        act(() => selected.dispatchEvent(new KeyboardEvent("keydown", { key: "ArrowUp", bubbles: true })));
        expect(JSON.parse(mounted.json()).components[0].layers[1].groupId).toBe("layer-group");
        mounted.cleanup();
    });
});
