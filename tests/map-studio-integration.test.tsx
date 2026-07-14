import { render } from "preact";
import { act } from "preact/test-utils";
import { describe, expect, it, vi } from "vitest";
import { defaultConfigJson } from "../src/config/hyperpbiConfig";
import { HyperPbiStudio } from "../src/editor/HyperPbiStudio";
import { toRuntimeSettings, VisualFormattingSettingsModel } from "../src/settings";
import { mapStudioData, mapStudioSpecification } from "./map-studio-fixture";

describe("Map Studio and Visual Inspector integration", () => {
    it("opens the selected map on shared canonical JSON and selection state", () => {
        const host = document.createElement("div");
        act(() => render(<HyperPbiStudio instanceId="map-studio" data={mapStudioData} settings={toRuntimeSettings(new VisualFormattingSettingsModel())} initialSpecification={mapStudioSpecification} initialConfiguration={defaultConfigJson} initialEditorTab="inspector" initialLayout={JSON.stringify({ editorPercent: 50, bottomHeight: 200, bottomOpen: false, advanced: true })} onSave={vi.fn()} />, host));
        act(() => (host.querySelector('[role="treeitem"]') as HTMLButtonElement).click());
        expect(host.textContent).toContain("Open in Map Studio");
        act(() => Array.from(host.querySelectorAll<HTMLButtonElement>("button")).find(item => item.textContent === "Open in Map Studio")!.click());
        expect(host.querySelector(".hp-map-studio")).not.toBeNull();
        expect((host.querySelector('[aria-label="Selected map"]') as HTMLSelectElement).value).toBe("operations");
        act(() => Array.from(host.querySelectorAll<HTMLButtonElement>(".hp-studio-tabs button")).find(item => item.textContent === "Inspector")!.click());
        expect(host.textContent).toContain("operations");
        act(() => render(null, host));
    });
});
