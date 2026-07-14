import { render } from "preact";
import { act } from "preact/test-utils";
import { describe, expect, it, vi } from "vitest";
import { MapStudio } from "../src/editor/map-studio/MapStudio";
import { mapStudioData, mapStudioSpecification } from "./map-studio-fixture";
import type { PreparedAuthoringData } from "../src/editor/prepareAuthoringData";

const result = (
  accepted: boolean,
  marker: string,
): PreparedAuthoringData => ({
  specification: accepted ? JSON.parse(mapStudioSpecification) : undefined,
  config: accepted ? ({ security: { htmlMode: "trusted" }, marker } as never) : undefined,
  aliases: { amount: "currentAmountAlias" },
  diagnostics: [],
  errors: accepted ? [] : [`${marker}: provider access denied`],
  warnings: accepted ? [`${marker}: custom security preserved`] : [],
});

describe("Map Studio current Runtime Config validation", () => {
  it("rejects through the parent validator, preserves the last JSON, and never falls back", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const onChange = vi.fn();
    const validateCandidate = vi.fn(() => result(false, "runtime-v1"));
    act(() => render(
      <MapStudio
        json={mapStudioSpecification}
        data={mapStudioData}
        selectedComponentId="operations"
        prepared={result(true, "prepared")}
        validateCandidate={validateCandidate}
        onChange={onChange}
      />,
      host,
    ));
    const name = host.querySelector('[aria-label="Layer name"]') as HTMLInputElement;
    act(() => {
      name.focus();
      name.value = "Rejected";
      name.dispatchEvent(new Event("input", { bubbles: true }));
      name.blur();
    });
    expect(validateCandidate).toHaveBeenCalledTimes(1);
    expect(validateCandidate.mock.calls[0][0]).toContain('"name": "Rejected"');
    expect(onChange).not.toHaveBeenCalled();
    expect(host.textContent).toContain("runtime-v1: provider access denied");
  });

  it("uses a newly supplied parent validator on the next transaction", () => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const onChange = vi.fn();
    let runtimeVersion = "runtime-v1";
    const validateCandidate = vi.fn(() => result(true, runtimeVersion));
    const view = () => (
      <MapStudio
        json={mapStudioSpecification}
        data={mapStudioData}
        selectedComponentId="operations"
        prepared={result(true, runtimeVersion)}
        validateCandidate={validateCandidate}
        onChange={onChange}
      />
    );
    act(() => render(view(), host));
    runtimeVersion = "runtime-v2";
    act(() => render(view(), host));
    const name = host.querySelector('[aria-label="Layer name"]') as HTMLInputElement;
    act(() => {
      name.focus();
      name.value = "Accepted";
      name.dispatchEvent(new Event("input", { bubbles: true }));
      name.blur();
    });
    expect(onChange).toHaveBeenCalledTimes(1);
    expect(host.textContent).toContain("runtime-v2: custom security preserved");
  });
});
