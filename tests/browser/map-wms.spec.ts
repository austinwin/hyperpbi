import {test,expect} from "@playwright/test";
test("WMS uses native raster requests and respects layer visibility",async({page})=>{
    const requests:string[]=[];
    await page.route("https://sampleserver6.arcgisonline.com/**/WMSServer*",async route=>{requests.push(route.request().url());await route.fulfill({status:200,contentType:"image/png",body:Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQIHWP4z8DwHwAFgAI/ScLbtAAAAABJRU5ErkJggg==","base64")});});
    await page.goto("/tests/browser/map-demo.html?demo=wms");await expect.poll(()=>requests.length).toBeGreaterThan(0);await expect(page.locator("img.leaflet-tile").first()).toBeAttached();
    const url=new URL(requests[0]);expect(url.searchParams.get("request")?.toLowerCase()).toBe("getmap");expect(url.searchParams.get("layers")).toBe("0");expect(url.searchParams.get("bbox")).toBeTruthy();
    await page.getByRole("button",{name:"Expand map tools",exact:true}).click();await page.getByRole("button",{name:"Layers",exact:true}).click();await page.getByRole("button",{name:"Hide Population raster",exact:true}).click();
    await expect(page.locator("img.leaflet-tile")).toHaveCount(0);
    await expect(page.locator(".hp-map-feature-details")).toHaveCount(0);
});
