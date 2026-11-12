import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { instantiateDashboardExample } from "../../../src/playground/dashboardExample";
import { exportProjectBundle } from "../../../src/playground/projectBundle";

for (const renderMode of ["inline", "image"]) test(`Playground imports and filters station schematics in ${renderMode} mode`, async ({ page }) => {
    const folder = "examples/dashboards/station-schematics";
    const [json, csvText] = await Promise.all([
        readFile(`${folder}/specification.json`, "utf8"),
        readFile(`${folder}/StationSchematics.csv`, "utf8"),
    ]);
    const specification = JSON.parse(json);
    specification.components[0].svgBinding.renderMode = renderMode;
    specification.components.unshift({
        type: "select", id: "facility_filter", label: "Facility", field: "stationid",
        interaction: { field: "stationid", internalMode: "filter", targets: ["station_schematic"], externalMode: "none" },
    });
    const { project } = instantiateDashboardExample({
        id: "station-schematics", title: "Station Schematics", specification,
        runtimeConfiguration: {}, csvText, dataFileName: "StationSchematics.csv",
    });

    await page.goto("/");
    await page.locator('input[accept=".hyperpbi,application/json"]').setInputFiles({
        name: "Station Schematics.hyperpbi", mimeType: "application/json", buffer: Buffer.from(exportProjectBundle(project)),
    });
    await page.getByRole("button", { name: "Play Mode", exact: true }).click();
    const station = page.getByRole("combobox", { name: "Facility" });
    const svg = page.locator(".hp-svg-markup-host > svg");
    const image = page.locator(".hp-svg-markup-host > img");
    await expect(page.getByText("Select one facility to view its process schematic.")).toBeVisible();
    await station.selectOption({ label: "INT-01" });
    if (renderMode === "inline") {
        await expect(svg.locator("text").filter({ hasText: "P-101 · Running" })).toBeVisible();
        await expect.poll(() => svg.locator('path[id$="-flow"]').evaluate(element => element.getAnimations().length)).toBe(1);
    } else {
        await expect(image).toBeVisible();
        await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.naturalWidth)).toBeGreaterThan(0);
        await expect.poll(async () => decodeURIComponent((await image.getAttribute("src"))!)).toContain("P-101 · Running");
    }
    await expect(page.getByText("SVG sanitizer diagnostics", { exact: false })).toHaveCount(0);
    await station.selectOption({ label: "BST-02" });
    if (renderMode === "inline") await expect(svg.locator("text").filter({ hasText: "P-202 · Standby" })).toBeVisible();
    else await expect.poll(async () => decodeURIComponent((await image.getAttribute("src"))!)).toContain("P-202 · Standby");
    await station.selectOption({ label: "BAD-04" });
    await expect(page.getByRole("alert").filter({ hasText: "could not be parsed" })).toBeVisible();
});
