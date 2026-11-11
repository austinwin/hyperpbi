import { expect, test } from "@playwright/test";
import { monitorWebGl, verifyMultiStationExplorer } from "../../../tests/browser/support/scene3dBrowser";

test.use({ launchOptions: { args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] } });

test("switches stations from the Playground gallery and keeps reporting-day changes in place", async ({ page }) => {
    await page.addInitScript(monitorWebGl);
    await page.goto("/examples/multi-station-3d-explorer");
    await verifyMultiStationExplorer(page);
});

test("renders the station, changes operating status, and links equipment and the register", async ({ page }) => {
    await page.goto("/examples/pump-station-monitoring");
    const scene = page.locator(".hp-scene3d");
    const equipment = scene.getByRole("complementary", { name: "Scene objects" });
    const canvas = scene.locator("canvas");
    await expect(canvas).toBeVisible({ timeout: 45_000 });
    const label = scene.locator(".hp-scene3d-labels").getByRole("button", { name: "P-103", exact: true });
    await expect(label).toBeVisible();
    await page.getByRole("button", { name: "Peak demand", exact: true }).click();
    await expect(equipment.getByRole("button", { name: "P-103 Warning" })).toBeVisible();
    await expect(page.locator("[data-hp-id=station_alerts] .hp-metric-value")).toHaveText("1");
    await expect(page.locator("[data-hp-id=station_online] .hp-metric-value")).toHaveText("4");

    await scene.getByRole("button", { name: "Top view" }).click();
    await expect(label).toBeVisible();
    const tag = await label.boundingBox();
    expect(tag).toBeTruthy();
    // A projected tag ends just above the pump anchor. In top view the mesh occupies the pixels underneath.
    await page.mouse.click(tag!.x + tag!.width / 2, tag!.y + tag!.height + 5);
    await expect(equipment.getByRole("button", { name: "P-103 Warning" })).toHaveAttribute("aria-pressed", "true");
    const register = page.locator("[data-hp-id=asset_register] tbody");
    await expect(register.getByRole("row")).toHaveCount(1);
    await expect(register.getByRole("row")).toContainText("P-103");
    await scene.getByRole("button", { name: "Clear selection" }).click();
    await expect(register.getByRole("row")).toHaveCount(4);
    await register.getByRole("row").filter({ hasText: "P-104" }).click();
    await expect(equipment.getByRole("button", { name: "P-104 Running" })).toHaveAttribute("aria-pressed", "true");
    await scene.getByRole("button", { name: "Labels", exact: true }).click();
    await expect(label).toHaveCount(0);
    await page.getByRole("button", { name: "Maintenance", exact: true }).click();
    await expect(equipment.getByRole("button", { name: "P-102 Stopped" })).toBeVisible();
});

test("keeps linked keyboard selection available after WebGL context loss", async ({ page }) => {
    await page.setViewportSize({ width: 510, height: 780 });
    await page.goto("/examples/pump-station-monitoring");
    const scene = page.locator(".hp-scene3d");
    const canvas = scene.locator("canvas");
    await expect(canvas).toBeVisible({ timeout: 45_000 });
    await canvas.evaluate(element => {
        (element as HTMLCanvasElement).getContext("webgl2")!.getExtension("WEBGL_lose_context")!.loseContext();
    });
    await expect(scene.getByText("The 3D graphics context was lost.")).toBeVisible();
    await expect(canvas).toHaveCount(0);
    const pump = scene.getByRole("complementary", { name: "Scene objects" }).getByRole("button", { name: "P-101 Running" });
    await pump.focus();
    await page.keyboard.press("Enter");
    await expect(pump).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("[data-hp-id=asset_register] tbody tr")).toHaveCount(3);
    await scene.getByRole("button", { name: "Retry 3D view" }).click();
    await expect(canvas).toBeVisible();
});

