import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { JSDOM } from "jsdom";
import { describe, expect, it } from "vitest";

const html = readFileSync(resolve(process.cwd(), "index.html"), "utf8");
const document = new JSDOM(html).window.document;

describe("index.html structural contract", () => {
    it("has one main, one workflow, unique IDs, and no patch artifact", () => {
        expect(document.querySelectorAll("main")).toHaveLength(1);
        expect(document.querySelectorAll("#workflow")).toHaveLength(1);
        const ids = Array.from(document.querySelectorAll<HTMLElement>("[id]")).map(element => element.id);
        expect(new Set(ids).size).toBe(ids.length);
        expect(html).not.toMatch(/^\s*\+/m);
    });
    it("keeps prominent Inspector, SVG, and Maps sections inside main", () => {
        for (const id of ["inspector", "svg", "maps"]) {
            const section = document.getElementById(id);
            expect(section?.tagName).toBe("SECTION");
            expect(section?.closest("main")).not.toBeNull();
        }
    });
    it("resolves every internal navigation anchor and retains generator markers", () => {
        for (const anchor of Array.from(document.querySelectorAll<HTMLAnchorElement>('nav a[href^="#"]'))) expect(document.querySelector(anchor.getAttribute("href")!)).not.toBeNull();
        for (const marker of ["hero-component-count", "inventory-stats", "catalog-heading"]) expect(html).toContain(`<!-- ${marker}:start -->`);
    });
    it("uses a valid heading hierarchy and accurate geocoder wording", () => {
        const levels = Array.from(document.querySelectorAll("h1,h2,h3")).map(heading => Number(heading.tagName[1]));
        expect(levels[0]).toBe(1);
        for (let index = 1; index < levels.length; index += 1) expect(levels[index] - levels[index - 1]).toBeLessThanOrEqual(1);
        expect(html).toContain("Geocoder default is <code>none</code>");
        expect(html).toContain("user-triggered");
        expect(html).not.toMatch(/automatic geocod/i);
    });
});
