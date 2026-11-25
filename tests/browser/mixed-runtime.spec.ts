import type {} from "./mixed-runtime-harness";
import { mkdir, writeFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";

const recording = process.env.HYPERPBI_MIXED_BENCHMARK;
const cases = recording ? [[100, 30_000, 25], [200, 55_000, 32], [500, 100_000, 50]] : [[100, 12_000, 25]];

for (const [size, count, width] of cases) {
    test(`mixed portfolio routes updates across ${size} components and ${count} records`, async ({ page }) => {
        test.setTimeout(240_000);
        const errors: string[] = [];
        page.on("pageerror", error => errors.push(error.message));
        await page.goto("/tests/browser/mixed-runtime.html");
        await page.waitForFunction(() => Boolean(window.hpMixedRuntime));
        if (recording) await mkdir(".verification/mixed-runtime", { recursive: true });
        const cdp = await page.context().newCDPSession(page);
        await cdp.send("Performance.enable");
        const metrics = async () => Object.fromEntries((await cdp.send("Performance.getMetrics")).metrics.map(entry => [entry.name, entry.value]));
        const memory = async () => {
            await cdp.send("HeapProfiler.collectGarbage");
            return (await cdp.send("Runtime.getHeapUsage")).usedSize;
        };
        const start = await page.evaluate(([size, count, width]) => window.hpMixedRuntime.mount(size, count, width), [size, count, width]);
        expect(start.unaffected).toBe(String(count));
        const heapAfterMount = await memory();
        const scope = [];
        const open = Math.ceil(count / 3);
        const profiling = process.env.HYPERPBI_MIXED_PROFILE === "1";
        if (profiling) {
            await cdp.send("Profiler.enable");
            await cdp.send("Profiler.start");
        }
        const beforeScope = await metrics();
        const paint = { count: 0, totalMs: 0 };
        const tracing = process.env.HYPERPBI_MIXED_TRACE === "1";
        if (tracing) {
            cdp.on("Tracing.dataCollected", ({ value }) => {
                for (const event of value) {
                    if (event.name !== "Paint" || event.ph !== "X" || typeof event.dur !== "number") continue;
                    paint.count++;
                    paint.totalMs += event.dur / 1_000;
                }
            });
            await cdp.send("Tracing.start", { traceConfig: { includedCategories: ["devtools.timeline"] } });
        }
        for (let sample = 0; sample < (recording ? 15 : 3); sample++) {
            const label = (["Open", "Closed", "All"] as const)[sample % 3];
            const result = await page.evaluate(label => window.hpMixedRuntime.scope(label), label);
            expect(result.affected).toBe(String(label === "Open" ? open : label === "Closed" ? count - open : count));
            expect(result.unaffected).toBe(String(count));
            if (!recording) {
                expect(result.ids).not.toContain("unaffected");
                expect(result.renders).toBeLessThanOrEqual(8);
            }
            scope.push(result);
        }
        if (tracing) {
            const complete = new Promise<void>(resolve => cdp.once("Tracing.tracingComplete", () => resolve()));
            await cdp.send("Tracing.end");
            await complete;
        }
        const afterScope = await metrics();
        const beforeGlobal = await metrics();
        const global = [];
        for (let sample = 0; sample < (recording ? 6 : 2); sample++) {
            const query = sample % 2 ? "" : "Open";
            global.push(await page.evaluate(([query, total]) => window.hpMixedRuntime.global(query, total), [query, query ? open : count] as const));
        }
        const afterGlobal = await metrics();
        if (profiling) {
            const cpu = await cdp.send("Profiler.stop");
            await writeFile(`.verification/mixed-runtime/cpu-${recording}-${size}.json`, JSON.stringify(cpu.profile));
        }
        const rapid = await page.evaluate(() => window.hpMixedRuntime.rapid());
        expect(rapid.affected).toBe(String(count));
        const selection = await page.evaluate(() => window.hpMixedRuntime.select());
        expect(selection.selected).toBe(1);
        const groupSelection = await page.evaluate(() => window.hpMixedRuntime.selectGroup());
        expect(groupSelection.selected).toBe(Math.floor(count / 2));
        const external = await page.evaluate(() => window.hpMixedRuntime.external("Urgent"));
        expect(external.requestCount).toBe(1);
        const resize = await page.evaluate(() => window.hpMixedRuntime.resize(980));
        expect(resize.chartOps.resize).toBeGreaterThan(0);
        const unchangedLayout = await page.evaluate(() => window.hpMixedRuntime.unchangedLayout());
        if (!recording) expect(unchangedLayout.chartOps.resize).toBe(0);
        const switchOut = await page.evaluate(() => window.hpMixedRuntime.tab("Details"));
        expect(switchOut.unaffected).toBeUndefined();
        await expect(page.locator("[data-hp-id=raw-table] table")).toBeVisible();
        const switchIn = await page.evaluate(() => window.hpMixedRuntime.tab("Overview"));
        expect(switchIn.unaffected).toBe(String(count));
        const refresh = [];
        const heapAfterRefresh = [];
        for (let revision = 1; revision <= (recording ? 3 : 5); revision++) {
            const result = await page.evaluate(([count, width, revision]) => window.hpMixedRuntime.refresh(count, width, revision), [count, width, revision]);
            expect(result.unaffected).toBe(String(count));
            refresh.push(result);
            heapAfterRefresh.push(await memory());
        }
        if (!recording) expect(heapAfterRefresh[4] - heapAfterRefresh[2]).toBeLessThan(6 * 1024 * 1024);
        const editor = await page.evaluate(() => window.hpMixedRuntime.studio());
        await expect(page.locator(".hp-studio")).toBeVisible();
        const editorEdit = await page.evaluate(() => window.hpMixedRuntime.studioEdit());
        await expect(page.locator(".cm-content")).toContainText("Updated portfolio");
        const phases = await page.evaluate(() => window.hpMixedRuntime.performance());
        expect(await page.evaluate(() => window.hpMixedRuntime.destroy())).toBe(0);
        const heapAfterDestroy = await memory();
        expect(errors).toEqual([]);
        if (recording) {
            const folder = ".verification/mixed-runtime";
            const delta = (before: Record<string, number>, after: Record<string, number>) => Object.fromEntries(
                ["TaskDuration", "ScriptDuration", "LayoutDuration", "RecalcStyleDuration", "LayoutCount"].map(key => [key, after[key] - before[key]]));
            await writeFile(`${folder}/${recording}-${size}.json`, JSON.stringify({ size, count, width, start, scope, global, rapid, selection, groupSelection, external, resize, unchangedLayout, switchOut, switchIn, refresh, editor, editorEdit, phases,
                heapAfterMount, heapAfterRefresh, heapAfterDestroy, scopeCpu: delta(beforeScope, afterScope), globalCpu: delta(beforeGlobal, afterGlobal), ...(tracing ? { scopePaint: paint } : {}) }));
        }
    });
}
