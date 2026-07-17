import { render } from "preact";
import { act } from "preact/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { defaultConfigJson } from "../src/config/hyperpbiConfig";
import { HyperPbiStudio } from "../src/editor/HyperPbiStudio";
import {
  toRuntimeSettings,
  VisualFormattingSettingsModel,
} from "../src/settings";
import { mapStudioData, mapStudioSpecification } from "./map-studio-fixture";

const mountedHosts: HTMLElement[] = [];

afterEach(() => {
  for (const host of mountedHosts.splice(0)) {
    act(() => render(null, host));
  }
  document.body.replaceChildren();
});

function mountStudio(onLayoutChange = vi.fn()) {
  const host = document.createElement("div");
  document.body.append(host);
  mountedHosts.push(host);
  act(() =>
    render(
      <HyperPbiStudio
        instanceId="responsive-studio"
        data={mapStudioData}
        settings={toRuntimeSettings(new VisualFormattingSettingsModel())}
        initialSpecification={mapStudioSpecification}
        initialConfiguration={defaultConfigJson}
        initialEditorTab="mapStudio"
        initialLayout={JSON.stringify({
          editorPercent: 50,
          bottomHeight: 200,
          bottomOpen: false,
          advanced: true,
        })}
        onLayoutChange={onLayoutChange}
        onSave={vi.fn()}
      />,
      host,
    ),
  );
  return { host, onLayoutChange };
}

describe("Studio responsive workbench state", () => {
  it("offers explicit Split, Editor, and Preview views without losing the workspace", () => {
    const { host } = mountStudio();
    const group = host.querySelector<HTMLElement>(
      '[role="group"][aria-label="Workbench view"]',
    )!;
    const buttons = Array.from(group.querySelectorAll<HTMLButtonElement>("button"));

    expect(buttons.map((button) => button.textContent)).toEqual([
      "Split",
      "Editor",
      "Preview",
    ]);
    expect(buttons.map((button) => button.getAttribute("aria-pressed"))).toEqual([
      "true",
      "false",
      "false",
    ]);

    act(() => buttons[1].click());
    expect(host.querySelector(".hp-studio-workbench")?.classList).toContain(
      "is-focus-editor",
    );
    expect(buttons[1].getAttribute("aria-pressed")).toBe("true");

    act(() => buttons[0].click());
    expect(host.querySelector(".hp-studio-workbench")?.classList).toContain(
      "is-focus-both",
    );

    act(() => buttons[2].click());
    expect(host.querySelector(".hp-studio-workbench")?.classList).toContain(
      "is-focus-preview",
    );
    expect(
      host.querySelector<HTMLSelectElement>(
        ".hp-studio-workspace-select select",
      )?.value,
    ).toBe("mapStudio");
  });

  it("persists simple and advanced mode choices through the layout callback", () => {
    const { host, onLayoutChange } = mountStudio();
    const mode = () =>
      host.querySelector<HTMLButtonElement>(".hp-advanced-toggle")!;

    act(() => mode().click());
    expect(JSON.parse(onLayoutChange.mock.calls.at(-1)![0])).toMatchObject({
      advanced: false,
      editorPercent: 50,
      bottomHeight: 200,
    });
    expect(
      host.querySelector<HTMLSelectElement>(
        ".hp-studio-workspace-select select",
      )?.value,
    ).toBe("ai");

    act(() => mode().click());
    expect(JSON.parse(onLayoutChange.mock.calls.at(-1)![0])).toMatchObject({
      advanced: true,
    });
  });
});
