import { mkdir, readdir, writeFile } from "node:fs/promises";
import { expect, test, type Page } from "@playwright/test";
import { readZipEntries } from "../../scripts/package-profile-utils.mjs";
import { defaultConfigJson } from "../../src/config/hyperpbiConfig";

interface Workload {
    total: number;
    requests: number;
    selections: number;
    builderCalls: number;
    mode: number;
    peakHeap: number;
    windowMs: number;
    completeMs?: number;
    configuration: string;
    refresh(rows: number, specification: string, rejectAfter?: number, omitEditMode?: boolean): void;
    edit(studio: boolean): void;
    destroy(): void;
}
declare global { interface Window { hpWorkload: Workload } }

const benchmark = process.env.HYPERPBI_BENCHMARK === "1";
test.use({ actionTimeout: 10_000, launchOptions: { args: ["--enable-precise-memory-info"] } });
test.skip(!benchmark && process.env.HYPERPBI_TEST_PACKAGES !== "1", "Build the Core PBIVIZ before running this host test.");

const tabsSpecification = JSON.stringify({
    version: "2.0",
    title: "Work order analytics",
    calculations: {
        fields: [{ key: "weighted_cost", type: "number", expression: { op: "*", args: [{ field: "orders_amount" }, { value: 2 }] } }],
        metrics: [{ key: "full_count", aggregation: "count" }],
    },
    data: {
        datasets: {
            districts: { source: "powerbi", groupBy: ["orders_district"], metrics: { totals: { op: "sum", field: "weighted_cost" } } },
        },
    },
    toolbar: [{ id: "filter", type: "searchBox", placeholder: "Filter work orders" }],
    components: [
        { id: "total", type: "metricGrid", metrics: [{ title: "Records", metric: "full_count", format: "integer" }] },
        {
            type: "tabs", id: "mainTabs", tabs: [
                { id: "analysis", title: "Analysis", children: [{ type: "barChart", id: "districts", dataset: "districts", category: "orders_district", measure: "totals", height: 180 }] },
                { id: "records", title: "Records", children: [{
                    type: "table", id: "records", title: "Records", columns: ["orders_workorder", "orders_status", "weighted_cost"],
                    pagination: false, search: true, interaction: { enabled: true, trigger: "click", internalMode: "highlight", internalScope: "self", externalMode: "selection", showSelector: true },
                }] },
                { id: "map", title: "Map", children: [{
                    type: "map", id: "locations", height: 250, basemap: { type: "none", visible: true },
                    layers: [{
                        id: "orders", name: "Work orders", performance: { maxFeatures: 200 },
                        source: { type: "powerbi", bindings: { latitude: "orders_northing", longitude: "orders_easting" } },
                        renderer: { type: "simple", symbol: { shape: "circle", radius: 3 } },
                    }],
                }] },
            ],
        },
    ],
});

