import { describe, expect, it } from "vitest";
import { act } from "preact/test-utils";
import { button, change, mountMapStudio } from "./map-studio-fixture";

describe("Map Studio canonical editing", () => {
    it("opens the selected map and adds, renames, duplicates, deletes, undoes, and redoes canonical layers", () => {
        const mounted = mountMapStudio();
        expect(mounted.host.textContent).toContain("Map Studio");
        act(() => button(mounted.host, "Add Power BI layer").click());
        let specification = JSON.parse(mounted.json());
        expect(specification.components[0].layers).toHaveLength(2);
        change(mounted.host.querySelector('[aria-label="Layer name"]')!, "Facilities");
        act(() => button(mounted.host, "Duplicate layer").click());
        specification = JSON.parse(mounted.json());
        expect(new Set(specification.components[0].layers.map((layer: { id: string }) => layer.id)).size).toBe(3);
        act(() => button(mounted.host, "Delete layer").click());
        expect(button(mounted.host, "Confirm delete layer")).toBeTruthy();
        act(() => button(mounted.host, "Confirm delete layer").click());
        expect(JSON.parse(mounted.json()).components[0].layers).toHaveLength(2);
        act(() => button(mounted.host, "Undo").click());
        expect(JSON.parse(mounted.json()).components[0].layers).toHaveLength(3);
        act(() => button(mounted.host, "Redo").click());
        expect(JSON.parse(mounted.json()).components[0].layers).toHaveLength(2);
        mounted.cleanup();
    });

    it("rejects an invalid candidate without replacing the last valid JSON", () => {
        const mounted = mountMapStudio();
        const before = mounted.json();
        change(mounted.host.querySelector('[aria-label="Layer name"]')!, "");
        expect(mounted.json()).toBe(before);
        expect(mounted.host.textContent).toContain("last valid preview is unchanged");
        mounted.cleanup();
    });
});
