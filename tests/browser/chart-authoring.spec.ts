import {test,expect} from "@playwright/test";
declare global{interface Window{chartAuthoring:{specification:string;saved:string;selections:number[][];option:()=>any;extent:()=>number[];};}}

test("visual chart controls configure secondary axes, dates, precision, live preview and save without JSON",async({page})=>{
    await page.setViewportSize({width:1440,height:920});await page.goto("/tests/browser/chart-authoring.html");
    await expect(page.locator("[_echarts_instance_]")).toBeVisible();
    const chartInstance=await page.locator("[_echarts_instance_]").getAttribute("_echarts_instance_");
    await page.getByRole("treeitem",{name:/Quality monitoring/}).click();
    await expect(page.getByRole("region",{name:"Chart configuration"})).toBeVisible();
    await expect.poll(()=>page.evaluate(()=>window.chartAuthoring.extent()[0])).toBeGreaterThan(0);
    const panel=page.locator(".hp-chart-configuration");
    await panel.getByRole("button",{name:"Series",exact:true}).focus();await page.keyboard.press("Enter");await expect(panel.getByRole("button",{name:"Series",exact:true})).toHaveAttribute("aria-pressed","true");await panel.getByRole("button",{name:"Add series",exact:true}).click();
    await panel.getByLabel("Series value field",{exact:true}).selectOption("rainfall");await panel.getByLabel("Series Y axis",{exact:true}).selectOption("right");
    await expect.poll(()=>page.evaluate(()=>window.chartAuthoring.option().yAxis.length)).toBe(2);
    await expect.poll(()=>page.evaluate(()=>window.chartAuthoring.option().series[1].yAxisIndex)).toBe(1);
    await expect(page.locator("[_echarts_instance_]")).toHaveAttribute("_echarts_instance_",chartInstance!);
    await panel.getByRole("button",{name:"Axes",exact:true}).click();await panel.getByLabel("Chart axis",{exact:true}).selectOption("yAxis:0");
    await panel.getByLabel("Numeric precision",{exact:true}).fill("2");await panel.getByLabel("Numeric precision",{exact:true}).press("Tab");
    await panel.getByLabel("Chart axis",{exact:true}).selectOption("xAxis:0");await panel.getByLabel("Date format",{exact:true}).selectOption("iso");
    await expect.poll(()=>page.evaluate(()=>window.chartAuthoring.option().yAxis[0].axisLabel.formatter(53.126))).toBe("53.13");
    await expect.poll(()=>page.evaluate(()=>window.chartAuthoring.option().xAxis[0].axisLabel.formatter("2026-11-06"))).toBe("2026-11-06");
    if(process.platform==="win32")await expect(page).toHaveScreenshot("advanced-chart-axes.png",{animations:"disabled"});
    await page.getByRole("button",{name:"Save & return",exact:true}).click();await expect.poll(()=>page.evaluate(()=>window.chartAuthoring.saved.length)).toBeGreaterThan(0);
    await page.goto("/tests/browser/chart-authoring.html?saved=1");await expect.poll(()=>page.evaluate(()=>window.chartAuthoring.option()?.series.length)).toBe(2);
    await page.getByLabel("Report date slicer",{exact:true}).selectOption("2026-11");await expect.poll(()=>page.evaluate(()=>window.chartAuthoring.option().xAxis[0].data.length)).toBe(14);
    await page.setViewportSize({width:390,height:760});await expect(page.locator(".hp-studio").first()).toBeVisible();
    expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test("an empty dashboard creates a field-bound component through the searchable picker",async({page})=>{
    await page.goto("/tests/browser/chart-authoring.html?empty=1");
    await page.getByLabel("Search component picker",{exact:true}).fill("combo");
    await page.getByRole("button",{name:"Add component",exact:true}).click();
    await expect.poll(()=>page.evaluate(()=>JSON.parse(window.chartAuthoring.specification).components.length)).toBe(1);
    await expect(page.locator(".hp-chart-configuration")).toBeVisible();
});

test("compact chart authoring remains keyboard accessible in dark mode",async({page})=>{
    await page.setViewportSize({width:390,height:760});await page.goto("/tests/browser/chart-authoring.html?dark=1");
    await page.getByRole("button",{name:"Editor",exact:true}).click();await page.getByRole("treeitem",{name:/Quality monitoring/}).click();
    const panel=page.locator(".hp-chart-configuration");await expect(panel).toBeVisible();
    await panel.getByRole("button",{name:"Axes",exact:true}).focus();await page.keyboard.press("Enter");await expect(panel.getByLabel("Axis range",{exact:true})).toBeVisible();
    await panel.getByLabel("Axis range",{exact:true}).selectOption("data");
    await expect.poll(()=>page.evaluate(()=>JSON.parse(window.chartAuthoring.specification).components[0].chartStyle.yAxis[0].domain)).toBe("data");
    expect(await panel.evaluate(node=>node.scrollWidth<=node.clientWidth)).toBe(true);
    await expect(page.locator(".hp-spec-inspector")).toHaveCSS("background-color","rgb(24, 36, 51)");
    if(process.platform==="win32")await expect(page).toHaveScreenshot("compact-chart-dark.png",{animations:"disabled"});
});