async function mountVisual(page: Page, width: number, { directory = "dist", hostLatency = 0 } = {}) {
    const archive = (await readdir(directory)).find(name => name.endsWith("-core.pbiviz"));
    if (!archive) throw new Error("Build the Core PBIVIZ first.");
    const entries = await readZipEntries(`${directory}/${archive}`);
    const manifest = JSON.parse([...entries].find(([path]) => path.endsWith(".pbiviz.json"))![1].toString("utf8"));
    const windowRows: number = manifest.capabilities.dataViewMappings[0].table.rows.dataReductionAlgorithm.window.count;
    await page.setViewportSize({ width: 1280, height: 840 });
    await page.setContent('<div id="visual" style="width:1260px;height:810px"></div>');
    await page.addStyleTag({ content: manifest.content.css });
    await page.evaluate(() => Object.assign(window, { powerbi: {} }));
    await page.addScriptTag({ content: manifest.content.js });
    await page.evaluate(({ guid, width, configuration, windowRows, hostLatency }) => {
        const browser = window as unknown as { powerbi: { visuals: { plugins: Record<string, {
            create(options: unknown): { update(options: unknown): void; destroy(): void };
        }> } } };
        const element = document.querySelector<HTMLElement>("#visual")!;
        const layout = JSON.stringify({ advanced: true, bottomOpen: true, bottomHeight: 240, editorPercent: 40 });
        const names = ["WorkOrder", "Status", "District", "Amount", "Northing", "Easting"];
        const statuses = ["Open", "Ready", "Closed", "Scheduled", "Paused", "Pending", "Review"];
        const districts = Array.from({ length: 37 }, (_, index) => `District ${index + 1}`);
        const columns = Array.from({ length: width }, (_, index) => {
            const name = names[index] ?? `Field${index + 1}`;
            const numeric = index >= 3;
            return { displayName: name, queryName: `Orders.${name}`, index, roles: { values: true }, isMeasure: numeric, type: numeric ? { numeric: true } : { text: true } };
        });
        const viewport = { width: 1260, height: 810 };
        let dataStart = 0, revision = -1, activeSpecification = "", reject = Infinity, requestId = 0, queryStart = 0;
        const state: Workload = {
            total: 0, requests: 0, selections: 0, builderCalls: 0, mode: 0, peakHeap: 0, windowMs: 0, configuration,
            refresh(rows, specification, rejectAfter, omitEditMode) {
                queryStart = performance.now();
                requestId++;
                revision++;
                dataStart = 0;
                state.total = rows;
                state.requests = 0;
                state.windowMs = 0;
                state.completeMs = undefined;
                reject = rejectAfter ?? Infinity;
                activeSpecification = specification;
                send(false, omitEditMode);
            },
            edit(studio) {
                state.mode = studio ? 1 : 0;
                visual.update({ type: 8, editMode: state.mode, viewport, dataViews: [{ metadata: metadata(false) }] });
            },
            destroy() { requestId++; visual.destroy(); },
        };
        const metadata = (more: boolean) => ({
            columns: state.total === 0 ? [] : columns,
            segment: more ? {} : undefined,
            objects: { hyperpbiState: { specification: activeSpecification, configuration: state.configuration, studioLayout: layout } },
        });
        const makeRow = (index: number) => columns.map((_, field) => {
            if (field === 0) return `WO-${String(index).padStart(6, "0")}`;
            if (field === 1) return statuses[index % statuses.length];
            if (field === 2) return districts[index % districts.length];
            if (field === 3) return (index % 1_000) + revision;
            if (field === 4) return 29.5 + index % 500 / 1_000;
            if (field === 5) return -95.5 + index % 650 / 1_000;
            return (index + field) % 1_000_000;
        });
        const send = (append: boolean, omitEditMode = false) => {
            const start = performance.now();
            const end = Math.min(dataStart + windowRows, state.total);
            const overlap = append && dataStart > 0 ? 1 : 0;
            const offset = dataStart - overlap;
            const rows = Array.from({ length: end - offset }, (_, index) => makeRow(offset + index));
            const identity = rows.map((_row, index) => ({ stableKey: offset + index }));
            dataStart = end;
            visual.update({
                type: 2, viewport, editMode: omitEditMode ? undefined : state.mode, operationKind: append ? 2 : 0,
                dataViews: [{ metadata: metadata(end < state.total), table: { columns: state.total === 0 ? [] : columns, rows, identity, lastMergeIndex: overlap ? 0 : undefined } }],
            });
            state.windowMs = Math.max(state.windowMs, performance.now() - start);
            if (end === state.total) state.completeMs = performance.now() - queryStart;
            const memory = (performance as Performance & { memory?: { usedJSHeapSize: number } }).memory;
            state.peakHeap = Math.max(state.peakHeap, memory?.usedJSHeapSize ?? 0);
        };
        const visual = browser.powerbi.visuals.plugins[guid].create({
            element,
            host: {
                hostCapabilities: { allowInteractions: true },
                persistProperties: ({ merge: [{ properties }] }: { merge: { properties: { configuration: string } }[] }) => {
                    state.configuration = properties.configuration;
                },
                switchFocusModeState: (enabled: boolean) => { state.mode = enabled ? 1 : 0; },
                createSelectionManager: () => ({
                    clear: async () => [],
                    select: async (ids: unknown[]) => { state.selections += ids.length; return ids; },
                }),
                createSelectionIdBuilder: () => ({
                    withTable: (table: { identity: Array<{ stableKey: number }> }, index: number) => {
                        state.builderCalls++;
                        const key = table.identity[index].stableKey;
                        return { createSelectionId: () => ({ getKey: () => String(key), hasIdentity: () => true }) };
                    },
                }),
                fetchMoreData: (accumulated: boolean) => {
                    if (accumulated !== false) throw new Error("Visual requested accumulated segments.");
                    if (++state.requests > reject) return false;
                    const current = requestId;
                    setTimeout(() => { if (requestId === current) send(true); }, hostLatency);
                    return true;
                },
            },
        });
        window.hpWorkload = state;
    }, { guid: manifest.visual.guid, width, configuration: defaultConfigJson, windowRows, hostLatency });
    return { windowRows, version: manifest.visual.version as string };
}

