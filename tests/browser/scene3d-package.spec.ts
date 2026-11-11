import { readFile, readdir } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";
import { readZipEntries } from "../../scripts/package-profile-utils.mjs";
import { parseCsvRows } from "../../src/data/fileImport";
import { denseScene3d, embeddedSceneTestModels, nearPowerBiTextLimit } from "../fixtures/denseScene3d";
import { glStats, monitorWebGl, verifyMultiStationExplorer } from "./support/scene3dBrowser";

test.skip(process.env.HYPERPBI_TEST_PACKAGES !== "1", "Build both PBIVIZ profiles and set HYPERPBI_TEST_PACKAGES=1.");
test.use({ launchOptions: { args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] }, viewport: { width: 1400, height: 920 } });

async function mountVisual(page: Page, profile: string, specification: string, configuration: string, names: string[], values: (string | number | null)[][]) {
    const archive = (await readdir("dist")).find(name => name.endsWith(`-${profile}.pbiviz`));
    expect(archive).toBeDefined();
    const entries = await readZipEntries(`dist/${archive}`);
    const manifest = JSON.parse([...entries].find(([path]) => path.endsWith(".pbiviz.json"))![1].toString("utf8"));
    const columns = names.map((displayName, index) => ({
        displayName, index, queryName: "StationData." + displayName, roles: { values: true }, isMeasure: false,
        type: values.some(row => typeof row[index] === "number") ? { numeric: true } : { text: true },
    }));
    await page.addInitScript(monitorWebGl);
    await page.goto("about:blank");
    await page.setContent('<div id="host" style="width:100%;height:900px"></div>');
    await page.addStyleTag({ content: manifest.content.css });
    await page.evaluate(() => Object.assign(window, { powerbi: {} }));
    await page.addScriptTag({ content: manifest.content.js });
    const errors = await page.evaluate(({ guid, specification, configuration, columns, rows }) => {
        type Identity = { getKey(): string };
        const sent: string[] = [];
        const host = {
            hostCapabilities: { allowInteractions: true },
            createSelectionManager: () => ({
                select: async (ids: Identity[]) => { sent.splice(0, sent.length, ...ids.map(identity => identity.getKey())); return ids; },
                clear: async () => { sent.length = 0; },
            }),
            createSelectionIdBuilder: () => ({
                withTable(_table: unknown, index: number) {
                    return { createSelectionId: () => ({ getKey: () => "host-row-" + index }) };
                },
            }),
        };
        const visual = (window as unknown as {
            powerbi: { visuals: { plugins: Record<string, { create(options: unknown): {
                update(options: unknown): void;
                parseSpecification?(text: string): { errors: string[] };
            } }> } };
        }).powerbi.visuals.plugins[guid].create({ element: document.querySelector("#host"), host });
        visual.update({
            type: 2, viewport: { width: 1380, height: 900 },
            dataViews: [{ metadata: { columns, objects: { hyperpbiState: { specification, configuration } } }, table: { columns, rows } }],
        });
        Object.assign(window, { sceneHostSelections: sent });
        return visual.parseSpecification?.(specification).errors ?? [];
    }, { guid: manifest.visual.guid, specification, configuration, columns, rows: values });
    expect(errors).toEqual([]);
}

for (const profile of ["core", "maps"]) {
    test(`${profile} PBIVIZ switches the gallery's stations and filters independent readings`, async ({ page }) => {
        const folder = "examples/dashboards/multi-station-3d-explorer/";
        const [specification, configuration, csv] = await Promise.all(["specification.json", "runtime.json", "data.csv"].map(name => readFile(folder + name, "utf8")));
        const [headers, ...rows] = parseCsvRows(csv);
        const map = JSON.parse(specification);
        map.components.find((component: { id: string }) => component.id === "station_map").interaction.externalMode = "selection";
        const numeric = new Set(["latitude", "longitude", "day", "pumpagemgd", "rpm", "levelpct", "flowgpm"]);
        const errors: string[] = [];
        page.on("pageerror", error => errors.push(error.message));
        await mountVisual(page, profile, JSON.stringify(map), configuration, headers,
            rows.map(row => row.map((value, index) => value === "" ? null : numeric.has(headers[index]) ? Number(value) : value)));
        await verifyMultiStationExplorer(page);
        const repumpIndex = rows.findIndex(row => row[headers.indexOf("recordtype")] === "Scene" && row[headers.indexOf("stationid")] === "RP-001");
        await expect.poll(() => page.evaluate(() => (window as unknown as { sceneHostSelections: string[] }).sceneHostSelections)).toEqual([`host-row-${repumpIndex}`]);
        expect(errors).toEqual([]);
    });
}

test("compiled Direct JSON visual renders every object kind at the scene limit", async ({ page }) => {
    const definition = denseScene3d(126);
    definition.objects.push(...embeddedSceneTestModels());
    const specification = JSON.stringify({ version: "2.0", components: [{ type: "scene3d", id: "viewer", ...definition }] });
    await mountVisual(page, "core", specification, "", ["category"], [["Static fixture"]]);
    const scene = page.locator(".hp-component[data-hp-id=viewer]");
    await expect(scene.locator("canvas")).toBeVisible({ timeout: 45_000 });
    await expect(scene.locator(".hp-scene3d-object-list button")).toHaveCount(128);
    await expect(scene.locator(".hp-scene3d-labels button").filter({ hasText: "binary_model" })).toBeVisible();
    await expect(scene.locator(".hp-scene3d-model-error")).toHaveCount(0);
});

