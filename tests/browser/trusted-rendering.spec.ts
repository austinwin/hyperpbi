import { expect, test } from "@playwright/test";

test("trusted authors retain browser features inside separate host boundaries", async ({ page }) => {
    await page.goto("/tests/browser/trusted-rendering.html");
    await expect(page.locator(".animated")).toBeVisible();
    expect(await page.locator("#outside").evaluate(node => getComputedStyle(node).color)).not.toBe("rgb(255, 0, 0)");
    const frame = page.frameLocator("iframe");
    await expect(frame.getByRole("textbox", { name: "Author input" })).toHaveValue("Works");
    await frame.getByRole("button", { name: "Run author code" }).click();
    await expect(frame.locator("output")).toHaveText("Executed");
    await expect(frame.locator("body")).toHaveAttribute("data-isolated", "true");
    await expect(frame.locator("use")).toHaveAttribute("href", "#dot");
    await expect(frame.getByText("SVG HTML")).toBeVisible();
    await expect(page.locator("#outside")).toHaveText("Outside visual");
    await page.setViewportSize({ width: 320, height: 640 });
    expect(await page.locator("iframe").evaluate(node => node.getBoundingClientRect().right)).toBeLessThanOrEqual(320);
});
