import { existsSync, readFileSync, readdirSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const read = (file: string) => readFileSync(resolve(process.cwd(), file), "utf8");
const layout = read("apps/web/app/layout.tsx");
const header = read("apps/web/components/SiteHeader.tsx");
const nextConfig = read("apps/web/next.config.mjs");
const island = read("apps/web/components/IslandRuntime.tsx");
const runtimeBuildConfig = read("apps/web/runtime/vite.config.mts");
const appDirectory = resolve(process.cwd(), "apps/web/app");
const appSource = readTree(appDirectory).map((file) => readFileSync(file, "utf8")).join("\n");
const embeddedSurfaces = [
    "HomePage",
    "ProjectPage",
    "PlayPage",
    "MapGalleryPage",
].map((name) => read(`apps/playground/src/components/${name}.tsx`)).join("\n");
const embeddedRuntimeRoots = [
    embeddedSurfaces,
    read("src/render/HyperPbiRoot.tsx"),
    read("src/components/app/AppShell.tsx"),
    read("src/editor/SetupExperience.tsx"),
    read("src/editor/LandingPage.tsx"),
    read("src/editor/ai/AiPromptTab.tsx"),
    read("src/editor/map-studio/MapStudio.tsx"),
].join("\n");

describe("unified Next web application structural contract", () => {
    it("publishes every primary route under one shared layout", () => {
        expect(`${appSource}\n${embeddedRuntimeRoots}`.match(/<main\b/g)).toHaveLength(1);
        expect(embeddedRuntimeRoots).not.toMatch(/<\/?main\b/);
        expect(layout).toContain("<SiteHeader />");
        expect(layout).toContain("<SiteFooter />");
        for (const route of ["components", "playground", "examples", "docs"]) {
            expect(existsSync(resolve(process.cwd(), `apps/web/app/${route}/page.tsx`))).toBe(true);
            expect(header).toContain(`/${route}`);
        }
    });
    it("mounts the existing Preact runtime as a browser-only island", () => {
        expect(island).toContain('"use client"');
        expect(island).toContain("/runtime/hyperpbi-island.js");
        expect(island).toContain("/runtime/hyperpbi-island.css");
        expect(island).toContain("data-runtime-mounted");
        expect(island).toContain("runtime.mount");
        expect(runtimeBuildConfig).toContain('"process.env.NODE_ENV": JSON.stringify("production")');
        expect(runtimeBuildConfig).toContain('prefix: ".runtime-island__host"');
    });
    it("redirects legacy URLs instead of shipping parallel HTML applications", () => {
        expect(existsSync(resolve(process.cwd(), "index.html"))).toBe(false);
        expect(existsSync(resolve(process.cwd(), "hyperpbi-component-catalog-reference.html"))).toBe(false);
        expect(nextConfig).toContain('source: "/index.html"');
        expect(nextConfig).toContain('source: "/hyperpbi-component-catalog-reference.html"');
        expect(nextConfig).toContain('destination: "/components"');
    });
});

function readTree(directory: string): string[] {
    return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
        const target = resolve(directory, entry.name);
        if (entry.isDirectory()) return readTree(target);
        return entry.name.endsWith(".tsx") ? [target] : [];
    });
}
