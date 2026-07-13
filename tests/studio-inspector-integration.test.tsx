import { h, render } from "preact";
import { act } from "preact/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { calculateAggregates } from "../src/data/aggregations";
import { normalizeMapBindings } from "../src/data/normalizeMapBindings";
import type { NormalizedData } from "../src/data/normalizeData";
import { HyperPbiStudio } from "../src/editor/HyperPbiStudio";
import { defaultConfigJson } from "../src/config/hyperpbiConfig";
import { toRuntimeSettings, VisualFormattingSettingsModel } from "../src/settings";

const rows = [{ revenue: 10, orders: 2 }];
const fields = {
    revenue: { key: "revenue", displayName: "Revenue", type: "measure" as const, kind: "measure" as const, dataType: "number" as const, roles: ["values"] },
    orders: { key: "orders", displayName: "Orders", type: "measure" as const, kind: "measure" as const, dataType: "number" as const, roles: ["values"] },
};
const data: NormalizedData = { rows, rowKeys: ["row-0"], fields, aggregates: calculateAggregates(rows), map: normalizeMapBindings(rows, fields) };
const settings = toRuntimeSettings(new VisualFormattingSettingsModel());

afterEach(() => document.body.replaceChildren());

describe("Studio Inspector integration", () => {
    it("selects the authoring pattern when a generated runtime child is clicked", () => {
        const specification = JSON.stringify({ version: "2.0", components: [{ type: "pattern", pattern: "kpi-row", id: "summary", fields: ["revenue", "orders"] }] });
        const host = document.createElement("div");
        act(() => render(<HyperPbiStudio
            instanceId="studio-owner"
            data={data}
            settings={settings}
            initialSpecification={specification}
            initialConfiguration={defaultConfigJson}
            initialLayout={JSON.stringify({ editorPercent: 38, bottomHeight: 210, bottomOpen: false, advanced: true })}
            onSave={vi.fn()}
        />, host));
        act(() => host.querySelector<HTMLButtonElement>(".hp-run-button")!.click());
        const inspect = Array.from(host.querySelectorAll<HTMLButtonElement>("button")).find(button => button.textContent === "Inspect preview")!;
        act(() => inspect.click());
        const generated = host.querySelector<HTMLElement>('[data-hp-id="summary--kpi-1"]')!;
        expect(generated.dataset.hpOwnerId).toBe("summary");
        act(() => generated.click());
        expect(host.querySelector(".hp-studio-preview")?.getAttribute("data-selected-component-id")).toBe("summary");
        expect(host.textContent).toContain("Inspector");
    });
});
