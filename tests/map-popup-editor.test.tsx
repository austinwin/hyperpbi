import { describe, expect, it } from "vitest";
import { act } from "preact/test-utils";
import { button, mountMapStudio } from "./map-studio-fixture";

describe("Map Studio popup editor", () => {
    it("adds ordered popup fields and keeps the sanitization boundary visible", () => {
        const mounted = mountMapStudio();
        act(() => button(mounted.host, "Feature details").click());
        act(() => button(mounted.host, "Add field").click());
        expect(JSON.parse(mounted.json()).components[0].layers[0].popup.fields).toHaveLength(1);
        expect(mounted.host.textContent).toContain("Scripts, event handlers, iframes");
        mounted.cleanup();
    });
});
