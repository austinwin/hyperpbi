import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const home = readFileSync(resolve(process.cwd(), "apps/web/app/page.tsx"), "utf8");
const layout = readFileSync(resolve(process.cwd(), "apps/web/app/layout.tsx"), "utf8");
const header = readFileSync(resolve(process.cwd(), "apps/web/components/SiteHeader.tsx"), "utf8");
const visualLanding = readFileSync(resolve(process.cwd(), "src/editor/LandingPage.tsx"), "utf8");
const setupExperience = readFileSync(resolve(process.cwd(), "src/editor/SetupExperience.tsx"), "utf8");
const packageMetadata = JSON.parse(readFileSync(resolve(process.cwd(), "package.json"), "utf8"));
const visualMetadata = JSON.parse(readFileSync(resolve(process.cwd(), "pbiviz.json"), "utf8"));

describe("product landing page", () => {
    it("positions the complete portable product story", () => {
        for (const text of ["Build once.", "Run everywhere.", "Power BI", "browser", "Author visually or with AI", "No user JavaScript", "Operational maps"]) {
            expect(home).toContain(text);
        }
    });
    it("uses the unified Next.js shell for every product surface", () => {
        expect(layout).toContain("<SiteHeader />");
        expect(layout).toContain('<main id="main-content"');
        expect(layout).toContain("<SiteFooter />");
        for (const route of ["/components", "/playground", "/examples", "/docs"]) {
            expect(header).toContain(`href: "${route}"`);
        }
    });
    it("presents governed runtime and host behavior accurately", () => {
        const webStory = `${home}\n${readFileSync(resolve(process.cwd(), "apps/web/app/docs/page.tsx"), "utf8")}\n${readFileSync(resolve(process.cwd(), "docs/architecture.md"), "utf8")}`;
        for (const text of ["strict JSON", "same schema", "same validation", "one portable specification", "sanitized HTML", "safe SVG"]) {
            expect(webStory).toMatch(new RegExp(text, "i"));
        }
        expect(home).not.toMatch(/Dedicated Map Latitude|Dedicated Map Longitude/i);
    });
    it("shows linked product attribution in both visual entry screens", () => {
        for (const source of [visualLanding, setupExperience]) {
            expect(source).toContain("Designed, Developed and Maintained by H.Nguyen - WWO");
            expect(source).toContain("https://hyperpbi.com");
            expect(source).toContain('target="_blank"');
            expect(source).toContain('rel="noreferrer"');
        }
    });
    it("publishes the canonical website and source repository in product metadata", () => {
        expect(packageMetadata.homepage).toBe("https://hyperpbi.com");
        expect(packageMetadata.repository.url).toBe("https://github.com/austinwin/hyperpbi.git");
        expect(visualMetadata.visual.supportUrl).toBe("https://hyperpbi.com");
        expect(visualMetadata.visual.gitHubUrl).toBe("https://github.com/austinwin/hyperpbi");
        expect(visualMetadata.author.email).toBe("support@hyperpbi.com");
        expect(layout).toContain('metadataBase: new URL("https://hyperpbi.com")');
        expect(layout).toContain('url: "/og.png"');
        expect(header).toContain("https://github.com/austinwin/hyperpbi");
    });
});
