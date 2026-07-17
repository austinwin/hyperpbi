import { expect, test } from "@playwright/test";

declare global {
  interface Window {
    hpApplicationLayoutHarness: { resizeEvents: number };
  }
}

const storageKey = "hyperpbi:application-layout-browser:split:browser-workspace";

test.beforeEach(async ({ page }) => {
  await page.goto("/tests/browser/application-layout.html");
  await page.evaluate((key) => localStorage.removeItem(key), storageKey);
  await page.reload();
  await expect(page.getByRole("separator")).toBeVisible();
  await expect(page.getByRole("separator")).toHaveAttribute("aria-orientation", "horizontal");
});

test("pointer resize persists constrained pane sizes and emits layout resize", async ({ page }) => {
  const split = page.locator(".hp-split");
  const handle = page.getByRole("separator");
  const splitBox = await split.boundingBox();
  const handleBox = await handle.boundingBox();
  expect(splitBox).not.toBeNull();
  expect(handleBox).not.toBeNull();
  expect(splitBox!.height).toBeGreaterThan(500);

  await page.mouse.move(handleBox!.x + handleBox!.width / 2, handleBox!.y + handleBox!.height / 2);
  await page.mouse.down();
  await page.mouse.move(handleBox!.x + 130, handleBox!.y + handleBox!.height / 2, { steps: 6 });
  await page.mouse.up();

  const resized = await page.locator(".hp-split-pane").evaluateAll((panes) => panes.map((pane) => Number((pane as HTMLElement).style.getPropertyValue("--hp-pane-size"))));
  expect(resized[0]).toBeGreaterThan(38);
  expect(resized[0]).toBeLessThanOrEqual(60);
  expect(resized[0] + resized[1]).toBeCloseTo(100, 3);
  await expect.poll(() => page.evaluate(() => window.hpApplicationLayoutHarness.resizeEvents)).toBeGreaterThan(0);
  expect(await page.evaluate((key) => JSON.parse(localStorage.getItem(key) ?? "[]"), storageKey)).toEqual(resized.map((value) => Math.round(value * 1000) / 1000));

  await page.reload();
  await expect(page.getByRole("separator")).toBeVisible();
  const restored = await page.locator(".hp-split-pane").evaluateAll((panes) => panes.map((pane) => Number((pane as HTMLElement).style.getPropertyValue("--hp-pane-size"))));
  expect(restored).toEqual(resized.map((value) => Math.round(value * 1000) / 1000));
});

test("container breakpoints stack narrow panes and restore desktop handles", async ({ page }) => {
  const split = page.locator(".hp-split");
  await expect(split).toHaveCSS("flex-direction", "row");
  await page.setViewportSize({ width: 390, height: 720 });
  await expect(split).toHaveCSS("flex-direction", "column");
  await expect(page.getByRole("separator")).toBeHidden();
  const narrowPanes = await page.locator(".hp-split-pane").evaluateAll((panes) => panes.map((pane) => getComputedStyle(pane).flexBasis));
  expect(narrowPanes).toEqual(["auto", "auto"]);

  await page.setViewportSize({ width: 900, height: 720 });
  await expect(split).toHaveCSS("flex-direction", "row");
  await expect(page.getByRole("separator")).toBeVisible();
});

test("nested layouts respond to their pane width instead of the outer viewport", async ({ page }) => {
  const nestedGrid = page.locator("[data-hp-id='navigation-layout'] .hp-grid");
  const layoutState = () => nestedGrid.evaluate((node) => {
    const style = getComputedStyle(node);
    const boundary = node.closest(".hp-responsive-container") as HTMLElement | null;
    return {
      columns: style.gridTemplateColumns.split(" ").filter(Boolean).length,
      width: node.getBoundingClientRect().width,
      boundaryWidth: boundary?.getBoundingClientRect().width,
      boundaryContainer: boundary ? getComputedStyle(boundary).containerType : undefined,
      xs: style.getPropertyValue("--hp-layout-columns-xs"),
      sm: style.getPropertyValue("--hp-layout-columns-sm"),
    };
  });
  expect(await layoutState()).toMatchObject({ columns: 1, boundaryContainer: "inline-size", xs: "1", sm: "2" });
  await page.setViewportSize({ width: 1800, height: 720 });
  await expect.poll(async () => (await layoutState()).columns).toBe(2);
});
