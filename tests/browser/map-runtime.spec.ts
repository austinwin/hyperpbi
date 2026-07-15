import { expect, test } from "@playwright/test";

declare global {
  interface Window {
    hpMapHarness: {
      updateRenderer: () => void;
      updateOpacity: () => void;
      updateDetails: () => void;
      refreshSameFeatures: () => void;
      removeActiveFeature: () => void;
      enableCluster: () => void;
      toggleDark: () => void;
      selectedRows: number[];
      selectedMulti: boolean;
      selectionCalls: number;
    };
  }
}

test.beforeEach(async ({ page }) => {
  await page.goto("/tests/browser/map-runtime.html");
  await expect(page.locator(".leaflet-container")).toBeVisible();
});

test("one click selects points, lines, and polygons and keeps details stable", async ({ page }) => {
  for (const [layerId, title] of [["points", "Point Alpha"], ["lines", "Line Alpha"], ["polygons", "Polygon Alpha"]] as const) {
    await page.locator(`[data-hp-layer-id="${layerId}"]`).first().click({ force: true });
    const details = page.locator(".hp-map-feature-details");
    await expect(details).toContainText(title);
    await expect(details).toBeVisible();
  }
});

test("normal repeat click never toggles off and modifier click supports multi-selection", async ({ page }) => {
  const alpha = page.locator('[data-hp-layer-id="points"][data-hp-feature-id="duplicate"]');
  const beta = page.locator('[data-hp-layer-id="points"][data-hp-feature-id="second"]');
  await alpha.click({ force: true });
  await alpha.click({ force: true });
  await expect(page.locator('.hp-map-feature-details[data-feature-key]')).toContainText("Point Alpha");
  await beta.click({ force: true, modifiers: ["Control"] });
  await expect(page.locator(".hp-map-feature-details-header")).toContainText("2 features selected");
});

test("modifier-deselecting the active feature activates the most recent remaining selection", async ({ page }) => {
  const alpha = page.locator('[data-hp-layer-id="points"][data-hp-feature-id="duplicate"]');
  const beta = page.locator('[data-hp-layer-id="points"][data-hp-feature-id="second"]');
  await alpha.click({ force: true });
  await beta.click({ force: true, modifiers: ["Control"] });
  await expect(page.locator(".hp-map-feature-details")).toContainText("Point Beta");
  await beta.click({ force: true, modifiers: ["Control"] });
  await expect(page.locator(".hp-map-feature-details")).toContainText("Point Alpha");
  await expect(page.locator(".hp-map-feature-details-header")).not.toContainText("2 features selected");
  await alpha.click({ force: true, modifiers: ["Control"] });
  await expect(page.locator(".hp-map-feature-details")).toHaveCount(0);
});

test("visual, opacity, content, and retained refresh updates do not recreate geometry or close details", async ({ page }) => {
  const alpha = page.locator('[data-hp-layer-id="points"][data-hp-feature-id="duplicate"]');
  await alpha.click({ force: true });
  await alpha.evaluate((element) => element.setAttribute("data-object-probe", "stable"));
  await page.evaluate(() => window.hpMapHarness.updateRenderer());
  await page.evaluate(() => window.hpMapHarness.updateOpacity());
  await page.evaluate(() => window.hpMapHarness.updateDetails());
  await page.evaluate(() => window.hpMapHarness.refreshSameFeatures());
  await expect(page.locator('[data-object-probe="stable"]')).toHaveCount(1);
  await expect(page.locator(".hp-map-feature-details")).toContainText("Updated Point Alpha");
  await expect(page.locator(".hp-map-feature-details")).toBeVisible();
  const metrics = await page.locator(".hp-leaflet-container").evaluate((element) => ({
    created: element.getAttribute("data-feature-objects-created"),
    patched: element.getAttribute("data-feature-objects-patched"),
  }));
  expect(Number(metrics.created)).toBe(4);
  expect(Number(metrics.patched)).toBeGreaterThan(0);
});

test("duplicate IDs remain isolated, close keeps selection, and removed active features close cleanly", async ({ page }) => {
  await page.locator('[data-hp-layer-id="points"][data-hp-feature-id="duplicate"]').click({ force: true });
  const pointKey = await page.locator(".hp-map-feature-details").getAttribute("data-feature-key");
  await page.locator('[aria-label="Close feature details"]').click();
  await expect(page.locator(".hp-map-feature-details")).toHaveCount(0);
  await page.locator('[data-hp-layer-id="lines"][data-hp-feature-id="duplicate"]').click({ force: true });
  await expect(page.locator(".hp-map-feature-details")).toContainText("Line Alpha");
  expect(await page.locator(".hp-map-feature-details").getAttribute("data-feature-key")).not.toBe(pointKey);
  await page.locator('[data-hp-layer-id="points"][data-hp-feature-id="duplicate"]').click({ force: true });
  await page.evaluate(() => window.hpMapHarness.removeActiveFeature());
  await expect(page.locator(".hp-map-feature-details")).toHaveCount(0);
});

