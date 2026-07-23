import { expect, test } from "@playwright/test";

test("map gallery loads focused examples and critical analytical workflows", async ({ page }) => {
  await page.goto("/components/map");
  await expect(page.getByRole("heading", { name: "Analytical maps" })).toBeVisible();
  await expect(page.locator(".pg-map-example-nav button")).toHaveCount(29);
  await expect(page.locator(".leaflet-container")).toBeVisible();
  await expect(page.getByText("JSON specification")).toBeVisible();
  await expect(page.getByRole("button", { name: "Copy spec" })).toBeVisible();

  await page.getByRole("button", { name: /Mapped and rotated icons/ }).click();
  await expect(page.locator(".hp-map-rich-marker").first()).toBeVisible();

  await page.getByRole("button", { name: /Filterable categorical legend/ }).click();
  await expect(page.locator(".hp-map-legend")).toBeVisible();
  const firstLegend = page.locator(".hp-map-legend-entry-main").first();
  await firstLegend.hover();
  await expect(page.locator('[data-hp-state="hovered"]').first()).toBeVisible();
  await firstLegend.click();
  await expect(firstLegend).toHaveAttribute("aria-pressed", "true");

  await page.getByRole("button", { name: /Weighted canvas heatmap/ }).click();
  await expect(page.locator("canvas.hp-map-heat-canvas")).toBeVisible();
  await expect(page.locator(".hp-map-legend-gradient")).toBeVisible();

  await page.setViewportSize({ width: 390, height: 760 });
  await page.getByRole("button", { name: /Compact responsive tools/ }).click();
  await expect(page.locator(".hp-map-toolbar")).toBeVisible();
  await expect(page.getByRole("button", { name: "Selection tools" })).toBeVisible();
});
