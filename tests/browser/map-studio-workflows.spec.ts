import { expect, test, type Page } from "@playwright/test";

const openStudio = async (page: Page, extra = "") => {
  await page.goto(`/tests/browser/published-map-runtime.html?studio=1${extra}`);
  await expect(page.getByLabel("Search layers", { exact: true })).toBeVisible();
};
const layer = async (page: Page, name = "Facilities") => page.getByRole("button", { name: `Select layer ${name}`, exact: true }).click();
const specification = (page: Page) => page.evaluate(() => JSON.parse(window.publishedMapRuntime.specification).components[0]);

test("Contents supports 100 layers, filtered bulk edits, canonical ordering, group moves and history", async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 700 });
  await openStudio(page, "&layers=100");
  await expect(page.locator(".hp-map-contents-summary")).toContainText("100 layers");
  await page.getByLabel("Search layers", { exact: true }).fill("Report layer 100");
  await expect(page.locator(".hp-map-contents-list [data-layer-id]")).toHaveCount(1);
  await page.getByRole("button", { name: "Select layers", exact: true }).click();
  await page.getByRole("button", { name: "Select all", exact: true }).click();
  await page.getByRole("button", { name: "Show selected", exact: true }).click();
  expect((await specification(page)).layers.find((item: { id: string }) => item.id === "stress-99").visible).toBe(true);
  await page.getByLabel("Move selected to group").selectOption("published-facility-network-operations");
  expect((await specification(page)).layers.find((item: { id: string }) => item.id === "stress-99").groupId).toBe("published-facility-network-operations");
  await page.getByRole("button", { name: "Undo", exact: true }).click();
  expect((await specification(page)).layers.find((item: { id: string }) => item.id === "stress-99").groupId).toBeUndefined();
  await page.getByRole("button", { name: "Redo", exact: true }).click();
  await page.getByRole("button", { name: "Select layers", exact: true }).click();
  await page.getByLabel("Search layers", { exact: true }).fill("");
  await page.getByRole("button", { name: "Actions for Facilities", exact: true }).click();
  await page.getByRole("dialog").getByLabel("Layer name", { exact: true }).fill("Priority facilities");
  await page.getByRole("dialog").getByLabel("Layer name", { exact: true }).press("Enter");
  await page.getByRole("button", { name: "Duplicate this layer" }).click();
  await expect(page.getByRole("button", { name: "Select layer Priority facilities copy", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Actions for Priority facilities copy", exact: true }).click();
  await page.getByRole("button", { name: "Delete this layer" }).click();
  await expect(page.getByRole("button", { name: "Select layer Priority facilities copy", exact: true })).toHaveCount(0);
});

test("selected-feature popup preview updates without remounting Leaflet and saves after reload", async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 700 });
  await openStudio(page);
  await page.getByRole("button", { name: "Close layers panel" }).click();
  await page.locator('[data-hp-layer-id="published-facility-network-facilities"][data-hp-feature-id="B"]').click({ force: true });
  await expect(page.locator(".hp-map-feature-details")).toContainText("North facility");
  await page.locator(".leaflet-container").evaluate(node => node.setAttribute("data-studio-retained", "yes"));
  await page.getByRole("button", { name: "Layers", exact: true }).click();
  await layer(page);
  await page.getByRole("button", { name: "Popup", exact: true }).click();
  await expect(page.getByLabel("Popup preview", { exact: true })).toContainText("North facility");
  await page.getByText("Add Content +", { exact: true }).click();
  await page.getByRole("menuitem", { name: "Formatted field" }).click();
  await page.locator(".hp-popup-block > summary").click();
  await page.getByLabel("Popup block 1 field source").selectOption("service");
  await page.getByLabel("Search Popup block 1 field fields").fill("name");
  await page.getByLabel("Popup block 1 field", { exact: true }).selectOption("name");
  await expect(page.getByLabel("Popup preview", { exact: true })).toContainText("North facility");
  await page.getByRole("button", { name: "Style", exact: true }).click();
  await page.getByLabel("Renderer type").selectOption("simple");
  await page.getByRole("button", { name: "Fill color color picker", exact: true }).click();
  await page.getByRole("button", { name: "Color #dc2626", exact: true }).click();
  await page.getByRole("button", { name: "Close color picker" }).click();
  await expect(page.locator(".leaflet-container")).toHaveAttribute("data-studio-retained", "yes");
  await expect(page.locator('[data-hp-layer-id="published-facility-network-facilities"][data-hp-feature-id="B"]')).toHaveAttribute("fill", "#dc2626");
  await page.getByRole("button", { name: "Save & return", exact: true }).click();
  await page.goto("/tests/browser/published-map-runtime.html?studio=1&saved=1");
  await layer(page);
  await page.getByRole("button", { name: "Popup", exact: true }).click();
  await expect(page.locator(".hp-popup-block")).toHaveCount(1);
  expect((await specification(page)).layers.find((item: { name: string }) => item.name === "Facilities").renderer.symbol.fillColor).toBe("#dc2626");
});

