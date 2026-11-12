import { readFile } from "node:fs/promises";
import { expect, test } from "@playwright/test";
import { instantiateDashboardExample } from "../../../src/playground/dashboardExample";
import { exportProjectBundle } from "../../../src/playground/projectBundle";

test("Playground imports and filters the station schematics example", async ({ page }) => {
    const folder = "examples/dashboards/station-schematics";
    const [json, csvText] = await Promise.all([
        readFile(`${folder}/specification.json`, "utf8"),
        readFile(`${folder}/StationSchematics.csv`, "utf8"),
    ]);
    const specification = JSON.parse(json);
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
    await expect(page.getByText("Select one facility to view its process schematic.")).toBeVisible();
    await station.selectOption({ label: "INT-01" });
    await expect(svg.locator("text").filter({ hasText: "P-101 · Running" })).toBeVisible();
    await expect.poll(() => svg.locator('path[id$="-flow"]').evaluate(element => element.getAnimations().length)).toBe(1);
    await station.selectOption({ label: "BST-02" });
    await expect(svg.locator("text").filter({ hasText: "P-202 · Standby" })).toBeVisible();
    await station.selectOption({ label: "BAD-04" });
    await expect(page.getByRole("alert").filter({ hasText: "Raw SVG could not be parsed" })).toBeVisible();
});
