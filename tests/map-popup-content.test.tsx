import { render } from "preact";
import { act } from "preact/test-utils";
import { describe, expect, it, vi } from "vitest";
import { MapPopupContent } from "../src/components/maps/MapPopupContent";
import { validatePopupContent } from "../src/maps/popup/validatePopupContent";
import { popupConditionMatches, popupContentUrl, type MapPopupContentBlock } from "../src/maps/popup/mapPopupContent";
import { collectArcGisQueryFields } from "../src/maps/arcgis/mapArcGisQueryFields";
import { specificationFieldReferences } from "../src/fields/specificationFieldReferences";
import { resolveSafeTemplate } from "../src/components/maps/ResolvedMapPopup";
import type { ResolvedMapFeature } from "../src/maps/model/resolvedMapTypes";

const feature: ResolvedMapFeature = { id: "A", layerId: "sites", geometry: null, geometryType: "point", lat: 0, lon: 0, serviceAttributes: { name: '<img onerror="alert(1)">', photo: "javascript:alert(1)", status: "Open", date: "2026-11-05", value: 12.345 }, joinedAttributes: { total: 42 }, powerBiAttributes: { SiteID: "A" }, powerBiRowIndices: [0], powerBiRowKeys: ["a"], selected: false };
describe("structured popup content", () => {
    it("renders formatted values, conditions, charts and safe actions without executing field markup", () => {
        const blocks: MapPopupContentBlock[] = [
            { id: "title", type: "text", text: "{{service.name}}", colorWhen: { field: "status", operator: "=", value: "Open", color: "#dc2626" } },
            { id: "number", type: "field", field: "value", label: "Capacity", decimals: 2, units: "MW" },
            { id: "date", type: "field", field: "date", dateFormat: "iso" },
            { id: "private", type: "section", label: "Hidden", when: { field: "status", operator: "=", value: "Closed" }, children: [{ id: "secret", type: "text", text: "Hidden content" }] },
            { id: "chart", type: "chart", series: [{ field: "total", fieldSource: "joined" }] },
            { id: "image", type: "image", url: "{{photo}}" },
            { id: "action", type: "button", label: "Notify", uiAction: { type: "showToast", message: "Selected" } },
        ];
        expect(validatePopupContent(blocks, "/popup")).toEqual([]);
        const host = document.createElement("div"), execute = vi.fn();
        act(() => render(<MapPopupContent blocks={blocks} feature={feature} executeAction={execute} />, host));
        expect(host.textContent).toContain('<img onerror="alert(1)">'); expect(host.querySelector("img")).toBeNull();
        expect(host.textContent).toContain("12.35"); expect(host.textContent).toContain("MW"); expect(host.textContent).toContain("2026-11-05");
        expect(host.textContent).not.toContain("Hidden content"); expect(host.querySelector("meter")?.value).toBe(42);
        act(() => host.querySelector("button")!.click()); expect(execute).toHaveBeenCalledWith({ type: "showToast", message: "Selected" }, expect.anything());
        expect(host.querySelector("p")?.style.color).toBe("rgb(220, 38, 38)"); act(() => render(null, host));
        execute.mockClear();
        act(() => render(<MapPopupContent blocks={blocks} feature={feature} executeAction={execute} actionsEnabled={false} />, host));
        expect(host.querySelector("button")?.disabled).toBe(true);
        act(() => host.querySelector("button")!.click());
        expect(execute).not.toHaveBeenCalled();
        act(() => render(null, host));
    });
    it("rejects unsupported code, duplicate block IDs, excessive precision and unsafe URLs", () => {
        expect(validatePopupContent([{ id: "a", type: "text", onclick: "bad()" }, { id: "a", type: "field", decimals: 99 }], "/popup").length).toBeGreaterThan(0);
        expect(popupContentUrl("javascript:alert(1)")).toBeUndefined(); expect(popupContentUrl("https://user:secret@example.com")).toBeUndefined();
        expect(popupContentUrl("https://miniup.io/image.png")).toBe("https://miniup.io/image.png");
        expect(popupConditionMatches({ field: "value", operator: ">", value: 10 }, feature)).toBe(true);
    });
    it("keeps popup service fields separate from report and joined fields in request planning", () => {
        const source = { type: "arcgisFeature" as const, url: "https://services.arcgis.com/a/FeatureServer/0" };
        const layer = { id: "sites", name: "Sites", source, popup: { mode: "custom", content: [{ id: "data", type: "field" as const, field: "SiteID", fieldSource: "powerbi" as const }, { id: "text", type: "text" as const, text: "{{service.status}} / {{joined.total}}", fieldSource: "joined" as const }, { id: "chart", type: "chart" as const, series: [{ field: "value", fieldSource: "service" as const }] }] } };
        const fields = collectArcGisQueryFields(layer, source);
        expect(fields).toContain("status"); expect(fields).toContain("value"); expect(fields).not.toContain("total"); expect(fields).not.toContain("SiteID");
        const references = specificationFieldReferences({ version: "2.0", components: [{ type: "map", id: "map", layers: [layer] }] });
        expect(references).toEqual(expect.arrayContaining([expect.objectContaining({ reference: "SiteID", source: "powerbi" }), expect.objectContaining({ reference: "status", source: "service" }), expect.objectContaining({ reference: "total", source: "joined" })]));
        expect(resolveSafeTemplate("{{service.status}} / {{joined.total}}", feature)).toBe("Open / 42");
    });
});