test("a new GeoJSON layer can be imported, styled by a field, reordered and hidden through the UI", async ({ page }) => {
  await page.setViewportSize({ width: 1200, height: 700 });
  await openStudio(page);
  await page.getByRole("button", { name: "Add source", exact: true }).click();
  await page.getByRole("button", { name: "GeoJSON URL or inline data", exact: false }).click();
  await page.getByText("Import a GeoJSON file or paste data", { exact: true }).click();
  const features = { type: "FeatureCollection", features: [
    { type: "Feature", properties: { name: "East", value: 10 }, geometry: { type: "Point", coordinates: [-97.70, 30.29] } },
    { type: "Feature", properties: { name: "West", value: 40 }, geometry: { type: "Point", coordinates: [-97.76, 30.29] } },
  ] };
  await page.getByLabel("Import GeoJSON file").setInputFiles({ name: "districts.geojson", mimeType: "application/geo+json", buffer: Buffer.from(JSON.stringify(features)) });
  await page.getByRole("button", { name: "Style", exact: true }).click();
  await page.getByLabel("field", { exact: true }).selectOption("value");
  await page.getByLabel("Renderer type").selectOption("classBreaks");
  await page.getByRole("button", { name: "Apply Forest palette" }).click();
  expect(await page.locator('.hp-map-style-palettes button i').first().evaluate(node => node.getBoundingClientRect().width)).toBeGreaterThan(5);
  const authored = (await specification(page)).layers.find((item: { id: string }) => item.id === "geojson");
  expect(authored.renderer).toMatchObject({ type: "classBreaks", field: "value", fieldSource: "service" });
  await expect(page.getByLabel("Renderer type").locator('option[value="cluster"]')).toHaveCount(1);
  await page.getByRole("button", { name: "Back to layers" }).click();
  await expect(page.locator('[data-layer-id="geojson"]')).toContainText("2 features");
  await page.getByRole("switch", { name: "Show GeoJSON layer", exact: true }).uncheck();
  expect((await specification(page)).layers.find((item: { id: string }) => item.id === "geojson").visible).toBe(false);
  await expect(page.locator('[data-hp-layer-id="geojson"]')).toHaveCount(0);
});

for (const viewport of [{ width: 1200, height: 700 }, { width: 800, height: 500 }, { width: 500, height: 400 }, { width: 350, height: 300 }]) {
  test(`one bounded drawer and reachable controls at ${viewport.width} × ${viewport.height}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await openStudio(page);
    await layer(page);
    await page.getByRole("button", { name: "Style", exact: true }).click();
    await page.getByLabel("Renderer type").selectOption("simple");
    await page.getByRole("button", { name: "Fill color color picker", exact: true }).click();
    const picker = page.getByRole("dialog", { name: "Fill color colors" });
    const box = await picker.boundingBox();
    expect(box!.x).toBeGreaterThanOrEqual(0); expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width); expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height);
    await page.getByRole("button", { name: "Close color picker" }).click();
    await page.screenshot({ path: test.info().outputPath(`style-${viewport.width}.png`) });
    expect(await page.locator(".hp-map-studio").evaluate(root => root.scrollWidth <= root.clientWidth)).toBe(true);
    await page.getByRole("button", { name: "Close properties panel" }).click();
    await expect(page.locator(".hp-map-studio-properties")).toBeHidden();
    await page.getByRole("button", { name: "Layers", exact: true }).click();
    await page.getByRole("button", { name: "Actions for Facilities", exact: true }).click();
    await page.getByRole("button", { name: "Duplicate this layer" }).click();
    await expect(page.getByRole("button", { name: "Select layer Facilities copy", exact: true })).toBeVisible();
    await layer(page);
    await page.getByRole("button", { name: "Popup", exact: true }).click();
    await page.getByText("Add Content +", { exact: true }).click();
    const menuBox = await page.getByRole("dialog", { name: "Add popup content", exact: true }).boundingBox();
    expect(menuBox!.y + menuBox!.height).toBeLessThanOrEqual(viewport.height);
    expect(menuBox!.x + menuBox!.width).toBeLessThanOrEqual(viewport.width);
    await page.getByRole("menuitem", { name: "Text", exact: true }).click();
    await expect(page.locator(".hp-popup-block")).toHaveCount(1);
    await page.getByRole("button", { name: "Close properties panel" }).click();
    await expect(page.locator(".leaflet-container")).toBeVisible();
  });
}
