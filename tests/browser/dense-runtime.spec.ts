import type {} from "./dense-runtime-harness";
import { mkdir, writeFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";

const recording = process.env.HYPERPBI_DENSE_BENCHMARK;
const sizes = recording ? [25, 50, 100, 200, 500] : [100];

for (const size of sizes) {
    test(`dense dashboard routes a scoped interaction across ${size} mounted components`, async ({ page }) => {
        await page.goto("/tests/browser/dense-runtime.html");
        await page.waitForFunction(() => Boolean(window.hpDenseRuntime));
        const fields = size >= 200 ? 50 : 25;
        const rows = 12_000;
        const start = await page.evaluate(({ size, rows, fields }) => window.hpDenseRuntime.mount(size, rows, fields), { size, rows, fields });
        expect(start.displayed).toBe(String(rows));
        const operations = [];
        for (let iteration = 0; iteration < 15; iteration++) {
            const result = await page.evaluate(index => window.hpDenseRuntime.interact(index), iteration);
            expect(result.affected).toBe(String(iteration % 3 === 2 ? rows : rows / 2));
            expect(result.unaffected).toBe(String(rows));
            if (recording !== "baseline") expect(result.componentRenders).toBeLessThanOrEqual(6);
            operations.push(result);
        }
        const editor = await page.evaluate(() => window.hpDenseRuntime.studio());
        expect(editor.opened).toBe(true);
        if (recording) {
            await mkdir(".verification/dense-runtime", { recursive: true });
            await writeFile(`.verification/dense-runtime/${recording}-${size}.json`, JSON.stringify({ size, rows, fields, start, operations, editor }, null, 2));
        }
    });
}
