import { expect, test } from "@playwright/test";
import sample from "../../../examples/remote-fragments/sensor-1024.json";

test("gallery remote analytics opens an editable project and survives save/reload", async ({ page }) => {
    await page.route("https://raw.githubusercontent.com/austinwin/hyperpbi/main/examples/remote-fragments/sensor-*.json", route => route.fulfill({ contentType: "application/json", json: sample }));
    await page.goto("/components/map?example=remote-analytics");
    await expect(page.locator(".pg-map-example h2")).toHaveText("Dynamic GIS Popup — Remote Analytics");
    await page.locator('[data-hp-layer-id="sensors"][data-hp-feature-id="1024"]').click();
    await expect(page.locator(".hp-remote-fragment")).toContainText("Current pressure (psi)");
    await page.getByRole("button", { name: "Edit in Playground", exact: true }).click();
    await expect(page).toHaveURL(/\/project\//);
    await page.reload();
    // The project is stored before navigation; its canonical endpoint is preserved.
    const specification = await page.evaluate(async () => {
        const database = await new Promise<IDBDatabase>((resolveDb, reject) => { const request = indexedDB.open("hyperpbi-playground"); request.onsuccess = () => resolveDb(request.result); request.onerror = () => reject(request.error); });
        const projectId = decodeURIComponent(location.pathname.split("/").pop()!);
        const project = await new Promise<{ specification: unknown }>((resolveProject, reject) => { const request = database.transaction("projects").objectStore("projects").get(projectId); request.onsuccess = () => resolveProject(request.result); request.onerror = () => reject(request.error); });
        database.close();
        return project.specification;
    });
    expect(JSON.stringify(specification)).toContain('"mode":"remote"');
    expect(JSON.stringify(specification)).toContain("https://raw.githubusercontent.com/austinwin/hyperpbi/main/examples/remote-fragments/sensor-{{service.site_id}}.json");
});
