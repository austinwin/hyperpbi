import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { render } from "preact";
import { act } from "preact/test-utils";
import { describe, expect, it, vi } from "vitest";
import { defaultConfigJson } from "../src/config/hyperpbiConfig";
import { HyperPbiStudio } from "../src/editor/HyperPbiStudio";
import { toRuntimeSettings, VisualFormattingSettingsModel } from "../src/settings";
import { mapStudioData, mapStudioSpecification } from "./map-studio-fixture";

describe("Studio responsive workbench", () => {
  it("supports explicit editor and preview focus without losing the selected workspace", () => {
    const host = document.createElement("div");
    act(() => render(
      <HyperPbiStudio
        instanceId="responsive-studio"
        data={mapStudioData}
        settings={toRuntimeSettings(new VisualFormattingSettingsModel())}
        initialSpecification={mapStudioSpecification}
        initialConfiguration={defaultConfigJson}
        initialEditorTab="mapStudio"
        initialLayout={JSON.stringify({ editorPercent: 50, bottomHeight: 200, bottomOpen: false, advanced: true })}
        onSave={vi.fn()}
      />,
      host,
    ));
    const editor = Array.from(host.querySelectorAll<HTMLButtonElement>("button")).find((button) => button.textContent === "Focus editor")!;
    act(() => editor.click());
    expect(host.querySelector(".hp-studio-workbench")?.classList.contains("is-focus-editor")).toBe(true);
    expect(host.querySelector<HTMLSelectElement>(".hp-studio-workspace-select select")?.value).toBe("mapStudio");
    const preview = Array.from(host.querySelectorAll<HTMLButtonElement>("button")).find((button) => button.textContent === "Focus preview")!;
    act(() => preview.click());
    expect(host.querySelector(".hp-studio-workbench")?.classList.contains("is-focus-preview")).toBe(true);
  });

  it("uses container breakpoints to stack a right preview and swap to the workspace selector", () => {
    const css = readFileSync(resolve(process.cwd(), "src/styles/hyperpbi-studio.css"), "utf8");
    expect(css).toContain("@container hp-studio (max-width: 820px)");
    expect(css).toContain(".hp-preview-right .hp-studio-workbench:not(.is-focus-editor):not(.is-focus-preview)");
    expect(css).toContain("grid-template-rows: minmax(260px");
    expect(css).toContain(".hp-studio-workspace-select");
    expect(css).toContain("overflow: hidden");
  });
});
