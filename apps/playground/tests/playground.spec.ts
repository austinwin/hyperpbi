import { expect, test } from "@playwright/test";

test("creates, restores, previews, and exports a local CSV project", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { name: "Build once. Run in the browser or Power BI." })).toBeVisible();
    await page.getByRole("button", { name: "New Project" }).click();
    await expect(page).toHaveURL(/\/project\/[^/]+$/);
    await expect(page.getByText("Dashboard Builder")).toBeVisible();

    await page.locator(".pg-upload-button input[type=file]").setInputFiles({
        name: "orders.csv",
        mimeType: "text/csv",
        buffer: Buffer.from("Order ID,Status,Amount\n001,Open,10\n002,Closed,20")
    });
    await expect(page.getByText("1 data source added.")).toBeVisible();
    await expect(page.getByText("orders", { exact: true })).toBeVisible();
    await expect(page.locator(".pg-source-count")).toHaveText("2 rows");

    await page.getByRole("button", { name: "Play Mode" }).click();
    await expect(page).toHaveURL(/\/project\/[^/]+\/play$/);
    await expect(page.locator(".hyperpbi-root")).toBeVisible();
    await expect(page.getByText("Record Details")).toBeVisible();
    await expect(page.getByText("Open", { exact: true })).toBeVisible();

    await page.locator(".pg-exit-play").click();
    await expect(page).toHaveURL(/\/project\/[^/]+$/);
    await page.getByRole("button", { name: "Export" }).click();
    await expect(page.getByRole("dialog", { name: "Export project" })).toBeVisible();
    await expect(page.getByText("Power BI compatible")).toBeVisible();
    await expect(page.getByRole("button", { name: "Copy Specification" })).toBeEnabled();

    await page.reload();
    await expect(page.getByText("orders", { exact: true })).toBeVisible();
    await expect(page.locator(".pg-source-count")).toHaveText("2 rows");
});
