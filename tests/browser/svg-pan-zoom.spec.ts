import { expect, test, type Locator } from "@playwright/test";

const harness = "/tests/browser/svg-pan-zoom.html";
const fitted = { scale: 1, x: 0, y: 0 };

function view(viewport: Locator) {
    return viewport.locator(".hp-pan-zoom-content").evaluate(element => {
        const matrix = new DOMMatrixReadOnly(getComputedStyle(element).transform);
        return { scale: matrix.a, x: matrix.e, y: matrix.f };
    });
}

test("wheel zoom anchors to the cursor and drag leaves mark clicks and keyboard activation intact", async ({ page }) => {
    await page.goto(harness);
    const viewport = page.locator(".hp-pan-zoom");
    const mark = viewport.getByRole("button", { name: "Select pump" });
    const selections = page.locator("#selections");
    await expect(mark).toBeVisible();
    const markBox = (await mark.boundingBox())!;
    const x = Math.round(markBox.x + markBox.width / 2), y = Math.round(markBox.y + markBox.height / 2);
    const anchor = await mark.evaluate((element: SVGGraphicsElement, point) => {
        const local = new DOMPoint(point.x, point.y).matrixTransform(element.getScreenCTM()!.inverse());
        return { x: local.x, y: local.y };
    }, { x, y });
    await page.mouse.move(x, y);
    await page.mouse.wheel(0, -160);
    await expect.poll(async () => (await view(viewport)).scale).toBeGreaterThan(1);
    const zoomedAnchor = await mark.evaluate((element: SVGGraphicsElement, point) => {
        const screen = new DOMPoint(point.x, point.y).matrixTransform(element.getScreenCTM()!);
        return { x: screen.x, y: screen.y };
    }, anchor);
    expect(zoomedAnchor.x).toBeCloseTo(x, 2);
    expect(zoomedAnchor.y).toBeCloseTo(y, 2);

    const zoomed = await view(viewport);
    await page.mouse.down();
    await page.mouse.move(x + 45, y + 25, { steps: 5 });
    await page.mouse.up();
    await expect.poll(async () => (await view(viewport)).x).toBeCloseTo(zoomed.x + 45, 2);
    expect((await view(viewport)).y).toBeCloseTo(zoomed.y + 25, 2);
    await expect(selections).toHaveText("0");
    await mark.click();
    await expect(selections).toHaveText("1");
    await mark.press("Enter");
    await expect(selections).toHaveText("2");

    const controls = viewport.getByRole("group", { name: "Pan and zoom controls" });
    const box = (await viewport.boundingBox())!;
    const controlsBox = (await controls.boundingBox())!;
    expect(controlsBox.y - box.y).toBe(8);
    expect(box.x + box.width - controlsBox.x - controlsBox.width).toBe(8);
    await controls.getByRole("button", { name: "Fit" }).click();
    await expect.poll(() => view(viewport)).toEqual(fitted);
    const zoomIn = controls.getByRole("button", { name: "Zoom in" });
    const zoomOut = controls.getByRole("button", { name: "Zoom out" });
    await expect(zoomOut).toBeDisabled();
    await zoomIn.click();
    await expect.poll(async () => (await view(viewport)).scale).toBe(1.25);
    await zoomOut.click();
    await expect.poll(() => view(viewport)).toEqual(fitted);
    await page.mouse.move(x, y);
    await page.mouse.wheel(0, -4000);
    await expect.poll(async () => (await view(viewport)).scale).toBe(5);
    await expect(zoomIn).toBeDisabled();
    await page.mouse.wheel(0, 4000);
    await expect.poll(async () => (await view(viewport)).scale).toBe(1);
    await expect(zoomOut).toBeDisabled();
});

test.describe("touch input", () => {
    test.use({ hasTouch: true });

    test("pinches around the midpoint and continues panning with one finger", async ({ page }) => {
        await page.goto(harness);
        const viewport = page.locator(".hp-pan-zoom");
        await expect(viewport).toBeVisible();
        const box = (await viewport.boundingBox())!;
        const x = Math.round(box.x + box.width / 2), y = Math.round(box.y + box.height / 2);
        const touch = await page.context().newCDPSession(page);
        await touch.send("Input.dispatchTouchEvent", { type: "touchStart", touchPoints: [{ x: x - 30, y, id: 1 }, { x: x + 30, y, id: 2 }] });
        await touch.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x - 60, y, id: 1 }, { x: x + 60, y, id: 2 }] });
        await expect.poll(async () => (await view(viewport)).scale).toBeCloseTo(2, 2);
        const pinched = await view(viewport);
        expect(pinched.x).toBeCloseTo(box.x - x, 2);
        expect(pinched.y).toBeCloseTo(box.y - y, 2);
        await touch.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [{ x: x + 60, y, id: 2 }] });
        await touch.send("Input.dispatchTouchEvent", { type: "touchMove", touchPoints: [{ x: x - 80, y: y + 20, id: 1 }] });
        await touch.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
        await expect.poll(async () => (await view(viewport)).x).toBeCloseTo(pinched.x - 20, 2);
        expect((await view(viewport)).y).toBeCloseTo(pinched.y + 20, 2);
        await viewport.getByRole("button", { name: "Fit" }).tap();
        await viewport.getByRole("button", { name: "Select pump" }).tap();
        await expect(page.locator("#selections")).toHaveText("1");
    });
});

