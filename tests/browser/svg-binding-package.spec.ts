import { readFile, readdir } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { readZipEntries } from "../../scripts/package-profile-utils.mjs";
import { parseCsvRows } from "../../src/data/fileImport";

test.skip(process.env.HYPERPBI_TEST_PACKAGES !== "1", "Build the PBIVIZ profiles and set HYPERPBI_TEST_PACKAGES=1.");

for (const profile of ["core", "maps"]) {
    test(`${profile} PBIVIZ renders SVG from filtered Power BI DataViews`, async ({ page }) => {
        const folder = "examples/dashboards/station-schematics";
        const [specification, csv, archives] = await Promise.all([
            readFile(`${folder}/specification.json`, "utf8"),
            readFile(`${folder}/StationSchematics.csv`, "utf8"),
            readdir("dist"),
        ]);
        const archive = archives.find(name => name.endsWith(`-${profile}.pbiviz`));
        expect(archive).toBeDefined();
        const entries = await readZipEntries(`dist/${archive}`);
        const manifest = JSON.parse([...entries].find(([path]) => path.endsWith(".pbiviz.json"))![1].toString("utf8"));
        const [headers, ...rows] = parseCsvRows(csv);
        const columns = [0, 2].map((position, index) => ({
            displayName: headers[position], index, queryName: "StationSchematics." + headers[position],
            roles: { values: true }, isMeasure: false, type: { text: true },
        }));
        const errors: string[] = [];
        const requests: string[] = [];
        page.on("pageerror", error => errors.push(error.message));
        page.on("request", request => requests.push(request.url()));
        await page.context().setOffline(true);
        await page.setContent('<div id="host" style="width:800px;height:420px"></div>');
        await page.addStyleTag({ content: manifest.content.css });
        await page.evaluate(() => Object.assign(window, { powerbi: {} }));
        await page.addScriptTag({ content: manifest.content.js });
        await page.evaluate(({ guid, columns, specification }) => {
            type Visual = { update(options: unknown): void };
            const browser = window as unknown as {
                powerbi: { visuals: { plugins: Record<string, { create(options: unknown): Visual }> } };
                updateSchematic(rows: (string | null)[][], width: number): void;
                schematicParses: number;
            };
            browser.schematicParses = 0;
            const parse = DOMParser.prototype.parseFromString;
            DOMParser.prototype.parseFromString = function (input, type) {
                if (type === "image/svg+xml") browser.schematicParses++;
                return parse.call(this, input, type);
            };
            const element = document.querySelector<HTMLElement>("#host")!;
            const visual = browser.powerbi.visuals.plugins[guid].create({
                element,
                host: {
                    hostCapabilities: { allowInteractions: true },
                    createSelectionManager: () => ({ clear: async () => [], select: async () => [] }),
                    createSelectionIdBuilder: () => ({
                        withTable: (_table: unknown, index: number) => ({ createSelectionId: () => ({ getKey: () => "row-" + index }) }),
                    }),
                },
            });
            browser.updateSchematic = (rows, width) => {
                element.style.width = width + "px";
                visual.update({
                    type: 2, viewport: { width, height: 420 },
                    dataViews: [{ metadata: { columns, objects: { hyperpbiState: { specification } } }, table: { columns, rows } }],
                });
            };
        }, { guid: manifest.visual.guid, columns, specification });

        const update = (facility?: string, width = 800) => page.evaluate(({ rows, width }) => {
            (window as unknown as { updateSchematic(rows: (string | null)[][], width: number): void }).updateSchematic(rows, width);
        }, { rows: rows.filter(row => !facility || row[0] === facility).map(row => [row[0], row[2] || null]), width });
        const svg = page.locator(".hp-svg-markup-host > svg");
        const prompt = page.getByText("Select one facility to view its process schematic.");
        await update();
        await expect(prompt).toBeVisible();
        await update("INT-01");
        await expect(svg.locator("text").filter({ hasText: "P-101 · Running" })).toBeVisible();
        await expect(svg).toHaveAttribute("viewBox", "0 0 640 300");
        await expect(svg).toHaveAttribute("preserveAspectRatio", "xMidYMid meet");
        const path = svg.locator('path[id$="-flow"]');
        const marker = await svg.locator("marker").getAttribute("id");
        const gradient = await svg.locator("linearGradient").getAttribute("id");
        await expect(svg.locator("path[marker-end]")).toHaveAttribute("marker-end", `url(#${marker})`);
        await expect(svg.locator('rect[fill^="url"]').first()).toHaveAttribute("fill", `url(#${gradient})`);
        await expect.poll(() => path.evaluate(element => element.getAnimations().length)).toBe(1);
        expect(await path.evaluate(element => {
            const animation = element.getAnimations()[0];
            animation.pause();
            animation.currentTime = 600;
            return parseFloat(getComputedStyle(element).strokeDashoffset);
        })).toBeCloseTo(9, 1);
        await page.emulateMedia({ reducedMotion: "reduce" });
        await expect.poll(() => path.evaluate(element => element.getAnimations().length)).toBe(0);

        const original = await svg.elementHandle();
        const parseCount = () => page.evaluate(() => (window as unknown as { schematicParses: number }).schematicParses);
        const parses = await parseCount();
        expect(parses).toBeGreaterThan(0);
        await update("INT-01", 340);
        expect(await svg.evaluate((element, previous) => element === previous, original)).toBe(true);
        expect(await parseCount()).toBe(parses);
        const fit = await svg.evaluate((element: SVGSVGElement) => {
            const box = element.getBoundingClientRect();
            const matrix = element.getScreenCTM()!;
            return { width: box.width, height: box.height, scaleX: matrix.a, scaleY: matrix.d };
        });
        expect(fit.width).toBeLessThanOrEqual(340);
        expect(fit.height).toBeGreaterThan(200);
        expect(fit.scaleX).toBeGreaterThan(0);
        expect(fit.scaleX).toBeCloseTo(fit.scaleY, 6);

        await update("BST-02");
        await expect(svg.locator("text").filter({ hasText: "P-202 · Standby" })).toBeVisible();
        await expect(svg).toHaveAttribute("viewBox", "0 0 640 240");
        for (const [key, message] of [
            ["MISS-03", "No SVG schematic is available"],
            ["BAD-04", "Raw SVG could not be parsed"],
            ["CON-05", "Multiple different schematics"],
        ]) {
            await update(key);
            await expect(page.getByRole("alert").filter({ hasText: message })).toBeVisible();
            await expect(svg).toHaveCount(0);
        }
        await update("no matching station");
        await expect(prompt).toBeVisible();
        await update("INT-01");
        await expect(svg.locator("linearGradient")).toHaveAttribute("id", gradient!);
        await expect(svg.locator("marker")).toHaveAttribute("id", marker!);
        expect(errors).toEqual([]);
        expect(requests).toEqual([]);
    });
}
