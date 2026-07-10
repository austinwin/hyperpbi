import { describe, expect, it, vi } from "vitest";
import {
    createResolvedTooltipElement,
    renderResolvedPopup,
    renderResolvedTooltip,
    resolveSafeTemplate,
} from "../src/components/maps/ResolvedMapPopup";
import type { ResolvedMapFeature, ResolvedMapPopup, ResolvedMapTooltip } from "../src/maps/model/resolvedMapTypes";

const feature: ResolvedMapFeature = {
    id: "feature-1", layerId: "assets", geometryType: "point", geometry: null,
    lat: 29.75, lon: -95.35, serviceObjectId: "OID-7",
    serviceAttributes: { NAME: "<img src=x onerror=alert(1)>", NULLABLE: null, VALUES: ["A", "B"], META: { safe: true }, COUNT: 1234.5 },
    powerBiAttributes: { NAME: "Power BI name", DATE: "2026-07-09" },
    joinedAttributes: { NAME: "Joined name" }, powerBiRowIndices: [4], powerBiRowKeys: ["row-4"], selected: false,
};

function popup(overrides: Partial<ResolvedMapPopup> = {}): ResolvedMapPopup {
    return { enabled: true, fields: [], actions: [], ...overrides };
}

describe("resolved map popup", () => {
    it("resolves tokens with merged precedence and safe null/array/object values", () => {
        expect(resolveSafeTemplate("{{NAME}} / {{NULLABLE}} / {{VALUES}} / {{META}}", feature))
            .toBe('Joined name / — / A, B / {"safe":true}');
        expect(resolveSafeTemplate("{{NAME}}", feature, "service")).toContain("<img");
    });

    it("renders structured field sources, formatting, nulls, arrays, and objects", () => {
        const rendered = renderResolvedPopup(popup({ fields: [
            { field: "NAME", fieldSource: "powerbi", label: "Power BI", display: "text" },
            { field: "COUNT", fieldSource: "service", label: "Count", format: "currency", display: "number" },
            { field: "NULLABLE", fieldSource: "service", label: "Missing", display: "text" },
            { field: "VALUES", fieldSource: "service", label: "Values", display: "text" },
            { field: "META", fieldSource: "service", label: "Metadata", display: "text" },
        ] }), feature);
        expect(rendered.element.textContent).toContain("Power BI name");
        expect(rendered.element.textContent).toContain("$1,234.50");
        expect(rendered.element.textContent).toContain("—");
        expect(rendered.element.textContent).toContain("A, B");
        expect(rendered.element.textContent).toContain('{"safe":true}');
        expect(rendered.element.textContent).not.toContain("[object Object]");
    });

    it("sanitizes popup HTML while inserting feature values as text", () => {
        const rendered = renderResolvedPopup(popup({ html: "<strong>{{NAME}}</strong><script>alert(1)</script>" }), feature);
        expect(rendered.element.querySelector("script")).toBeNull();
        expect(rendered.element.querySelector("img")).toBeNull();
        expect(rendered.element.textContent).toContain("Joined name");
    });

    it("executes safe actions and cleanup removes their listeners", () => {
        const executeAction = vi.fn();
        const rendered = renderResolvedPopup(popup({ actions: [{ id: "open", label: "Open" }] }), feature, { executeAction });
        const button = rendered.element.querySelector("button")!;
        button.click();
        expect(executeAction).toHaveBeenCalledWith(expect.objectContaining({ id: "open" }), feature, expect.any(Event));
        rendered.cleanup();
        button.click();
        expect(executeAction).toHaveBeenCalledTimes(1);
    });

    it("creates working action listeners again after popup reopen", () => {
        const executeAction = vi.fn();
        const definition = popup({ actions: [{ id: "open", label: "Open" }] });
        const first = renderResolvedPopup(definition, feature, { executeAction });
        first.element.querySelector("button")!.click();
        first.cleanup();
        const reopened = renderResolvedPopup(definition, feature, { executeAction });
        reopened.element.querySelector("button")!.click();
        expect(executeAction).toHaveBeenCalledTimes(2);
    });
});

describe("resolved map tooltip", () => {
    it("uses a tooltip template before configured fields", () => {
        const tooltip: ResolvedMapTooltip = { enabled: true, template: "Asset {{NAME}}", fields: [{ field: "COUNT", fieldSource: "service", display: "text" }] };
        expect(renderResolvedTooltip(feature, tooltip, "Assets")).toBe("Asset Joined name");
        expect(createResolvedTooltipElement(feature, tooltip).textContent).toBe("Asset Joined name");
    });

    it("uses field sources and formatting for tooltip fields", () => {
        const tooltip: ResolvedMapTooltip = { enabled: true, fields: [
            { field: "NAME", fieldSource: "powerbi", label: "Name", display: "text" },
            { field: "COUNT", fieldSource: "service", label: "Count", format: "integer", display: "number" },
            { field: "META", fieldSource: "service", label: "Meta", display: "text" },
        ] };
        const text = renderResolvedTooltip(feature, tooltip);
        expect(text).toContain("Name: Power BI name");
        expect(text).toContain("Count: 1,235");
        expect(text).toContain('Meta: {"safe":true}');
        expect(createResolvedTooltipElement(feature, tooltip).textContent).not.toContain("[object Object]");
    });
});