test("compiled visual renders 128 objects, releases resources during switching, and pauses offscreen", async ({ page }, testInfo) => {
    const dense = nearPowerBiTextLimit();
    expect(dense).toHaveLength(32_000);
    const flowing = JSON.stringify({
        objects: [
            { id: "water", kind: "pipe", flowKey: "flow" },
            { id: "asset1", kind: "tank", label: "Switch tank", selectable: true, animations: [{ kind: "rotate", axis: "y", rpm: 8 }] },
        ],
        objectIdField: "assetid", flowField: "rate", shadows: false,
    });
    const specification = JSON.stringify({
        version: "2.0", components: [
            { type: "select", id: "station", label: "Station", field: "stationid", defaultValue: "Dense",
                interaction: { field: "stationid", stateKey: "selectedStation", internalMode: "none", externalMode: "none" } },
            { type: "scene3d", id: "viewer", height: 510, objects: [{ id: "original", kind: "pump", label: "Direct pump", selectable: true }],
                sceneBinding: { mode: "data", keyField: "stationid", sceneField: "scenejson", selectedKeyState: "selectedStation" } },
        ],
    });
    const start = Date.now();
    await mountVisual(page, "core", specification, "", ["stationid", "scenejson", "assetid", "rate"], [
        ["Dense", dense, null, null], ["Flowing", flowing, "flow", 1200], ["Truncated", dense.slice(0, -3), null, null],
        ["Over limit", JSON.stringify(denseScene3d(129)), null, null],
    ]);
    const scene = page.locator(".hp-component[data-hp-id=viewer]");
    const canvas = scene.locator("canvas");
    const equipment = scene.locator(".hp-scene3d-object-list");
    const station = page.getByRole("combobox", { name: "Station", exact: true });
    await expect(equipment.getByRole("button")).toHaveCount(128);
    await expect(equipment.getByRole("button").first()).toContainText('Asset 1 · "North" \\ Section');
    await expect(scene.getByRole("button", { name: "Direct pump" })).toHaveCount(0);
    await expect(canvas).toBeVisible({ timeout: 45_000 });
    await expect.poll(async () => (await glStats(page)).draws).toBeGreaterThan(128);
    const firstFrameMs = Date.now() - start;
    const initial = await glStats(page);
    expect(initial.live).toBeLessThan(100);
    await expect(scene.locator(".hp-scene3d-labels button").first()).toBeVisible();
    await equipment.getByRole("button").last().click();
    await expect(equipment.getByRole("button").last()).toHaveAttribute("aria-pressed", "true");

    await station.selectOption({ label: "Truncated" });
    await expect(scene.getByRole("status")).toContainText("invalid or truncated");
    await expect(canvas).toBeHidden();
    await station.selectOption({ label: "Over limit" });
    await expect(scene.getByRole("status")).toContainText("128 objects");
    async function selectAndDraw(label: string, expectedObjects: number) {
        const { draws } = await glStats(page);
        await station.selectOption({ label });
        await expect(equipment.getByRole("button")).toHaveCount(expectedObjects);
        await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
        await expect.poll(async () => (await glStats(page)).draws).toBeGreaterThan(draws);
        return glStats(page);
    }
    const flowingBaseline = await selectAndDraw("Flowing", 1);
    await expect(equipment.getByRole("button", { name: "Switch tank" })).toHaveAttribute("aria-pressed", "false");
    const denseBaseline = await selectAndDraw("Dense", 128);
    expect(denseBaseline.disposals).toBeGreaterThan(flowingBaseline.disposals);
    for (let cycle = 0; cycle < 5; cycle++) {
        expect((await selectAndDraw("Flowing", 1)).live).toBe(flowingBaseline.live);
        expect((await selectAndDraw("Dense", 128)).live).toBe(denseBaseline.live);
    }
    await selectAndDraw("Flowing", 1);
    await canvas.scrollIntoViewIfNeeded();
    await expect(canvas).toBeInViewport();
    const beforeHide = await glStats(page);
    expect(beforeHide.canvases).toBe(1);
    await expect.poll(async () => (await glStats(page)).draws).toBeGreaterThan(beforeHide.draws);
    await scene.evaluate(element => { element.style.marginTop = "200vh"; window.scrollTo(0, 0); });
    // Give IntersectionObserver and any pending frame time to settle, then check idle.
    await page.waitForTimeout(300);
    const offscreen = await glStats(page);
    await expect(canvas).not.toBeInViewport();
    await page.waitForTimeout(300);
    expect((await glStats(page)).draws).toBe(offscreen.draws);
    await testInfo.attach("dense-scene-measurements.json", { body: JSON.stringify({ firstFrameMs, initial, flowingBaseline, denseBaseline, beforeHide, offscreen }), contentType: "application/json" });
});
