import { expect, test } from "@playwright/test";

const api = "https://functions.miniup.app/hyperpbi-dynamic-demo";
const harness = "/tests/browser/remote-fragments.html";
const sensor = (id: number) => `${api}/sensor?id=${id}`;

test("real fragments render interactive charts, resize and refresh without remounting, and switch sensor", async ({ page }) => {
    await page.goto(harness);
    const responsePromise = page.waitForResponse(sensor(1024));
    await page.locator('[data-hp-layer-id="sensors"][data-hp-feature-id="1024"]').click();
    const popup = page.locator(".hp-map-feature-details");
    await expect(popup).toContainText("Current pressure (psi)", { timeout: 15_000 });
    const response = await responsePromise;
    expect(response.status()).toBe(200);
    expect(await response.headerValue("access-control-allow-origin")).toBe("*");
    await expect(popup).toContainText("North pressure station");
    const canvas = popup.locator(".hp-chart-canvas canvas");
    await expect(canvas).toBeVisible();
    const chartId = await page.evaluate(() => window.remoteDemo.chartId());
    await page.evaluate(() => window.remoteDemo.setZoom());
    const zoomStart = () => page.evaluate(() => (window.remoteDemo.zoom() as { start: number }[])[0].start);
    await expect.poll(zoomStart).toBe(25);
    await popup.getByRole("button", { name: "Expand popup", exact: true }).click();
    await expect(popup).toHaveClass(/is-expanded/);
    expect(await page.evaluate(() => window.remoteDemo.chartId())).toBe(chartId);
    await expect.poll(zoomStart).toBe(25);
    await canvas.hover({ position: { x: 140, y: 100 } });
    expect(await page.evaluate(() => window.remoteDemo.selections)).toBe(0);
    const refreshed = page.waitForResponse(sensor(1024));
    await popup.getByRole("button", { name: "Refresh data" }).click();
    expect((await refreshed).ok()).toBe(true);
    await expect(popup.locator(".hp-remote-fragment")).toHaveAttribute("aria-busy", "false");
    expect(await page.evaluate(() => window.remoteDemo.chartId())).toBe(chartId);
    await expect.poll(zoomStart).toBe(25);
    await popup.getByRole("button", { name: "Restore popup size", exact: true }).click();
    await popup.getByRole("button", { name: "Close feature details" }).click();
    await page.locator('[data-hp-feature-id="1025"]').click();
    await expect(popup.locator(".hp-remote-fragment")).toContainText("River pressure station");
    await expect(popup).toContainText("Station operations");
});

test("late responses cannot replace the next sensor and errors offer a retry", async ({ page }) => {
    let release!: () => void;
    const delayed = new Promise<void>(resolve => { release = resolve; });
    await page.route(sensor(1024), async route => {
        await delayed;
        await route.continue().catch(() => undefined);
    });
    await page.goto(harness);
    await page.locator('[data-hp-feature-id="1024"]').click();
    const fragment = page.locator(".hp-remote-fragment");
    await expect(fragment.getByRole("status")).toContainText("Loading dynamic content");
    await page.getByRole("button", { name: "Close feature details" }).click();
    await page.locator('[data-hp-feature-id="1025"]').click();
    await expect(fragment).toContainText("River pressure station");
    release();
    await expect(fragment).not.toContainText("North pressure station");
    await page.route(sensor(1025), route => route.abort("failed"), { times: 1 });
    await fragment.getByRole("button", { name: "Refresh data" }).click();
    await expect(fragment.getByRole("alert")).toContainText("CORS");
    await expect(fragment).toContainText("River pressure station");
    await fragment.getByRole("button", { name: "Refresh data" }).click();
    await expect(fragment.getByRole("alert")).toHaveCount(0);
    await expect(fragment.getByText("Current pressure (psi)")).toBeVisible();
});

test("dynamic popup fits a narrow visual", async ({ page }) => {
    await page.setViewportSize({ width: 350, height: 500 });
    await page.goto(harness);
    await page.locator('[data-hp-feature-id="1024"]').click();
    await expect(page.locator(".hp-remote-fragment")).toContainText("Current pressure (psi)");
    const box = await page.locator(".hp-map-feature-details").boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(350);
});