test("clicks leave the camera idle and only held drags orbit or pan", async ({ page }) => {
    await page.goto("/examples/pump-station-monitoring");
    const scene = page.locator(".hp-scene3d");
    const canvas = scene.locator("canvas");
    await expect(canvas).toBeVisible({ timeout: 45_000 });
    const label = scene.locator(".hp-scene3d-labels").getByRole("button", { name: "P-103", exact: true });
    const pump = scene.getByRole("complementary", { name: "Scene objects" }).getByRole("button", { name: "P-103 Running" });
    await expect(label).toBeVisible();
    const pose = () => label.evaluate(element => element.style.transform);
    const initial = await pose();
    await scene.getByRole("button", { name: "Top view" }).click();
    await expect.poll(pose).not.toBe(initial);
    const top = await pose();
    const tag = (await label.boundingBox())!;
    const x = tag.x + tag.width / 2;
    const y = tag.y + tag.height + 5;

    await page.mouse.move(x, y);
    await expect(canvas).toHaveCSS("cursor", "pointer");
    await page.mouse.down();
    await page.mouse.move(x + 2, y + 1);
    await expect(canvas).toHaveCSS("cursor", "pointer");
    await page.mouse.up();
    await expect(pump).toHaveAttribute("aria-pressed", "true");
    await expect(canvas).toHaveCSS("cursor", "pointer");
    await page.mouse.move(x, y);
    await expect(canvas).toHaveCSS("cursor", "pointer");
    expect(await pose()).toBe(top);

    await page.mouse.click(x, y);
    await expect(pump).toHaveAttribute("aria-pressed", "false");
    await page.mouse.move(x + 2, y + 2);
    await expect(canvas).toHaveCSS("cursor", "pointer");
    expect(await pose()).toBe(top);

    await page.mouse.down();
    await page.mouse.move(x + 45, y + 25, { steps: 4 });
    await expect(canvas).toHaveCSS("cursor", "grabbing");
    await expect.poll(pose).not.toBe(top);
    await page.mouse.up();
    await expect(canvas).not.toHaveCSS("cursor", "grabbing");
    await expect(pump).toHaveAttribute("aria-pressed", "false");
    const orbited = await pose();

    await page.mouse.down({ button: "right" });
    await page.mouse.move(x + 72, y + 48, { steps: 4 });
    await expect(canvas).toHaveCSS("cursor", "grabbing");
    await expect.poll(pose).not.toBe(orbited);
    await page.mouse.up({ button: "right" });
    await expect(canvas).not.toHaveCSS("cursor", "grabbing");
    await expect(pump).toHaveAttribute("aria-pressed", "false");
    const panned = await pose();
    await page.mouse.wheel(0, -120);
    await expect.poll(pose).not.toBe(panned);
});

test("traces the remote well through treatment and into residential distribution", async ({ page }) => {
    await page.goto("/examples/groundwater-supply-distribution");
    const scene = page.locator(".hp-scene3d");
    await expect(scene.locator("canvas")).toBeVisible({ timeout: 45_000 });
    const assets = scene.getByRole("complementary", { name: "Scene objects" });
    const remote = assets.getByRole("button", { name: "Remote well Running" });
    await expect(remote).toBeVisible();
    await page.getByRole("button", { name: "Remote well offline", exact: true }).click();
    await expect(assets.getByRole("button", { name: "Remote well Offline" })).toBeVisible();
    await expect(page.locator("[data-hp-id=groundwater_wells] .hp-metric-value")).toHaveText("1");
    await assets.getByRole("button", { name: "Remote well Offline" }).click();
    const register = page.locator("[data-hp-id=groundwater_assets] tbody");
    await expect(register.getByRole("row")).toHaveCount(1);
    await expect(register.getByRole("row")).toContainText("Remote well");
    await scene.getByRole("button", { name: "Clear selection" }).click();
    await expect(register.getByRole("row")).toHaveCount(8);
    await register.getByRole("row").filter({ hasText: "Maple Court" }).click();
    await expect(assets.getByRole("button", { name: "Maple Court Reduced flow" })).toHaveAttribute("aria-pressed", "true");
});