async function refresh(page: Page, rows: number, specification = tabsSpecification, rejectAfter?: number) {
    await page.evaluate(({ rows, specification, rejectAfter }) =>
        window.hpWorkload.refresh(rows, specification, rejectAfter), { rows, specification, rejectAfter });
}

const countText = (count: number) => count.toLocaleString("en-US");
const cases = benchmark
    ? [...[10_000, 50_000, 100_000, 250_000, 500_000].flatMap(rows => [25, 50].map(fields => [rows, fields])), [35_813, 21], [54_990, 21]]
    : [[10_000, 25]];

for (const [rows, fields] of cases) {
    test(`Power BI large data · ${rows} rows × ${fields} fields`, async ({ page }, testInfo) => {
        test.setTimeout(240_000);
        const errors: string[] = [];
        page.on("pageerror", error => errors.push(error.message));
        const session = await page.context().newCDPSession(page);
        const heap = async () => {
            // Let queued Preact effects, chart disposal and observer callbacks settle.
            await page.evaluate(() => new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve()))));
            await session.send("HeapProfiler.collectGarbage");
            return (await session.send("Runtime.getHeapUsage")).usedSize;
        };
        const { windowRows } = await mountVisual(page, fields);
        await refresh(page, rows, "");
        await expect(page.locator(".hp-visual-welcome-field-summary")).toContainText(countText(rows));
        await expect(page.locator(".hp-data-load-notice")).toHaveCount(0);
        expect(await page.evaluate(() => window.hpWorkload.requests)).toBe(Math.ceil(rows / windowRows) - 1);
        expect(await page.evaluate(() => window.hpWorkload.builderCalls)).toBe(0);
        const maxWindowMs = await page.evaluate(() => window.hpWorkload.windowMs);
        const retainedIngest = await heap();

        const openStudio = () => page.evaluate(() => window.hpWorkload.edit(true));
        await openStudio();
        await expect(page.locator(".hp-studio")).toBeVisible();
        const previewPage = page.getByRole("spinbutton", { name: "Data preview page" });
        await previewPage.fill(String(Math.ceil(rows / 25)));
        await previewPage.press("Tab");
        await expect(page.getByRole("button", { name: "Next data page" })).toBeDisabled();
        const previewTable = page.locator(".hp-studio-table-wrap");
        // Let the page-change effect reset the scroll position before scrolling the new page.
        await previewTable.evaluate(element => new Promise<void>(resolve =>
            requestAnimationFrame(() => requestAnimationFrame(() => {
                element.scrollTop = element.scrollHeight;
                resolve();
            })),
        ));
        await expect(previewTable).toContainText(`WO-${String(rows - 1).padStart(6, "0")}`);
        expect(await previewTable.locator("tbody tr").count()).toBeLessThanOrEqual(26);
        await page.getByRole("button", { name: "Preview changes", exact: true }).last().click();
        await expect(page.locator('[data-hp-id="record-summary"] .hp-metric-value').first()).toHaveText(countText(rows));
        const initialStudio = await heap();

        const leaveStudio = () => page.evaluate(() => window.hpWorkload.edit(false));
        await leaveStudio();
        const start = Date.now();
        await refresh(page, rows);
        const count = page.locator('[data-hp-id="total"] .hp-metric-value');
        await expect(count).toHaveText(countText(rows), { timeout: 45_000 });
        await expect(page.locator(".hp-data-load-notice")).toHaveCount(0);
        const refreshAndRenderMs = Date.now() - start;
        const chart = page.locator('[data-hp-id="districts"] canvas').first();
        const map = page.locator('[data-hp-id="locations"] .leaflet-container');
        const filter = page.getByPlaceholder("Filter work orders");
        const heaps: number[] = [];
        const timings: number[] = [];
        const cycles = benchmark ? 5 : 2;
        for (let index = 0; index < cycles; index++) {
            const started = Date.now();
            await page.getByRole("tab", { name: "Analysis", exact: true }).click();
            await expect(chart).toBeVisible();
            await filter.fill(`WO-${String(index).padStart(6, "0")}`);
            await expect(count).toHaveText("1", { timeout: 40_000 });
            await filter.fill("");
            await expect(count).toHaveText(countText(rows), { timeout: 40_000 });

            await page.getByRole("tab", { name: "Map", exact: true }).click();
            await expect(map).toBeVisible();
            await expect(chart).toHaveCount(0);
            await page.getByRole("tab", { name: "Records", exact: true }).click();
            await expect(map).toHaveCount(0);
            const row = page.locator('[data-hp-id="records"] tbody tr[aria-rowindex="2"]');
            await row.click();
            await expect(row).toHaveClass(/hp-row-selected/);
            await expect.poll(() => page.evaluate(() => window.hpWorkload.selections)).toBeGreaterThan(index);
            await row.click();

            await openStudio();
            const editor = page.locator(".hp-ai-import textarea");
            await editor.fill(tabsSpecification.replace("Work order analytics", `Work orders ${index}`));
            await page.getByRole("button", { name: "Validate response & preview" }).click();
            await expect(page.locator(".hp-import-message")).toContainText("synchronized with the working JSON");
            await leaveStudio();
            await refresh(page, rows);
            await expect(count).toHaveText(countText(rows), { timeout: 45_000 });
            await expect(page.locator(".hp-data-load-notice")).toHaveCount(0);
            await page.getByRole("tab", { name: "Analysis", exact: true }).click();
            await expect(chart).toBeVisible();
            timings.push(Date.now() - started);
            heaps.push(await heap());
        }
        const peakHeap = await page.evaluate(() => window.hpWorkload.peakHeap);
        const retainedGrowth = heaps.at(-1)! - heaps[1];
        if (heaps.length > 2) expect(retainedGrowth).toBeLessThan(Math.max(24 * 2 ** 20, heaps[1] * 0.12));
        await refresh(page, Math.max(rows, windowRows + 1), "", 0);
        await expect(page.getByRole("alert")).toContainText("Incomplete data");
        await page.evaluate(() => window.hpWorkload.destroy());
        await expect(page.locator("#visual").locator("> *")).toHaveCount(0);
        // The JavaScript modules remain loaded. The previous large row arrays
        // should disappear after teardown and a settled garbage collection.
        await expect.poll(heap, { timeout: 10_000 }).toBeLessThan(24 * 2 ** 20);
        const heapAfterDestroy = await heap();
        expect(errors).toEqual([]);

        const record = { rows, fields, maxWindowMs, retainedIngest, initialStudio, refreshAndRenderMs, timings, heaps, peakHeap, retainedGrowth, heapAfterDestroy };
        if (benchmark) {
            const output = ".verification/powerbi-benchmark";
            await mkdir(output, { recursive: true });
            await writeFile(`${output}/${rows}-${fields}.json`, JSON.stringify(record, null, 2) + "\n");
        }
        await testInfo.attach("performance", { body: JSON.stringify(record), contentType: "application/json" });
        console.log(JSON.stringify(record));
    });
}

