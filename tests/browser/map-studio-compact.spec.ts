import { expect, test, type Page } from "@playwright/test";

async function checkAppearance(page: Page, name: string) {
    if (process.platform === "win32") await expect(page).toHaveScreenshot(name, { animations: "disabled" });
    else await page.screenshot({ path: test.info().outputPath(name), animations: "disabled" });
}

test("viewer surfaces stay compact while layers and feature cards remain usable", async ({ page }) => {
    await page.setViewportSize({ width: 1000, height: 700 });
    await page.goto("/tests/browser/published-map-runtime.html");
    await expect(page.getByRole("button", { name: "Expand map tools" })).toBeVisible();
    await checkAppearance(page, "viewer-collapsed.png");
    await page.getByRole("button", { name: "Expand map tools" }).click();
    await page.getByRole("button", { name: "Layers", exact: true }).click();
    await expect(page.locator(".hp-map-layer-panel")).toContainText("3 layers");
    await checkAppearance(page, "viewer-layers.png");
    await page.getByRole("button", { name: "Close Layers", exact: true }).click();
    await page.locator('[data-hp-layer-id="published-facility-network-facilities"][data-hp-feature-id="B"]').click({ force: true });
    await expect(page.locator(".hp-map-feature-details")).toContainText("North facility");
    await checkAppearance(page, "feature-information.png");
    await page.getByRole("button", { name: "Minimize feature details" }).click();
    await expect(page.locator(".hp-map-feature-details-body")).toBeHidden();
    await page.getByRole("button", { name: "Expand feature details" }).click();
    await expect(page.locator(".hp-map-feature-details-body")).toBeVisible();
});

test("style, color, classification and labels update canonical JSON through one drawer", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 820 });
    await page.goto("/tests/browser/published-map-runtime.html?studio=1");
    await expect(page.locator(".hp-map-studio-rail")).toBeVisible();
    await checkAppearance(page, "authoring-layers.png");
    await page.getByRole("button", { name: "Select layer Facilities", exact: true }).click();
    await page.getByRole("button", { name: "Style", exact: true }).click();
    await page.getByLabel("Renderer type").selectOption("simple");
    await checkAppearance(page, "symbol-style.png");
    await page.getByRole("button", { name: "Fill color color picker", exact: true }).click();
    await expect(page.getByRole("dialog", { name: "Fill color colors" })).toBeVisible();
    await checkAppearance(page, "color-picker.png");
    await page.getByRole("button", { name: "Color #dc2626", exact: true }).click();
    await expect.poll(() => page.evaluate(() => JSON.parse(window.publishedMapRuntime.specification).components[0].layers.find((layer: { name: string }) => layer.name === "Facilities").renderer.symbol.fillColor)).toBe("#dc2626");
    await page.getByRole("button", { name: "Close color picker" }).click();
    await page.getByLabel("Renderer type").selectOption("uniqueValue");
    await checkAppearance(page, "unique-value-classification.png");
    await page.getByRole("button", { name: "Labels", exact: true }).click();
    await page.getByLabel("Label font").selectOption("Georgia");
    await checkAppearance(page, "label-editor.png");
    await page.getByRole("button", { name: "Close properties panel" }).click();
    await expect(page.locator(".hp-map-studio-canvas")).toBeVisible();
    await page.getByRole("button", { name: "Layer properties", exact: true }).click();
    await expect(page.getByLabel("Label font")).toHaveValue("Georgia");
});

test("popup blocks save and reload while the narrow drawer keeps the map at full width", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 820 });
    await page.goto("/tests/browser/published-map-runtime.html?studio=1");
    await page.getByRole("button", { name: "Select layer Facilities", exact: true }).click();
    await page.getByRole("button", { name: "Popup", exact: true }).click();
    await page.getByText("Add Content +", { exact: true }).click();
    await page.getByRole("menuitem", { name: "Formatted field", exact: true }).click();
    await page.locator(".hp-popup-block > summary").click();
    await page.getByLabel("Units", { exact: true }).fill("MW");
    await page.getByLabel("Units", { exact: true }).press("Tab");
    await checkAppearance(page, "popup-builder.png");
    await page.getByRole("button", { name: "Save & return", exact: true }).click();
    await expect.poll(() => page.evaluate(() => window.publishedMapRuntime.saved.length)).toBeGreaterThan(0);
    await page.goto("/tests/browser/published-map-runtime.html?studio=1&saved=1");
    await page.getByRole("button", { name: "Select layer Facilities", exact: true }).click();
    await page.getByRole("button", { name: "Popup", exact: true }).click();
    await expect(page.locator(".hp-popup-block")).toHaveCount(1);
    await page.setViewportSize({ width: 390, height: 680 });
    await checkAppearance(page, "narrow-powerbi-drawer.png");
    const geometry = await page.locator(".hp-map-studio").evaluate(root => ({ width: root.clientWidth, overflow: root.scrollWidth > root.clientWidth, map: root.querySelector(".leaflet-container")!.getBoundingClientRect().width, panels: Array.from(root.querySelectorAll(".hp-map-studio-layers,.hp-map-studio-properties,.hp-map-source-drawer")).filter(panel => getComputedStyle(panel).display !== "none").length }));
    expect(geometry.overflow).toBe(false); expect(geometry.map).toBeGreaterThan(geometry.width - 20); expect(geometry.panels).toBe(1);
    await page.getByRole("button", { name: "Close properties panel" }).click();
    await expect(page.locator(".hp-map-studio-properties")).toBeHidden();
});
