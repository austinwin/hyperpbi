import { expect, test, type Page } from "@playwright/test";

declare global {
  interface Window {
    hpMapDemo: {
      ready: boolean;
      selectedRows: number[];
      selectedMulti: boolean;
      selectionCalls: number;
      arcGisRequestCount: number;
      interaction?: {
        selectedFeatureKeys: string[];
        activeFeature?: { featureKey: string; layerId: string; featureId: string };
      };
      updateRenderer: () => void;
      refreshArcGis: () => void;
    };
  }
}

async function openDemo(page: Page, demo: string) {
  await page.goto(`/tests/browser/map-demo.html?demo=${demo}`);
  await expect.poll(() => page.evaluate(() => window.hpMapDemo.ready)).toBe(true);
  await expect(page.locator(".leaflet-container")).toBeVisible();
}

test("feature showcase proves one-click, stable repeat click, and visual patching", async ({ page }) => {
  await openDemo(page, "feature");
  const asset = page.locator('[data-hp-layer-id="municipal-assets"][data-hp-feature-id="AS-101"]');
  await asset.click();
  const details = page.locator(".hp-map-feature-details");
  await expect(details).toContainText("AS-101");
  await expect(details).toContainText("Pump Station");
  await asset.evaluate((element) => element.setAttribute("data-demo-object", "stable"));
  await asset.click();
  await expect(details).toContainText("AS-101");
  expect(await page.evaluate(() => window.hpMapDemo.interaction?.selectedFeatureKeys.length)).toBe(1);
  await page.evaluate(() => window.hpMapDemo.updateRenderer());
  await expect(page.locator('[data-demo-object="stable"]')).toHaveCount(1);
  await expect(details).toContainText("AS-101");
});

test("multiple geometry layers remain independently clickable and canonically isolated", async ({ page }) => {
  await openDemo(page, "geometries");
  const point = page.locator('[data-hp-layer-id="facilities"][data-hp-feature-id="A-01"]');
  const line = page.locator('[data-hp-layer-id="network-segments"][data-hp-feature-id="A-01"]');
  const polygon = page.locator('[data-hp-layer-id="priority-areas"][data-hp-feature-id="Z-01"]');
  await expect(point).toBeVisible();
  await expect(line).toBeVisible();
  await expect(polygon).toBeVisible();

  await point.click();
  await expect(page.locator(".hp-map-feature-details")).toContainText("Facility A-01");
  const pointKey = await page.locator(".hp-map-feature-details").getAttribute("data-feature-key");

  const lineBox = await line.boundingBox();
  expect(lineBox).not.toBeNull();
  await line.click({
    position: { x: lineBox!.width / 2, y: Math.max(1, lineBox!.height - 2) },
  });
  await expect(page.locator(".hp-map-feature-details")).toContainText("Segment A-01");
  const lineKey = await page.locator(".hp-map-feature-details").getAttribute("data-feature-key");
  expect(lineKey).not.toBe(pointKey);
  expect(await page.evaluate(() => window.hpMapDemo.interaction?.selectedFeatureKeys.length)).toBe(1);

  await polygon.click({ position: { x: 6, y: 6 } });
  await expect(page.locator(".hp-map-feature-details")).toContainText("Area Z-01");

  await point.click();
  await page.getByRole("button", { name: "Layers" }).click();
  await page.getByRole("button", { name: "Hide Network Segments" }).click();
  await expect(page.locator(".hp-map-feature-details")).toContainText("Facility A-01");
  expect(await page.evaluate(() => window.hpMapDemo.interaction?.activeFeature?.layerId)).toBe("facilities");
  await expect(page.getByRole("button", { name: "Move Facilities up" })).toBeVisible();
});

