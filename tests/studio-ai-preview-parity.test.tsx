import { render } from "preact";
import { act } from "preact/test-utils";
import { describe, expect, it, vi } from "vitest";
import { defaultConfigJson } from "../src/config/hyperpbiConfig";
import { HyperPbiStudio } from "../src/editor/HyperPbiStudio";
import { toRuntimeSettings, VisualFormattingSettingsModel } from "../src/settings";
import { mapStudioData, mapStudioSpecification } from "./map-studio-fixture";

const validatedMap = JSON.stringify({
  version: "2.0",
  components: [{
    type: "map",
    id: "operations",
    title: "Municipal status",
    heightMode: "fixed",
    height: 360,
    featureDetails: {
      mode: "auto",
      clearSelectionOnBackgroundClick: true,
      clearSelectionOnClose: false,
    },
    layers: [{
      id: "assets",
      name: "Municipal assets",
      source: {
        type: "powerbi",
        bindings: { latitude: "lat", longitude: "lon" },
      },
      renderer: {
        type: "uniqueValue",
        field: "status",
        fieldSource: "powerbi",
        values: [
          { value: "Open", symbol: { fillColor: "#2f855a", radius: 7 } },
          { value: "Closed", symbol: { fillColor: "#b91c1c", radius: 7 } },
        ],
      },
      tooltip: {
        enabled: true,
        fields: [{ field: "code", fieldSource: "powerbi", label: "Asset" }],
      },
      popup: {
        enabled: true,
        defaultFieldSource: "powerbi",
        title: "{{code}}",
        fields: [{ field: "status", fieldSource: "powerbi", label: "Status" }],
      },
      interaction: {
        enabled: true,
        trigger: "click",
        internalMode: "highlight",
        internalScope: "all",
        externalMode: "selection",
        multiSelect: true,
      },
    }],
  }],
});

describe("Studio AI preview and saved JSON parity", () => {
  it("uses one authoritative draft for preview, Advanced JSON, and Save & return", () => {
    const host = document.createElement("div");
    const onDraftChange = vi.fn();
    const onSave = vi.fn();
    const runtimeSettings = toRuntimeSettings(new VisualFormattingSettingsModel());
    const settings = { ...runtimeSettings, map: { ...runtimeSettings.map, enabled: false } };
    act(() => render(
      <HyperPbiStudio
        instanceId="ai-preview-parity"
        data={mapStudioData}
        settings={settings}
        initialSpecification={mapStudioSpecification}
        initialConfiguration={defaultConfigJson}
        initialEditorTab="ai"
        initialLayout={JSON.stringify({ editorPercent: 50, bottomHeight: 200, bottomOpen: false, advanced: true })}
        onDraftChange={onDraftChange}
        onSave={onSave}
      />,
      host,
    ));

    const textarea = host.querySelector<HTMLTextAreaElement>(".hp-ai-import textarea")!;
    act(() => {
      textarea.value = validatedMap;
      textarea.dispatchEvent(new Event("input", { bubbles: true }));
    });
    const validateButton = Array.from(host.querySelectorAll<HTMLButtonElement>("button"))
      .find((button) => button.textContent?.includes("Validate response & preview"));
    expect(validateButton).toBeDefined();
    act(() => validateButton!.click());

    const draft = JSON.parse(onDraftChange.mock.calls.at(-1)![0]);
    expect(draft.components[0].layers[0].renderer.type).toBe("uniqueValue");
    expect(draft.components[0].layers[0].tooltip.fields[0].field).toBe("code");
    expect(draft.components[0].layers[0].popup.title).toBe("{{code}}");

    const workspaceSelect = host.querySelector<HTMLSelectElement>(".hp-studio-workspace-select select")!;
    act(() => {
      workspaceSelect.value = "specification";
      workspaceSelect.dispatchEvent(new Event("change", { bubbles: true }));
    });
    expect(workspaceSelect.value).toBe("specification");

    act(() => host.querySelector<HTMLButtonElement>('[aria-label="Save & return"]')!.click());
    expect(onSave).toHaveBeenCalledOnce();
    const saved = JSON.parse(onSave.mock.calls[0][0]);
    expect(saved.components[0].layers[0].renderer.type).toBe("uniqueValue");
    expect(saved.components[0].layers[0].interaction).toMatchObject({
      internalMode: "highlight",
      internalScope: "all",
      externalMode: "selection",
    });
  });
});
