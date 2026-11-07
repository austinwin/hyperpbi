import { expect, test } from "@playwright/test";
import { readFileSync, mkdirSync } from "node:fs";
import { resolve } from "node:path";

declare global { interface Window { remoteDemo: { chartId: () => string | undefined; zoom: () => unknown; setZoom: () => void; saved: string; selections: number } } }

const fixture = (sensor: string) => readFileSync(resolve(process.cwd(), `examples/remote-fragments/sensor-${sensor}.json`), "utf8");
test.beforeEach(async ({ page }) => {
    mkdirSync("docs/screenshots", { recursive: true });
    await page.route("https://raw.githubusercontent.com/austinwin/hyperpbi/main/examples/remote-fragments/sensor-*.json", async route => {
        const sensor = route.request().url().split("sensor-").pop()!.replace(".json", "");
        await route.fulfill({ contentType: "application/json", headers: { "Access-Control-Allow-Origin": "*" }, body: fixture(sensor) });
    });
});

test("real fragments render interactive charts, resize without remounting and switch sensor", async ({ page }) => {
    await page.goto("/tests/browser/remote-fragments.html");
    await page.locator('[data-hp-layer-id="sensors"][data-hp-feature-id="1024"]').click();
    const popup = page.locator(".hp-map-feature-details");
    await expect(popup).toContainText("Current pressure (psi)");
    await expect(popup).toContainText("Healthy");
    await expect(popup.locator(".hp-chart-canvas canvas")).toBeVisible();
    const id = await page.evaluate(() => window.remoteDemo.chartId());
    await page.evaluate(() => window.remoteDemo.setZoom());
    await expect.poll(() => page.evaluate(() => (window.remoteDemo.zoom() as { start: number }[])[0].start)).toBe(25);
    await page.getByRole("button", { name: "Expand popup", exact: true }).click();
    await expect(popup).toHaveClass(/is-expanded/);
    expect(await page.evaluate(() => window.remoteDemo.chartId())).toBe(id);
    await expect.poll(() => page.evaluate(() => (window.remoteDemo.zoom() as { start: number }[])[0].start)).toBe(25);
    const canvas = popup.locator(".hp-chart-canvas canvas");
    await canvas.hover({ position: { x: 140, y: 100 } });
    expect(await page.evaluate(() => window.remoteDemo.selections)).toBe(0);
    mkdirSync("docs/screenshots", { recursive: true });
    await page.screenshot({ path: "docs/screenshots/remote-analytics-popup.png", fullPage: true });
    await page.getByRole("button", { name: "Restore popup size", exact: true }).click();
    await page.getByRole("button", { name: "Close feature details" }).click();
    await page.locator('[data-hp-layer-id="sensors"][data-hp-feature-id="1025"]').click();
    await expect(popup).toContainText("River pressure station");
    await expect(popup).toContainText("Watch");
    await page.getByRole("button", { name: "Refresh data" }).click();
    await expect(popup).toContainText("Current pressure (psi)");
});

test("late responses cannot replace the next sensor and errors offer a retry", async ({ page }) => {
    let release!: () => void;
    const delayed = new Promise<void>(resolveDelay => { release = resolveDelay; });
    await page.route("https://raw.githubusercontent.com/austinwin/hyperpbi/main/examples/remote-fragments/sensor-1024.json", async route => { await delayed; await route.fulfill({ contentType: "application/json", body: fixture("1024") }).catch(() => undefined); });
    await page.goto("/tests/browser/remote-fragments.html");
    await page.locator('[data-hp-feature-id="1024"]').click();
    await expect(page.locator(".hp-remote-fragment").getByRole("status")).toContainText("Loading remote analytics");
    await page.getByRole("button", { name: "Close feature details" }).click();
    await page.locator('[data-hp-feature-id="1025"]').click();
    await expect(page.locator(".hp-remote-fragment")).toContainText("Watch");
    release();
    await expect(page.locator(".hp-remote-fragment")).not.toContainText("North pressure station");
    await page.route("https://raw.githubusercontent.com/austinwin/hyperpbi/main/examples/remote-fragments/sensor-1025.json", route => route.abort("failed"));
    await page.getByRole("button", { name: "Refresh data" }).click();
    await expect(page.getByRole("alert")).toContainText("CORS");
    await expect(page.getByRole("alert")).toContainText("River pressure station");
});

test("remote popup fits a narrow visual", async ({ page }) => {
    await page.setViewportSize({ width: 350, height: 500 });
    await page.goto("/tests/browser/remote-fragments.html");
    await page.locator('[data-hp-feature-id="1024"]').click();
    await expect(page.locator(".hp-remote-fragment")).toContainText("Healthy");
    const box = await page.locator(".hp-map-feature-details").boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(350);
    await page.screenshot({ path: "docs/screenshots/remote-analytics-narrow.png", fullPage: true });
});

test("Map Studio previews the remote endpoint and persists its canonical settings", async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    await page.goto("/tests/browser/remote-fragments.html?studio=1");
    await page.getByRole("button", { name: "Select layer Pressure sensors", exact: true }).click();
    await page.getByRole("button", { name: "Popup", exact: true }).click();
    await expect(page.getByLabel("Popup mode", { exact: true })).toHaveValue("remote");
    await page.getByLabel("Test feature", { exact: true }).selectOption("1024");
    await expect(page.locator(".hp-map-popup-preview")).toContainText("Healthy");
    await page.getByText("Request, fallback and size", { exact: true }).click();
    await page.getByLabel("Cache TTL (seconds)", { exact: true }).fill("45");
    await page.getByLabel("Cache TTL (seconds)", { exact: true }).press("Tab");
    await expect.poll(() => page.evaluate(() => JSON.parse(window.remoteDemo.saved).components[0].layers[0].popup.remote.cacheTtlSeconds)).toBe(45);
    await page.screenshot({ path: "docs/screenshots/remote-analytics-map-studio.png", fullPage: true });
    await page.getByRole("button", { name: "Save & return", exact: true }).click();
    await page.reload();
    await page.getByRole("button", { name: "Select layer Pressure sensors", exact: true }).click();
    await page.getByRole("button", { name: "Popup", exact: true }).click();
    await expect(page.getByLabel("Popup mode", { exact: true })).toHaveValue("remote");
    await page.getByText("Request, fallback and size", { exact: true }).click();
    await expect(page.getByLabel("Cache TTL (seconds)", { exact: true })).toHaveValue("45");
});