test("selection details follows explicit modifier deselection, close, background, Escape, and narrow layout", async ({ page }) => {
  await openDemo(page, "selection");
  const first = page.locator('[data-hp-layer-id="response-sites"][data-hp-feature-id="ST-201"]');
  const second = page.locator('[data-hp-layer-id="response-sites"][data-hp-feature-id="ST-202"]');
  await first.click();
  await second.click({ modifiers: ["Control"] });
  await expect(page.locator(".hp-map-feature-details-header")).toContainText("2 features selected");
  await second.click({ modifiers: ["Control"] });
  await expect(page.locator(".hp-map-feature-details")).toContainText("ST-201");
  expect(await page.evaluate(() => window.hpMapDemo.interaction?.selectedFeatureKeys)).toHaveLength(1);
  await first.click({ modifiers: ["Control"] });
  await expect(page.locator(".hp-map-feature-details")).toHaveCount(0);
  expect(await page.evaluate(() => window.hpMapDemo.interaction?.selectedFeatureKeys ?? [])).toEqual([]);

  await first.click();
  await page.getByRole("button", { name: "Close feature details" }).click();
  await expect(page.locator(".hp-map-feature-details")).toHaveCount(0);
  expect(await page.evaluate(() => window.hpMapDemo.interaction?.selectedFeatureKeys)).toHaveLength(1);
  await first.click();
  await page.keyboard.press("Escape");
  await expect(page.locator(".hp-map-feature-details")).toHaveCount(0);
  expect(await page.evaluate(() => window.hpMapDemo.interaction?.selectedFeatureKeys)).toHaveLength(1);

  await first.click();
  const containerBox = await page.locator(".leaflet-container").boundingBox();
  expect(containerBox).not.toBeNull();
  await page.locator(".leaflet-container").click({
    position: { x: 10, y: Math.max(10, containerBox!.height - 10) },
  });
  await expect(page.locator(".hp-map-feature-details")).toHaveCount(0);
  expect(await page.evaluate(() => window.hpMapDemo.interaction?.selectedFeatureKeys ?? [])).toEqual([]);

  await page.setViewportSize({ width: 390, height: 760 });
  await first.click();
  const bounds = await page.evaluate(() => {
    const frame = document.querySelector(".hp-map-frame")!.getBoundingClientRect();
    const details = document.querySelector(".hp-map-feature-details")!.getBoundingClientRect();
    const toolbar = document.querySelector(".hp-map-toolbar")!.getBoundingClientRect();
    return {
      contained:
        details.left >= frame.left &&
        details.right <= frame.right &&
        details.top >= frame.top &&
        details.bottom <= frame.bottom,
      bottomGap: Math.round(frame.bottom - details.bottom),
      overlapsToolbar:
        details.left < toolbar.right &&
        details.right > toolbar.left &&
        details.top < toolbar.bottom &&
        details.bottom > toolbar.top,
    };
  });
  expect(bounds.contained).toBe(true);
  expect(bounds.bottomGap).toBeLessThanOrEqual(10);
  expect(bounds.overlapsToolbar).toBe(false);
});

test("ArcGIS joined selection and details survive a retained-feature refresh", async ({ page }) => {
  await openDemo(page, "arcgis");
  const feature = page.locator('[data-hp-layer-id="joined-facilities"]').first();
  await expect(feature).toBeVisible();
  await feature.click();
  const details = page.locator(".hp-map-feature-details");
  await expect(details).toContainText("Facility");
  const featureKey = await details.getAttribute("data-feature-key");
  await feature.evaluate((element) => element.setAttribute("data-arcgis-object", "retained"));
  const requests = await page.evaluate(() => window.hpMapDemo.arcGisRequestCount);
  await page.evaluate(() => window.hpMapDemo.refreshArcGis());
  await expect.poll(() => page.evaluate(() => window.hpMapDemo.arcGisRequestCount)).toBeGreaterThan(requests);
  await expect(details).toHaveAttribute("data-feature-key", featureKey!);
  await expect(details).toBeVisible();
  await expect(page.locator('[data-arcgis-object="retained"]')).toHaveCount(1);
  expect(await page.evaluate(() => window.hpMapDemo.interaction?.selectedFeatureKeys)).toEqual([featureKey]);
  expect(await page.evaluate(() => window.hpMapDemo.selectedRows)).toHaveLength(1);
});
