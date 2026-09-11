import { expect, test } from "@playwright/test";

test("directed dense graph keeps edges visible and entity colors distinct", async ({ page }) => {
  await page.goto("/tests/browser/network-mermaid.html?mode=network");
  const graph = page.locator("[data-hp-id='dense_network']");
  await expect(graph.locator("svg")).toBeVisible();
  await expect.poll(async () => graph.locator("svg path").count()).toBeGreaterThan(20);
  const svg = await graph.locator("svg").innerHTML();
  expect(svg).toContain("#2563EB"); expect(svg).toContain("#7C3AED"); expect(svg).toContain("#16A34A");
  const pathsBefore = await graph.locator("svg path").count();
  const box = await graph.locator("svg").boundingBox();
  expect(box).not.toBeNull();
  await page.mouse.move(box!.x + box!.width * .2, box!.y + box!.height * .5);
  await page.mouse.down(); await page.mouse.move(box!.x + box!.width * .25, box!.y + box!.height * .55, { steps: 4 }); await page.mouse.up();
  await expect.poll(async () => graph.locator("svg path").count()).toBe(pathsBefore);
  await page.screenshot({ path: "test-results/network-directed-dense.png", fullPage: true });
});

test("bound Mermaid node filters another HyperPBI component and remains keyboard accessible", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto("/tests/browser/network-mermaid.html?mode=mermaid");
  const node = page.locator("[data-hp-mermaid-node='WO']");
  await expect(node).toBeVisible({ timeout: 15_000 }); await expect(node).toHaveAttribute("role", "button"); await expect(node).toHaveAttribute("tabindex", "0");
  await node.press("Enter");
  await expect(page.locator("[data-hp-id='details'] tbody tr")).toHaveCount(1);
  await expect(node).toHaveClass(/is-hp-selected/);
  await expect(page.getByText("Work Order 5", { exact: true })).toBeVisible();
  await page.screenshot({ path: "test-results/mermaid-interaction.png", fullPage: true });
});

test("invalid Mermaid syntax shows a controlled error without inserting an error SVG", async ({ page }) => {
  await page.goto("/tests/browser/network-mermaid.html?mode=invalid");
  const invalid = page.locator("[data-hp-id='invalid_mermaid']");
  await expect(invalid.getByRole("alert")).toContainText("Mermaid diagram could not be rendered");
  await expect(invalid.locator("svg")).toHaveCount(0);
});