test("configured background clearing does not consume feature clicks", async ({ page }) => {
  await page.locator('[data-hp-layer-id="points"][data-hp-feature-id="duplicate"]').click({ force: true });
  await expect(page.locator(".hp-map-feature-details")).toContainText("Point Alpha");
  await page.locator(".leaflet-container").click({ position: { x: 8, y: 500 } });
  await expect(page.locator(".hp-map-feature-details")).toHaveCount(0);
});

test("joined feature clicks select the mapped Power BI row exactly once", async ({ page }) => {
  await page.locator('[data-hp-layer-id="points"][data-hp-feature-id="duplicate"]').click({ force: true });
  expect(await page.evaluate(() => window.hpMapHarness.selectedRows)).toEqual([1]);
  expect(await page.evaluate(() => window.hpMapHarness.selectedMulti)).toBe(false);
  expect(await page.evaluate(() => window.hpMapHarness.selectionCalls)).toBe(1);
  await page.locator('[data-hp-layer-id="points"][data-hp-feature-id="second"]').click({ force: true, modifiers: ["Control"] });
  expect(await page.evaluate(() => window.hpMapHarness.selectedRows)).toEqual([1, 0]);
  expect(await page.evaluate(() => window.hpMapHarness.selectedMulti)).toBe(true);
  expect(await page.evaluate(() => window.hpMapHarness.selectionCalls)).toBe(2);
});

test("cluster expansion retains deterministic child feature interaction", async ({ page }) => {
  await page.evaluate(() => window.hpMapHarness.enableCluster());
  const cluster = page.locator(".hp-map-cluster-icon");
  await expect(cluster).toBeVisible();
  await cluster.click();
  const beta = page.locator('[data-hp-layer-id="points"][data-hp-feature-id="second"]');
  await expect(beta).toBeVisible();
  await beta.click({ force: true });
  await expect(page.locator(".hp-map-feature-details")).toContainText("Point Beta");
});

test("toolbar/popover layering, Escape, resize, narrow sheet, clipping, and dark mode remain usable", async ({ page }) => {
  await page.locator('[data-hp-layer-id="points"][data-hp-feature-id="duplicate"]').click({ force: true });
  await page.getByRole("button", { name: "Layers" }).click();
  const popover = page.locator(".hp-map-toolbar-popover");
  await expect(popover).toBeVisible();
  const z = await page.evaluate(() => ({
    details: getComputedStyle(document.querySelector(".hp-map-feature-details")!).zIndex,
    popover: getComputedStyle(document.querySelector(".hp-map-toolbar-popover")!).zIndex,
  }));
  expect(Number(z.popover)).toBeGreaterThan(Number(z.details));
  await page.keyboard.press("Escape");
  await expect(popover).toHaveCount(0);
  const desktopBoxes = await page.evaluate(() => {
    const details = document.querySelector(".hp-map-feature-details")!.getBoundingClientRect();
    const frame = document.querySelector(".hp-map-frame")!.getBoundingClientRect();
    return { details: { left: details.left, right: details.right, top: details.top, bottom: details.bottom }, frame: { left: frame.left, right: frame.right, top: frame.top, bottom: frame.bottom } };
  });
  expect(desktopBoxes.details.left).toBeGreaterThanOrEqual(desktopBoxes.frame.left);
  expect(desktopBoxes.details.right).toBeLessThanOrEqual(desktopBoxes.frame.right);
  expect(desktopBoxes.details.top).toBeGreaterThanOrEqual(desktopBoxes.frame.top);
  expect(desktopBoxes.details.bottom).toBeLessThanOrEqual(desktopBoxes.frame.bottom);
  await page.setViewportSize({ width: 390, height: 760 });
  await expect(page.locator(".hp-map-feature-details")).toBeVisible();
  const boxes = await page.evaluate(() => {
    const details = document.querySelector(".hp-map-feature-details")!.getBoundingClientRect();
    const frame = document.querySelector(".hp-map-frame")!.getBoundingClientRect();
    return { details: { left: details.left, right: details.right, bottom: details.bottom }, frame: { left: frame.left, right: frame.right, bottom: frame.bottom } };
  });
  expect(boxes.details.left).toBeGreaterThanOrEqual(boxes.frame.left);
  expect(boxes.details.right).toBeLessThanOrEqual(boxes.frame.right);
  expect(boxes.details.bottom).toBeLessThanOrEqual(boxes.frame.bottom);
  await page.evaluate(() => window.hpMapHarness.toggleDark());
  await expect(page.locator(".hp-map-feature-details")).toHaveCSS("color", "rgb(226, 232, 240)");
  await page.keyboard.press("Escape");
  await expect(page.locator(".hp-map-feature-details")).toHaveCount(0);
});