test("packaged welcome identifies the build and saved progress can be hidden", async ({ page }, testInfo) => {
    const { version, windowRows } = await mountVisual(page, 21, { hostLatency: 1_500 });
    await page.locator("#visual").evaluate(element => { (element as HTMLElement).style.width = "318px"; });
    await refresh(page, 0, "");
    await expect(page.getByRole("heading", { name: "Connect your report data" })).toBeVisible();
    const build = page.locator(".hp-visual-welcome-build");
    await expect(build).toContainText(`Core · v${version}`);
    await expect(build.locator("time")).toHaveAttribute("datetime", /^\d{4}-\d{2}-\d{2}T.*Z$/);
    expect(await page.locator(".hp-visual-welcome").evaluate(element => element.scrollWidth)).toBeLessThanOrEqual(318);
    if (benchmark) await testInfo.attach("welcome-narrow", { body: await page.locator("#visual").screenshot(), contentType: "image/png" });
    await page.locator("#visual").evaluate(element => { (element as HTMLElement).style.width = "1260px"; });

    const total = page.locator('[data-hp-id="total"] .hp-metric-value');
    const notice = page.locator(".hp-data-load-notice");
    await refresh(page, 54_990);
    await expect(notice).toContainText(`${countText(windowRows)} rows received`);
    await expect(total).toHaveCount(0);
    await expect(total).toHaveText("54,990");

    await page.getByRole("tab", { name: "Records", exact: true }).click();
    await refresh(page, 54_990);
    await expect(notice).toBeVisible();
    await expect(page.getByRole("tab", { name: "Records", exact: true })).toHaveAttribute("aria-selected", "true");

    await page.evaluate(() => window.hpWorkload.edit(true));
    await page.getByRole("button", { name: "Advanced", exact: true }).click();
    await page.getByRole("menuitem", { name: /Runtime settings/ }).click();
    const checkbox = page.getByRole("checkbox", { name: "Show data loading progress" });
    await expect(checkbox).toBeChecked();
    await checkbox.uncheck();
    await page.getByRole("button", { name: "Save & return" }).click();
    expect(await page.evaluate(() => JSON.parse(window.hpWorkload.configuration).renderer.showDataLoadProgress)).toBe(false);
    await refresh(page, 54_990);
    await expect(page.locator(".hp-dashboard-loading")).toHaveAttribute("aria-busy", "true");
    await expect(notice).toHaveCount(0);
    await expect(total).toHaveCount(0);
    await expect(total).toHaveText("54,990");
    expect(await page.evaluate(() => window.hpWorkload.requests)).toBe(1);

    await refresh(page, 54_990, tabsSpecification, 0);
    await expect(page.getByRole("alert")).toContainText("Incomplete data");
    await expect(total).toHaveText(countText(windowRows));
});

