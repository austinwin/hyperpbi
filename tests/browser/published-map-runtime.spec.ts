import { expect, test } from "@playwright/test";
declare global { interface Window { publishedMapRuntime: { selectionCalls: number; rowKeys: string[]; saved: string; specification: string; }; } }

test("Published and Power BI layers coexist, select model rows and respond to Date slicer updates", async ({ page }) => {
    await page.goto("/tests/browser/published-map-runtime.html");
    const facilities = page.locator('[data-hp-layer-id="published-facility-network-facilities"]');
    const native = page.locator('[data-hp-layer-id="analytics"]');
    const area = page.locator('[data-hp-layer-id="published-facility-network-service-area"]');
    await expect(facilities).toHaveCount(2); await expect(native).toHaveCount(2); await expect(area).toHaveCount(1);
    const beta = page.locator('[data-hp-layer-id="published-facility-network-facilities"][data-hp-feature-id="B"]');
    const key = await beta.getAttribute("data-hp-feature-key");
    await beta.click({ force: true });
    await expect.poll(() => page.evaluate(() => window.publishedMapRuntime.rowKeys)).toEqual(["facility-1"]);
    const calls = await page.evaluate(() => window.publishedMapRuntime.selectionCalls);
    await page.getByLabel("Report date slicer").selectOption("2026-11");
    await expect(facilities).toHaveCount(1); await expect(native).toHaveCount(1); await expect(area).toHaveCount(1);
    await expect(beta).toHaveAttribute("data-hp-feature-key", key!);
    expect(await page.evaluate(() => window.publishedMapRuntime.selectionCalls)).toBe(calls);
    await page.getByLabel("Report date slicer").selectOption("all");
    await expect(facilities).toHaveCount(2);
    await expect(beta).toHaveAttribute("data-hp-feature-key", key!);
});

test("Map Studio uses one native canvas with a compact responsive properties panel", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto("/tests/browser/published-map-runtime.html?studio=1");
    await expect(page.locator(".hp-map-studio-canvas .leaflet-container")).toBeVisible();
    await expect(page.locator(".leaflet-container")).toHaveCount(1);
    await expect(page.locator(".hp-map-toolbar")).toHaveCount(0);
    await page.getByRole("button", { name: "Select layer Facilities", exact: true }).click();
    await expect(page.locator(".hp-map-origin-card")).toContainText("Facility Network");
    await page.getByRole("button", { name: "Close properties panel" }).click();
    await page.getByRole("button", { name: "Search", exact: true }).click();
    await page.getByLabel("Search loaded map features").fill("North");
    await expect(page.locator(".hp-map-feature-results")).toContainText("North facility");
    await page.screenshot({ path: "test-results/map-studio-desktop.png" });
    await page.setViewportSize({ width: 390, height: 780 });
    await expect(page.locator(".hp-map-studio-canvas")).toBeVisible();
    expect(await page.locator(".hp-map-studio").evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
    await page.screenshot({ path: "test-results/map-studio-mobile.png" });
});
