import { expect, test } from "@playwright/test";
import { resolve } from "node:path";

declare global {
  interface Window {
    hpMapStudioHarness: { mountCount: number; changeCount: number; json: string };
  }
}

test.beforeEach(async ({ page }) => {
  await page.route("https://services.arcgis.com/**", async (route) => {
    const url = route.request().url();
    if (url.includes("/query")) {
      await route.fulfill({
        contentType: "application/json",
        body: JSON.stringify({
          objectIdFieldName: "OBJECTID",
          geometryType: "esriGeometryPoint",
          spatialReference: { wkid: 4326 },
          fields: [
            { name: "OBJECTID", type: "esriFieldTypeOID" },
            { name: "CODE", type: "esriFieldTypeString" },
          ],
          features: [{ attributes: { OBJECTID: 1, CODE: "Z" }, geometry: { x: -95, y: 30 } }],
        }),
      });
      return;
    }
    await route.fulfill({
      contentType: "application/json",
      body: JSON.stringify({
        id: 0,
        name: "Test features",
        geometryType: "esriGeometryPoint",
        objectIdField: "OBJECTID",
        capabilities: "Query",
        supportedQueryFormats: "JSON",
        maxRecordCount: 2000,
        advancedQueryCapabilities: { supportsPagination: true },
        spatialReference: { wkid: 4326 },
        fields: [
          { name: "OBJECTID", alias: "Object ID", type: "esriFieldTypeOID" },
          { name: "CODE", alias: "Code", type: "esriFieldTypeString" },
        ],
      }),
    });
  });
  await page.goto("/tests/browser/map-studio.html");
  await expect(page.locator(".hp-map-studio")).toBeVisible();
});

test("imports a portable published map with multiple native layers on a compact viewport", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 780 });
  await page.getByRole("button", { name: "Import published map", exact: true }).click();
  await page.getByLabel("Open map manifest").setInputFiles(resolve("examples/map/published-map.json"));
  await expect(page.locator(".hp-map-import-preview")).toContainText("Facility Network");
  await page.getByRole("button", { name: "Import map and 2 layers" }).click();
  await expect(page.getByRole("button", { name: "Select layer Facilities", exact: true })).toBeVisible();
  const specification = await page.evaluate(() => JSON.parse(window.hpMapStudioHarness.json));
  expect(specification.components[0].layers).toHaveLength(5);
  expect(specification.components[0].imports[0].mode).toBe("snapshot");
  expect(specification.components[0].layers.filter((layer: { provenance?: unknown }) => layer.provenance)).toHaveLength(2);
  expect(await page.locator(".hp-map-studio").evaluate(node => node.scrollWidth <= node.clientWidth)).toBe(true);
});

test("switching property sections preserves the selected layer and Studio instance", async ({ page }) => {
  await page.getByRole("button", { name: "Select layer Feature assets" }).click();
  for (const section of ["Renderer", "Feature details", "Performance", "Source"]) {
    await page.getByRole("tab", { name: section }).click();
    await expect(page.locator('.hp-map-studio-layer.is-selected > button strong')).toHaveText("Feature assets");
  }
  expect(await page.evaluate(() => window.hpMapStudioHarness.mountCount)).toBe(1);
  expect(await page.evaluate(() => window.hpMapStudioHarness.changeCount)).toBe(0);
});

test("dynamic exposes identify details while tile remains display-only", async ({ page }) => {
  await page.getByRole("button", { name: "Select layer Dynamic weather" }).click();
  await expect(page.locator(".hp-map-capability-note")).toContainText("read-only click identify");
  await expect(page.getByRole("tab", { name: "Feature details" })).toBeEnabled();
  for (const section of ["Join", "Renderer", "Labels", "Tooltip", "Interactions"])
    await expect(page.getByRole("tab", { name: section })).toBeDisabled();
  await page.getByRole("tab", { name: "Source" }).click();
  await expect(page.getByRole("switch", { name: "Enable read-only identify" })).toBeChecked();
  await expect(page.getByText("Dynamic layers do not support Power BI joins or persistent feature selection.")).toBeVisible();

  await page.getByRole("button", { name: "Select layer Tile basemap" }).click();
  await expect(page.locator(".hp-map-capability-note")).toContainText("display-only");
  for (const section of ["Join", "Renderer", "Labels", "Tooltip", "Feature details", "Interactions"])
    await expect(page.getByRole("tab", { name: section })).toBeDisabled();
});

test("narrow Map Studio uses one pane without clipped or overlapping controls", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 780 });
  await page.getByRole("tab", { name: "Properties" }).click();
  const selector = page.locator(".hp-map-property-select select");
  await expect(selector).toBeVisible();
  await expect(page.locator(".hp-map-property-tabs")).toBeHidden();
  const geometry = await page.locator(".hp-map-studio").evaluate((studio) => {
    const controls = Array.from(studio.querySelectorAll<HTMLElement>("button:not([hidden]), input:not([hidden]):not([type=checkbox]):not([type=radio]), select:not([hidden])"))
      .filter((control) => {
        const style = getComputedStyle(control);
        const box = control.getBoundingClientRect();
        return style.display !== "none" && style.visibility !== "hidden" && box.width > 0 && box.height > 0;
      })
      .map((control) => {
        const box = control.getBoundingClientRect();
        return { left: box.left, right: box.right, top: box.top, bottom: box.bottom, height: box.height };
      });
    const overlaps = controls.flatMap((a, index) => controls.slice(index + 1).filter((b) =>
      Math.min(a.right, b.right) - Math.max(a.left, b.left) > 4 &&
      Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 4,
    ));
    return {
      scrollWidth: studio.scrollWidth,
      clientWidth: studio.clientWidth,
      tooShort: controls.filter((control) => control.height < 30).length,
      overlaps: overlaps.length,
    };
  });
  expect(geometry.scrollWidth).toBeLessThanOrEqual(geometry.clientWidth);
  expect(geometry.tooShort).toBe(0);
  expect(geometry.overlaps).toBe(0);
});

test("keyboard navigation and Escape close the layer menu", async ({ page }) => {
  const add = page.getByRole("button", { name: "+ Add source" });
  await add.focus();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("menu", { name: "Add source" })).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("menu", { name: "Add source" })).toHaveCount(0);
  await expect(add).toBeFocused();
});

test("guided joins expose duplicate diagnostics and a strong low-match warning", async ({ page }) => {
  await page.getByRole("button", { name: "Select layer Feature assets" }).click();
  await page.getByRole("tab", { name: "Source" }).click();
  await page.getByRole("button", { name: "Fetch service metadata" }).click();
  await expect(page.getByText("Test features", { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Join" }).click();
  await page.getByLabel("Power BI / logical dataset field").selectOption("code");
  await page.getByLabel("Join service field").selectOption("CODE");
  const localStats = page.locator(".hp-map-join-preview dl").first();
  await expect(localStats).toContainText("Duplicate keys");
  await expect(localStats.locator("div").last()).toContainText("1");
  await page.getByRole("button", { name: "Run join preview" }).click();
  await expect(page.locator(".hp-map-join-blocker")).toContainText("Match rate is extremely low");
  await expect(page.getByRole("button", { name: "Save join" })).toBeEnabled();
});