const baselineDirectory = process.env.HYPERPBI_BASELINE_PACKAGE_DIR;
test("compare 54,990-row loading against the previous package", async ({ browser }, testInfo) => {
    test.skip(!baselineDirectory, "Supply the directory with the previous Core PBIVIZ for comparison.");
    const results = [];
    for (const directory of [baselineDirectory!, "dist"]) {
        const page = await browser.newPage();
        const { version, windowRows } = await mountVisual(page, 21, { directory, hostLatency: 30 });
        const timings: number[] = [];
        for (let index = 0; index < 6; index++) {
            await refresh(page, 54_990);
            await expect(page.locator('[data-hp-id="total"] .hp-metric-value')).toHaveText("54,990");
            expect(await page.evaluate(() => window.hpWorkload.requests)).toBe(Math.ceil(54_990 / windowRows) - 1);
            const elapsed = await page.evaluate(() => window.hpWorkload.completeMs!);
            if (index > 0) timings.push(Math.round(elapsed));
        }
        results.push({ version, windowRows, continuationRequests: Math.ceil(54_990 / windowRows) - 1, timings });
        await page.close();
    }
    const record = { rows: 54_990, fields: 21, simulatedHostLatencyMs: 30, results };
    await testInfo.attach("comparison", { body: JSON.stringify(record), contentType: "application/json" });
    console.log(JSON.stringify(record));
});

test("native edit mode starts before Power BI data and survives updates without an edit mode", async ({ page }) => {
    const baseline = process.env.HYPERPBI_EDIT_BASELINE_PACKAGE_DIR;
    await mountVisual(page, 21, { directory: baseline ?? "dist" });
    await refresh(page, 0, "");
    await page.evaluate(() => window.hpWorkload.edit(true));
    if (baseline) {
        await expect(page.locator(".hp-studio")).toHaveCount(0);
    } else {
        await expect(page.locator(".hp-studio")).toBeVisible();
    }
    await page.evaluate(() => window.hpWorkload.refresh(1_000, "", undefined, true));
    if (baseline) {
        await expect(page.locator(".hp-studio")).toHaveCount(0);
    } else {
        await expect(page.locator(".hp-studio")).toBeVisible();
        await expect(page.getByRole("button", { name: "Preview changes", exact: true }).first()).toBeEnabled();
        await expect(page.locator(".hp-studio-data-status")).toContainText("21 fields");
        const openEditor = async () => {
            await page.getByRole("button", { name: "Advanced", exact: true }).click();
            await page.getByRole("menuitem", { name: /JSON editor/ }).click();
        };
        await openEditor();
        const editor = page.getByLabel("HyperPBI specification JSON", { exact: true });
        const draft = '{"unfinished":';
        await editor.fill(draft);
        await page.evaluate(() => window.hpWorkload.edit(false));
        await expect(page.locator(".hp-studio")).toHaveCount(0);
        await page.evaluate(() => window.hpWorkload.edit(true));
        await openEditor();
        await expect(editor).toHaveText(draft);
    }
});
