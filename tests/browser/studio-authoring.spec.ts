import { expect, test } from "@playwright/test";

declare global {
  interface Window {
    hpStudioAuthoringHarness: {
      candidate: string;
      draft: string;
      saved: string;
      externalSelections: number[][];
    };
  }
}

test.beforeEach(async ({ page }) => {
  await page.goto("/tests/browser/studio-authoring.html");
  await expect(page.locator(".hp-studio")).toBeVisible();
});

test("validated AI map remains identical in preview, JSON, interactions, and save", async ({ page }) => {
  const candidate = await page.evaluate(() => window.hpStudioAuthoringHarness.candidate);
  await page.locator(".hp-ai-import textarea").fill(candidate);
  await page.getByRole("button", { name: "Validate resulting dashboard & Preview" }).click();
  await expect(page.locator(".hp-import-message")).toContainText("synchronized with the working JSON");

  await expect.poll(async () => page.evaluate(() => {
    const layer = JSON.parse(window.hpStudioAuthoringHarness.draft).components[0].layers[0];
    return [layer.renderer.type, layer.tooltip.fields[0].field, layer.popup.title];
  })).toEqual(["uniqueValue", "asset_id", "{{asset_id}}"]);

  const features = page.locator(".hp-map-frame path.leaflet-interactive");
  await expect(features).toHaveCount(3);
  expect(await features.evaluateAll((items) => items.map((item) => item.getAttribute("fill")))).toEqual(
    expect.arrayContaining(["#2f855a", "#d97706", "#b91c1c"]),
  );

  await features.first().hover();
  await expect(page.locator(".hp-map-tooltip")).toContainText("Asset ID: AS-101");
  await features.first().click();
  await expect(page.locator(".hp-map-feature-details")).toContainText("AS-101");
  await expect(page.locator(".hp-map-feature-details")).not.toContainText("identityIndex");
  await expect(page.locator("tr.hp-row-selected")).toHaveCount(1);
  await expect.poll(() => page.evaluate(() => window.hpStudioAuthoringHarness.externalSelections.length)).toBe(1);

  await features.first().click();
  await expect(page.locator(".hp-map-feature-details")).toBeVisible();
  await expect(page.locator("tr.hp-row-selected")).toHaveCount(1);

  await page.getByRole("button", { name: "Layers" }).click();
  await expect(page.locator(".hp-map-layer-name")).toHaveText("Municipal Assets");
  await expect(page.locator(".hp-map-layer-count")).toHaveCount(0);

  await page.locator(".hp-studio-workspace-group.is-direct > button", { hasText: "JSON" }).click();
  await expect(page.locator(".hp-studio-workspace-select select")).toHaveValue("specification");
  await expect(page.getByRole("button", { name: "Code" })).toHaveCount(0);
  await page.getByLabel("Builder workspace").getByRole("button", { name: "Help" }).click();
  await expect(page.getByRole("menuitem", { name: "AI Skill" })).toBeVisible();

  await page.getByRole("button", { name: "Save & return" }).click();
  await expect.poll(async () => page.evaluate(() => {
    const layer = JSON.parse(window.hpStudioAuthoringHarness.saved).components[0].layers[0];
    return [layer.renderer.type, layer.tooltip.fields[0].field, layer.popup.title];
  })).toEqual(["uniqueValue", "asset_id", "{{asset_id}}"]);
});
