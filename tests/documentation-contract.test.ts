import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (path: string) => readFileSync(resolve(process.cwd(), path), "utf8");
const documentation = ["README.md", "docs/user-guide.md", "docs/map-services.md", "docs/hyperpbi-spec-reference.md", "docs/ai-authoring.md", "docs/interactions.md", "docs/security.md", "docs/data-model.md", "docs/hyperpbi-ai-skill.md"].map(read).join("\n");

describe("map documentation contract", () => {
    it("documents Values-only, per-layer datasets, flattened data, and Map Studio", () => {
        for (const phrase of ["single Values", "source.bindings", "layer.dataset", "one flattened", "Map Studio", "layer groups", "bookmarks", "schema/runtime capability status"]) expect(documentation.toLowerCase()).toContain(phrase.toLowerCase());
    });

    it("does not recommend removed fixed map roles or overclaim unsupported GIS scope", () => {
        expect(documentation).not.toMatch(/prefer (?:the )?dedicated (?:Power BI )?Map (?:Latitude|Geometry)/i);
        expect(documentation).not.toMatch(/complete (?:Esri )?(?:Web AppBuilder|Experience Builder) parity/i);
        expect(documentation).toContain("not a feature-editing");
        expect(documentation).toContain("Geocoding");
    });

    it("retains generated documentation markers", () => {
        expect(read("README.md")).toContain("<!-- component-summary:start -->");
        expect(read("docs/hyperpbi-component-catalog-reference.md")).toContain("<!-- GENERATED FILE.");
        const webCatalog = JSON.parse(read("apps/web/generated/component-catalog.json")) as {
            generated?: boolean;
            componentCount?: number;
        };
        expect(webCatalog.generated).toBe(true);
        expect(webCatalog.componentCount).toBeGreaterThan(0);
    });
});