test("selects the tank and updates its level, pump colors, and flow with the scenario", async ({ page }) => {
    await page.goto("/examples/groundwater-supply-distribution");
    const scene = page.locator(".hp-scene3d");
    const canvas = scene.locator("canvas");
    await expect(canvas).toBeVisible({ timeout: 45_000 });
    const level = page.locator("[data-hp-id=groundwater_level] .hp-metric-value");
    const trend = page.locator("[data-hp-id=groundwater_level_history] [_echarts_instance_]");
    const tank = scene.getByRole("complementary", { name: "Scene objects" }).getByRole("button", { name: /Clearwell/ });
    const pump = scene.getByRole("complementary", { name: "Scene objects" }).getByRole("button", { name: /Remote well/ });
    const label = scene.locator(".hp-scene3d-labels").getByRole("button", { name: /Clearwell/ });
    await expect(level).toHaveText("78");
    await expect(label).toHaveText("Clearwell · 78%");
    await expect(pump.locator("i")).toHaveCSS("background-color", "rgb(38, 166, 106)");

    const viewBefore = await label.evaluate(element => element.style.transform);
    await scene.getByRole("button", { name: "Top view" }).click();
    await expect.poll(() => label.evaluate(element => element.style.transform)).not.toBe(viewBefore);
    const tag = (await label.boundingBox())!;
    await page.mouse.click(tag.x + tag.width / 2, tag.y + tag.height + 5);
    await expect(tank).toHaveAttribute("aria-pressed", "true");
    await expect(page.locator("[data-hp-id=groundwater_assets] tbody tr")).toHaveCount(3);
    await expect(page.locator("[data-hp-id=groundwater_assets] tbody")).toContainText("Clearwell");

    await scene.getByRole("button", { name: "Clear selection" }).click();
    await page.getByRole("button", { name: "Remote well offline", exact: true }).click();
    await expect(level).toHaveText("43");
    await expect(label).toHaveText("Clearwell · 43%");
    await expect(pump.locator("i")).toHaveCSS("background-color", "rgb(217, 72, 75)");
    await expect(trend).toBeVisible();
    await canvas.scrollIntoViewIfNeeded();
    const frame = await canvas.screenshot();
    await expect.poll(async () => (await canvas.screenshot()).equals(frame)).toBe(false);
    await scene.getByRole("button", { name: "Pause flow" }).click();
    await expect(scene.getByRole("button", { name: "Play flow" })).toBeVisible();
    const paused = await canvas.screenshot();
    expect((await canvas.screenshot()).equals(paused)).toBe(true);

    await page.getByRole("button", { name: "Peak demand", exact: true }).click();
    await expect(level).toHaveText("61");
    await expect(label).toHaveText("Clearwell · 61%");
    await page.emulateMedia({ reducedMotion: "reduce" });
    await expect(scene.getByRole("button", { name: "Play flow" })).toHaveCount(0);
});

test("authors scene objects and embeds a local glTF through the Inspector", async ({ page }) => {
    await page.goto("/");
    const card = page.locator(".pg-example-card").filter({ hasText: "Pump Station Monitoring" });
    await card.getByRole("button", { name: "Load example" }).click({ timeout: 45_000 });
    await expect(page).toHaveURL(/\/project\/[^/]+$/);
    await expect(page.locator(".hp-studio")).toBeVisible({ timeout: 30_000 });
    const advanced = page.getByRole("button", { name: /^Advanced( controls)?$/ });
    if (await advanced.isVisible()) await advanced.click();
    const select = page.locator(".hp-studio-workspace-select select");
    if (await select.isVisible()) await select.selectOption("inspector");
    else {
        const navigation = page.getByRole("navigation", { name: "Builder workspace" });
        await navigation.getByRole("button", { name: /^Create(?::|$)/ }).click();
        await navigation.getByRole("menuitem", { name: /^Visual Inspector/ }).click();
    }
    await page.locator("[data-tree-id=station_scene]").click();
    const editor = page.locator(".hp-scene3d-editor").first();
    await editor.getByLabel("Shape or equipment").selectOption("box");
    await editor.getByRole("button", { name: "Add object", exact: true }).click();
    await editor.getByLabel("Object label", { exact: true }).fill("Control cabinet");
    await editor.getByLabel("Object label", { exact: true }).press("Tab");
    await expect(editor.getByLabel("Edit object").locator("option:checked")).toContainText("Control cabinet");
    const position = editor.getByRole("spinbutton", { name: "Position X", exact: true });
    await position.fill("-2");
    await position.press("Tab");
    await expect(position).toHaveValue("-2");
    await expect(editor.getByLabel("Edit object")).toHaveValue("box_1");
    const source = editor.getByRole("combobox", { name: "Scene source" });
    await source.selectOption("data");
    await expect(editor.getByText(/Station key field.+missing/)).toBeVisible();
    await expect(editor.getByLabel("Edit object")).toHaveValue("box_1");
    await source.selectOption("direct");
    await expect(editor.getByLabel("Edit object")).toHaveValue("box_1");

    const positions = Buffer.from(new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 1]).buffer);
    const model = {
        asset: { version: "2.0" }, scene: 0, scenes: [{ nodes: [0] }], nodes: [{ mesh: 0 }],
        meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }],
        accessors: [{ bufferView: 0, componentType: 5126, count: 3, type: "VEC3", min: [0, 0, 0], max: [1, 1, 1] }],
        bufferViews: [{ buffer: 0, byteLength: positions.length }],
        buffers: [{ byteLength: positions.length, uri: `data:application/octet-stream;base64,${positions.toString("base64")}` }],
    };
    const importer = editor.getByLabel("Import model", { exact: true });
    await importer.setInputFiles({ name: "intake.gltf", mimeType: "model/gltf+json", buffer: Buffer.from(JSON.stringify(model)) });
    await expect(editor.getByLabel("Edit object")).toHaveValue("model_1");
    await page.getByRole("button", { name: "Save & return" }).click();
    await page.getByRole("button", { name: "Play Mode", exact: true }).click();
    const scene = page.locator(".hp-scene3d");
    await expect(scene.locator("canvas")).toBeVisible({ timeout: 45_000 });
    await expect(scene.locator(".hp-scene3d-labels").getByRole("button", { name: "GLB / glTF model 1", exact: true })).toBeVisible();
    await expect(scene.locator(".hp-scene3d-model-error")).toHaveCount(0);
    await expect(scene.getByRole("complementary", { name: "Scene objects" }).getByRole("button", { name: "Control cabinet" })).toBeVisible();
});

