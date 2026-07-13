import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const html = readFileSync(resolve(process.cwd(), "index.html"), "utf8");
const visualLanding = readFileSync(resolve(process.cwd(), "src/editor/LandingPage.tsx"), "utf8");
const setupExperience = readFileSync(resolve(process.cwd(), "src/editor/SetupExperience.tsx"), "utf8");

describe("product landing page", () => {
    it("positions the complete end-user product story", () => {
        for (const text of ["Build, inspect, and evolve", "AI-assisted JSON", "Permanent Visual Inspector", "Declarative SVG", "Leaflet and ArcGIS maps", "Core", "Maps"]) expect(html).toContain(text);
    });
    it("is GitHub Pages-ready without CDN dependencies or fake controls", () => {
        expect(html).toContain("<!doctype html>");
        expect(html).not.toMatch(/<script[^>]+src=/i);
        expect(html).not.toMatch(/<link[^>]+stylesheet/i);
        expect(html).not.toContain("<button");
    });
    it("presents Inspector, SVG, and map capabilities accurately", () => {
        for (const text of ["Inspect preview", "canonical authoring path", "invalid edit keeps the last valid", "bounded repeat", "No user JavaScript", "Map Latitude", "current visual-query aggregation", "Geocoder default is <code>none</code>"]) expect(html).toContain(text);
    });
    it("shows linked product attribution in both visual entry screens", () => {
        for (const source of [visualLanding, setupExperience]) {
            expect(source).toContain("Designed, Developed and Maintained by H.Nguyen - WWO");
            expect(source).toContain("https://austinwin.github.io/hyperpbi");
            expect(source).toContain('target="_blank"');
            expect(source).toContain('rel="noreferrer"');
        }
    });
});
