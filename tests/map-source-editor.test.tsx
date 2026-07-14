import { describe, expect, it } from "vitest";
import { act } from "preact/test-utils";
import { mountMapStudio } from "./map-studio-fixture";

describe("Map Studio source editor", () => {
    it("selects the logical dataset and explicit location fields", () => {
        const mounted = mountMapStudio();
        const dataset = mounted.host.querySelector('[aria-label="Layer dataset"]') as HTMLSelectElement;
        act(() => { dataset.value = "openAssets"; dataset.dispatchEvent(new Event("change", { bubbles: true })); });
        const latitude = mounted.host.querySelector('[aria-label="latitude"]') as HTMLSelectElement;
        act(() => { latitude.value = "amount"; latitude.dispatchEvent(new Event("change", { bubbles: true })); });
        const layer = JSON.parse(mounted.json()).components[0].layers[0];
        expect(layer.dataset).toBe("openAssets");
        expect(layer.source.bindings.latitude).toBe("amount");
        mounted.cleanup();
    });
});
