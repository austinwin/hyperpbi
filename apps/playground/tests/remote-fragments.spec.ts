import { expect, test } from "@playwright/test";
test("GIS gallery opens an editable project and preserves the live endpoint on reload", async ({ page }) => {
    await page.goto("/components/map?example=remote-analytics");
    await expect(page.getByRole("heading", { name: "Dynamic GIS Analytics", exact: true })).toBeVisible();
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
    expect(JSON.stringify(specification)).toContain('"mode":"dynamic"');
    expect(JSON.stringify(specification)).toContain("https://functions.miniup.app/hyperpbi-dynamic-demo/sensor?id={{context.site_id}}");
});

test("work-order example opens from the Playground library and runs after reload", async ({ page }) => {
    await page.goto("/");
    const example = page.locator(".pg-example-card").filter({ hasText: "Universal Dynamic Content" });
    await example.getByRole("button", { name: "Load example", exact: true }).click();
    await expect(page).toHaveURL(/\/project\//);
    await page.getByRole("button", { name: "Play Mode", exact: true }).click();
    await expect(page).toHaveURL(/\/play$/);
    await page.reload();
    await page.getByRole("row", { name: /V-118/ }).click();
    await expect(page.getByRole("region", { name: "Asset details" })).toContainText("Exercise actuator");
});