test("Map Studio previews the dynamic endpoint and persists its canonical settings", async ({ page }) => {
    await page.setViewportSize({ width: 1400, height: 900 });
    await page.goto(`${harness}?studio=1`);
    await page.getByRole("button", { name: "Select layer Pressure sensors", exact: true }).click();
    await page.getByRole("button", { name: "Popup", exact: true }).click();
    await expect(page.getByLabel("Popup mode", { exact: true })).toHaveValue("dynamic");
    await page.getByLabel("Test feature", { exact: true }).selectOption("1024");
    await expect(page.locator(".hp-map-popup-preview")).toContainText("Current pressure (psi)");
    await page.getByText("Request, fallback and size", { exact: true }).click();
    await page.getByLabel("Cache TTL (seconds)", { exact: true }).fill("45");
    await page.getByLabel("Cache TTL (seconds)", { exact: true }).press("Tab");
    await expect.poll(() => page.evaluate(() => JSON.parse(window.remoteDemo.saved).components[0].layers[1].popup.request.cacheTtlSeconds)).toBe(45);
    await page.getByRole("button", { name: "Save & return", exact: true }).click();
    await page.reload();
    await page.getByRole("button", { name: "Select layer Pressure sensors", exact: true }).click();
    await page.getByRole("button", { name: "Popup", exact: true }).click();
    await expect(page.getByLabel("Popup mode", { exact: true })).toHaveValue("dynamic");
    await page.getByText("Request, fallback and size", { exact: true }).click();
    await expect(page.getByLabel("Cache TTL (seconds)", { exact: true })).toHaveValue("45");
});

test("asset table, priority control and refresh button drive independent live regions", async ({ page }) => {
    await page.goto(`${harness}?assets=1&filterEvent=1`);
    const panel = page.getByRole("region", { name: "Asset details" });
    const workload = page.getByRole("region", { name: "Workload", exact: true });
    await expect(panel).toContainText("Select a work order");
    await expect(workload).toContainText("All priorities · Workload");
    const asset = page.waitForResponse(`${api}/asset?id=P-204`);
    await page.getByRole("row", { name: /P-204/ }).press("Enter");
    expect(await (await asset).headerValue("access-control-allow-origin")).toBe("*");
    await expect(panel).toContainText("Inspect seal vibration");
    const priority = page.waitForResponse(`${api}/backlog?priority=High`);
    await page.getByLabel("Work priority").selectOption("High");
    expect((await priority).ok()).toBe(true);
    await expect(workload).toContainText("High · Workload");
    await expect(page.getByRole("region", { name: "Priority event" })).toContainText("High · Workload");
    await expect(page.getByRole("row", { name: /V-118/ })).toHaveCount(0);
    const refresh = page.waitForResponse(`${api}/backlog?priority=High`);
    await page.getByRole("button", { name: "Refresh workload" }).click();
    expect((await refresh).ok()).toBe(true);
    await expect(workload.locator("canvas")).toBeVisible();
    await expect(panel).toContainText("Inspect seal vibration");
});

test("chart selection opens a live fragment inside an independently dismissible modal", async ({ page }) => {
    await page.goto(`${harness}?assets=1&chart=1`);
    const canvas = page.locator('[data-hp-id="asset_chart"] canvas');
    await expect(canvas).toBeVisible();
    const position = await page.evaluate(() => window.remoteDemo.assetPoint());
    expect(position?.every(Number.isFinite)).toBe(true);
    await canvas.click({ position: { x: position![0], y: position![1] } });
    const opener = page.getByRole("button", { name: "Open asset inspector" });
    await opener.click();
    const dialog = page.getByRole("dialog", { name: "Chart selection" });
    await expect(dialog).toContainText("Inspect seal vibration");
    await dialog.getByRole("button", { name: "Refresh data" }).press("Escape");
    await expect(dialog).toHaveCount(0);
    await expect(opener).toBeFocused();
});

test("one map feature click provides context to a popup and a separate dashboard region", async ({ page }) => {
    await page.goto(`${harness}?mapRegion=1`);
    await page.locator('[data-hp-feature-id="1026"]').click();
    await expect(page.locator(".hp-map-feature-details .hp-remote-fragment")).toContainText("West pressure station");
    await expect(page.getByRole("region", { name: "Linked station" })).toContainText("West pressure station");
    await page.getByRole("button", { name: "Close feature details" }).click();
    await expect(page.getByRole("region", { name: "Linked station" })).toContainText("Current pressure (psi)");
});