test("animation studio gallery links data-driven fans and scenarios", async ({ page }) => {
    await page.goto("/examples/scene3d-animation-studio");
    const scene = page.locator(".hp-scene3d");
    await expect(scene.locator("canvas")).toBeVisible({ timeout: 45_000 });
    const equipment = scene.getByRole("complementary", { name: "Scene objects" });
    await expect(equipment.getByRole("button", { name: /Cooling fan P-101/ })).toBeVisible();
    await page.getByRole("button", { name: "Peak demand", exact: true }).click();
    await expect(equipment.getByRole("button", { name: /Cooling fan P-103 Warning/ })).toBeVisible();
    await page.getByRole("button", { name: "Maintenance", exact: true }).click();
    await expect(equipment.getByRole("button", { name: /Cooling fan P-102 Stopped/ })).toBeVisible();
});

test("water pump station digital twin updates equipment and KPIs across every scenario", async ({ page }) => {
    await page.goto("/examples/water-pump-station-digital-twin");
    const scene = page.locator(".hp-scene3d");
    await expect(scene.locator("canvas")).toBeVisible({ timeout: 45_000 });
    const online = page.locator("[data-hp-id=pumps_kpi] .hp-metric-value");
    const pressure = page.locator("[data-hp-id=pressure_kpi] .hp-metric-value");
    const levels = page.locator("[data-hp-id=storage_kpi] .hp-metric-value");
    const equipment = scene.getByRole("complementary", { name: "Scene objects" });
    await expect(equipment.getByRole("button", { name: /Booster 1/ }).first()).toBeVisible();
    await expect(online).toHaveText("4");
    for (const [scenario, pumps, psi] of [
        ["Peak demand", "6", "67"],
        ["Remote wells offline", "4", "57"],
        ["Surface inlet unavailable", "4", "55"],
        ["Booster maintenance", "4", "62"],
        ["Low storage", "3", "50"],
        ["Limited power", "2", "51"],
        ["Low distribution pressure", "2", "43"],
        ["Normal supply", "4", "64"],
    ]) {
        await page.getByRole("button", { name: scenario, exact: true }).click();
        await expect(online).toHaveText(pumps);
        await expect(pressure).toContainText(psi);
    }
    await page.getByRole("button", { name: "Low storage", exact: true }).click();
    await expect(levels).toHaveText("26");
    await expect(page.locator(".hp-component[data-hp-id=booster_load]")).toBeVisible();
    await expect(page.locator(".hp-component[data-hp-id=storage_levels]")).toBeVisible();
    await expect(page.locator("[data-hp-id=asset_register] tbody tr").first()).toBeVisible();
    await expect(scene.getByRole("button", { name: "Pause flow" })).toBeVisible();
});
