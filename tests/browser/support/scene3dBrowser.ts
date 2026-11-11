import { expect, type Page } from "@playwright/test";

export function monitorWebGl() {
    const buffers = new Set<WebGLBuffer>();
    const stats = { canvases: 0, allocations: 0, disposals: 0, live: 0, draws: 0, instancedDraws: 0 };
    Object.assign(window, { sceneGl: stats });
    const create = WebGL2RenderingContext.prototype.createBuffer;
    const dispose = WebGL2RenderingContext.prototype.deleteBuffer;
    const draw = WebGL2RenderingContext.prototype.drawElements;
    const drawInstanced = WebGL2RenderingContext.prototype.drawElementsInstanced;
    WebGL2RenderingContext.prototype.createBuffer = function () {
        const buffer = create.call(this);
        if (buffer) {
            buffers.add(buffer);
            stats.allocations++;
            stats.live = buffers.size;
        }
        return buffer;
    };
    WebGL2RenderingContext.prototype.deleteBuffer = function (buffer) {
        if (buffer && buffers.delete(buffer)) stats.disposals++;
        stats.live = buffers.size;
        dispose.call(this, buffer);
    };
    WebGL2RenderingContext.prototype.drawElements = function (...args) {
        stats.draws++;
        draw.call(this, ...args);
    };
    WebGL2RenderingContext.prototype.drawElementsInstanced = function (...args) {
        stats.draws++;
        stats.instancedDraws++;
        drawInstanced.call(this, ...args);
    };
    const canvases = new WeakSet<HTMLCanvasElement>();
    const getContext = HTMLCanvasElement.prototype.getContext;
    Object.defineProperty(HTMLCanvasElement.prototype, "getContext", { configurable: true, value: function (this: HTMLCanvasElement, name: string, ...args: unknown[]) {
        const context = Reflect.apply(getContext, this, [name, ...args]);
        if (context && name === "webgl2" && !canvases.has(this)) {
            canvases.add(this);
            stats.canvases++;
        }
        return context;
    } });
}

export const glStats = (page: Page) => page.evaluate(() => (window as unknown as {
    sceneGl: { canvases: number; allocations: number; disposals: number; live: number; draws: number; instancedDraws: number };
}).sceneGl);

export async function verifyMultiStationExplorer(page: Page) {
    const scene = page.locator(".hp-component[data-hp-id=station_scene]");
    const equipment = scene.locator(".hp-scene3d-object-list");
    const canvas = scene.locator("canvas");
    const station = page.getByRole("combobox", { name: "Station", exact: true });
    const register = page.locator(".hp-component[data-hp-id=station_register]");
    const markers = page.locator("[data-hp-id=station_map] [data-hp-layer-id=facilities]");
    const selectedMarker = page.locator("[data-hp-layer-id=facilities][data-hp-state=selected]");
    const kpi = page.locator("[data-hp-id=daily_pumpage] .hp-metric-value");
    const availability = page.locator(".hp-component[data-hp-id=daily_availability]");
    await expect(canvas).toBeVisible({ timeout: 45_000 });
    await expect(equipment.getByRole("button", { name: /Contact tank Water level/ })).toBeVisible();
    await expect(equipment.getByRole("button", { name: "Booster 1 Running" })).toBeVisible();
    await expect.poll(async () => (await glStats(page)).instancedDraws).toBeGreaterThan(0);
    await expect(kpi).toHaveText("1.43");
    await expect(markers).toHaveCount(3);
    await expect(selectedMarker).toHaveCount(1);
    const initialMarkerKey = await selectedMarker.getAttribute("data-hp-feature-key");

    await station.selectOption({ label: "Repump Station 01" });
    await expect(equipment.getByRole("button", { name: /Ground storage B/ })).toBeVisible();
    await expect(page.locator(".hp-component[data-hp-id=station_profile]")).toContainText("Cedar Intertie");
    await expect(selectedMarker).not.toHaveAttribute("data-hp-feature-key", initialMarkerKey!);
    const repumpMarkerKey = await selectedMarker.getAttribute("data-hp-feature-key");
    await equipment.getByRole("button", { name: "Ammonia injection" }).click();
    await expect(equipment.getByRole("button", { name: "Ammonia injection" })).toHaveAttribute("aria-pressed", "true");

    await register.getByPlaceholder("Search table…").fill("Juniper");
    await expect(register.locator("tbody tr")).toHaveCount(1);
    await register.getByRole("row", { name: /Groundwater Station 02/ }).press("Enter");
    await expect(equipment.getByRole("button", { name: /Treated-water clearwell/ })).toBeVisible();
    await expect(station.locator("option:checked")).toHaveText("Groundwater Station 02");
    await expect(equipment.locator('[aria-pressed="true"]')).toHaveCount(0);
    await expect(markers).toHaveCount(3);

    const clearwellLabel = scene.locator(".hp-scene3d-labels").getByRole("button", { name: /Treated-water clearwell/ });
    await expect(clearwellLabel).toBeVisible();
    const pose = () => clearwellLabel.evaluate(element => element.style.transform);
    const top = await pose();
    await scene.getByRole("button", { name: "Isometric" }).click();
    await expect.poll(pose).not.toBe(top);
    const isometric = await pose();
    const beforeDate = await glStats(page);
    await page.getByRole("slider", { name: /reporting day/ }).press("ArrowLeft");
    await expect(availability).toContainText("No data");
    await expect(kpi).toHaveText("—");
    await expect(equipment.getByRole("button", { name: /Booster 1 No data/ })).toBeVisible();
    await expect.poll(pose).toBe(isometric);
    expect((await glStats(page)).allocations).toBe(beforeDate.allocations);
    await expect(page.locator("[data-hp-id=station_history] canvas, [data-hp-id=station_history] svg").first()).toBeVisible();

    await register.getByPlaceholder("Search table…").clear();
    await markers.and(page.locator(`[data-hp-feature-key=${JSON.stringify(repumpMarkerKey)}]`)).click({ timeout: 8_000 });
    await expect(selectedMarker).toHaveAttribute("data-hp-feature-key", repumpMarkerKey!);
    await expect(station.locator("option:checked")).toHaveText("Repump Station 01");
    await expect(kpi).toHaveText("5.32");
    await expect(availability).toContainText("Synthetic daily reading");
    await expect(markers).toHaveCount(3);
    expect((await glStats(page)).canvases).toBe(1);
}
