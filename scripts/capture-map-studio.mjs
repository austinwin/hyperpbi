import { chromium } from "@playwright/test";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";

// Start Vite on 4179, then run: node scripts/capture-map-studio.mjs [output-directory]
const output = resolve(process.argv[2] ?? ".tmp/map-studio-review");
await mkdir(output, { recursive: true });
const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1200, height: 700 }, reducedMotion: "reduce" });
  const capture = async name => { await page.mouse.move(1150, 680); await page.screenshot({ path: resolve(output, `${name}.png`), animations: "disabled" }); };
  await page.goto("http://127.0.0.1:4179/tests/browser/published-map-runtime.html?studio=1");
  await page.locator(".hp-map-contents-summary").waitFor();
  await capture("after-layers");
  await page.getByRole("button", { name: "Close layers panel" }).click();
  await capture("after-default");
  await page.getByRole("button", { name: "Add source", exact: true }).click();
  await capture("after-source-picker");
  await page.getByRole("button", { name: "Close source panel" }).click();
  await page.locator('[data-hp-layer-id="published-facility-network-facilities"][data-hp-feature-id="B"]').click({ force: true });
  await page.locator(".hp-map-feature-details").waitFor();
  await capture("after-feature-card");
  await page.getByRole("button", { name: "Layers", exact: true }).click();
  await page.getByRole("button", { name: "Select layer Facilities", exact: true }).click();
  await page.getByRole("button", { name: "Style", exact: true }).click();
  await page.getByLabel("Renderer type").selectOption("simple");
  await capture("after-style");
  await page.getByLabel("Renderer type").selectOption("classBreaks");
  await page.getByRole("button", { name: "Apply Forest palette" }).click();
  await page.getByRole("button", { name: "Generate editable manual breaks" }).click();
  await page.getByLabel("Break 1 minimum").scrollIntoViewIfNeeded();
  await capture("after-classification");
  await page.getByRole("button", { name: "Labels", exact: true }).click();
  await capture("after-labels");
  await page.getByRole("button", { name: "Popup", exact: true }).click();
  await page.getByText("Add Content +", { exact: true }).click();
  await page.getByRole("menuitem", { name: "Formatted field", exact: true }).click();
  await page.locator(".hp-popup-block > summary").click();
  await page.getByLabel("Popup block 1 field source").selectOption("service");
  await page.getByLabel("Popup block 1 field", { exact: true }).selectOption("name");
  await page.locator(".hp-popup-builder").scrollIntoViewIfNeeded();
  await capture("after-popup-builder");
  for (const viewport of [{ width: 1200, height: 700 }, { width: 800, height: 500 }, { width: 500, height: 400 }, { width: 350, height: 300 }]) {
    await page.setViewportSize(viewport);
    await page.getByRole("button", { name: "Close properties panel" }).click();
    await page.getByRole("button", { name: "Layers", exact: true }).click();
    await capture(`after-${viewport.width}x${viewport.height}`);
    await page.getByRole("button", { name: "Select layer Facilities", exact: true }).click();
  }
  await page.setViewportSize({ width: 1200, height: 700 });
  await page.goto("http://127.0.0.1:4179/tests/browser/published-map-runtime.html?studio=1&theme=dark");
  await page.locator(".hp-map-contents-summary").waitFor();
  await capture("after-dark-theme");
  process.stdout.write(`Saved Map Studio screenshots to ${output}\n`);
} finally {
  await browser.close();
}