for (const mode of ["inline", "image"]) {
    test(`fits, resizes, and resets to a different station in ${mode} mode`, async ({ page }) => {
        await page.goto(`${harness}?mode=${mode}`);
        const viewport = page.locator(".hp-pan-zoom");
        const drawing = viewport.locator(mode === "inline" ? ".hp-svg-markup-host > svg" : ".hp-svg-markup-host > img");
        await expect(drawing).toBeVisible();
        const original = (await drawing.elementHandle())!;
        const verifyFit = async (wide: boolean) => {
            const dimensions = await drawing.evaluate((element: SVGSVGElement | HTMLImageElement) => {
                const frame = element.closest(".hp-pan-zoom")!.getBoundingClientRect();
                const parent = element.closest(".hp-component")!.getBoundingClientRect();
                const canvas = element.getBoundingClientRect();
                return { frame: [frame.width, frame.height], parent: [parent.width, parent.height],
                    canvas: [canvas.width, canvas.height],
                    scale: element instanceof SVGSVGElement ? [element.getScreenCTM()!.a, element.getScreenCTM()!.d]
                        : [element.naturalWidth, element.naturalHeight],
                    objectFit: getComputedStyle(element).objectFit };
            });
            expect(dimensions.frame).toEqual(dimensions.parent);
            expect(dimensions.canvas).toEqual(dimensions.frame);
            expect(dimensions.frame[0] > dimensions.frame[1]).toBe(wide);
            if (mode === "inline") expect(dimensions.scale[0]).toBeCloseTo(dimensions.scale[1], 5);
            else {
                expect(dimensions.scale[0] / dimensions.scale[1]).toBeCloseTo(wide ? 2 : .5, 2);
                expect(dimensions.objectFit).toBe("contain");
            }
        };

        if (mode === "inline") {
            await expect(drawing.locator("script")).toHaveCount(0);
            await expect.poll(() => drawing.locator("path").evaluate(element => element.getAnimations().length)).toBe(1);
        } else await expect.poll(() => drawing.evaluate((element: HTMLImageElement) => element.naturalWidth)).toBeGreaterThan(0);
        await verifyFit(true);
        await viewport.getByRole("button", { name: "Zoom in" }).click();
        await page.locator("#app").evaluate(element => Object.assign(element.style, { width: "300px", height: "520px" }));
        await expect.poll(async () => (await view(viewport)).scale).toBe(1.25);
        expect(await drawing.evaluate((element, previous) => element === previous, original)).toBe(true);
        if (mode === "inline") await expect.poll(() => drawing.locator("path").evaluate(element => element.getAnimations().length)).toBe(1);

        await page.getByRole("combobox", { name: "Station", exact: true }).selectOption("B");
        await expect.poll(() => view(viewport)).toEqual(fitted);
        if (mode === "inline") await expect(drawing.locator("text")).toHaveText("Station B");
        else await expect.poll(async () => decodeURIComponent((await drawing.getAttribute("src"))!)).toContain("Station B");
        if (mode === "image") await expect.poll(() => drawing.evaluate((element: HTMLImageElement) => element.naturalWidth / element.naturalHeight)).toBe(.5);
        await verifyFit(false);
    });
}

test("authored SVG keeps its intrinsic ratio in automatic-height layouts and refits when its template changes", async ({ page }) => {
    await page.goto(`${harness}?mode=authored`);
    const viewport = page.locator(".hp-pan-zoom");
    const drawing = viewport.locator("svg");
    await expect(drawing).toHaveAttribute("viewBox", "0 0 200 100");
    const box = (await drawing.boundingBox())!;
    expect(box.width / box.height).toBeCloseTo(2, 2);
    await viewport.getByRole("button", { name: "Zoom in" }).click();
    await page.getByRole("combobox", { name: "Station", exact: true }).selectOption("B");
    await expect(drawing.locator("text")).toHaveText("B");
    await expect.poll(() => view(viewport)).toEqual(fitted);
});

test("omitting panZoom or setting false keeps the legacy markup and wheel behavior", async ({ page }) => {
    for (const [mode, panZoom] of [["structured", "omitted"], ["authored", "false"], ["inline", "omitted"], ["image", "false"]]) {
        await page.goto(`${harness}?mode=${mode}&panZoom=${panZoom}`);
        const selector = mode === "structured" ? ".hp-svg-block > svg" : `.hp-svg-block > .hp-svg-markup-host > ${mode === "image" ? "img" : "svg"}`;
        const drawing = page.locator(selector);
        await expect(drawing).toBeVisible();
        await expect(page.locator(".hp-pan-zoom")).toHaveCount(0);
        expect(await drawing.evaluate(element => element.dispatchEvent(new WheelEvent("wheel", { deltaY: -100, bubbles: true, cancelable: true })))).toBe(true);
        if (mode === "structured") await expect(drawing).toHaveAttribute("preserveAspectRatio", "none");
        if (mode === "authored") await expect(drawing).toHaveAttribute("width", "200");
    }
});
