import { describe,expect,it,vi } from "vitest";
import { h,render } from "preact";
import { act } from "preact/test-utils";
import { useState } from "preact/hooks";
import { applyChartStyle,chartStyleErrors } from "../src/components/charts/chartStyle";
import { sanitizeEChartOptions } from "../src/components/charts/safeEChartOptions";
import { getChartAdapter } from "../src/components/charts/adapters/registry";
import { defaultConfig } from "../src/config/hyperpbiConfig";
import { SpecificationInspector } from "../src/editor/inspector/SpecificationInspector";
import { createBoundComponent } from "../src/editor/inspector/createBoundComponent";
import { validateSchema } from "../src/schema/validateSchema";
import { mapStudioData } from "./map-studio-fixture";
import { formatBuiltInChartTooltip } from "../src/components/charts/adapters/shared";
import example from "../examples/specs/advanced-chart-authoring.json";
import {prepareSpecification} from "../src/schema/prepareSpecification";
import {chartDataState} from "../src/components/charts/chartDataState";

describe("declarative visual chart authoring",()=>{
    it("uses actual remote source loading/error states through logical datasets without polling",()=>{
        const status={status:"loading" as const,rowCount:0};expect(chartDataState("daily",{daily:{source:"clean"},clean:{source:"remote"}},{remote:status})).toBe(status);expect(chartDataState("cycle",{cycle:{source:"cycle"}},{})).toBeUndefined();expect(chartDataState("powerbi",{},{})).toBeUndefined();
    });
    it("ships a portable advanced example with safe options and native chart controls",()=>{
        expect(validateSchema(example).errors).toEqual([]);
        const data={...mapStudioData,rows:[{date:"2026-11-06",temperature:53,rainfall:90}],rowKeys:["reading-1"],fields:{date:{...mapStudioData.fields.code,key:"date",dataType:"datetime" as const},temperature:{...mapStudioData.fields.amount,key:"temperature",dataType:"number" as const},rainfall:{...mapStudioData.fields.amount,key:"rainfall",dataType:"number" as const}}};
        expect(prepareSpecification(example,data,{repair:false}).errors).toEqual([]);
    });
    it("keeps 50–60 data on an automatic domain and independent secondary axes",()=>{
        const base={xAxis:{type:"category",data:["A","B"]},yAxis:[{type:"value"},{type:"value"}],series:[{type:"line",data:[53,58]},{type:"bar",data:[110,130],yAxisIndex:1}]};
        const result=applyChartStyle(base,{yAxis:[{domain:"auto",decimals:2},{domain:"fixed",min:100,max:150}],series:[{color:"#2563eb",gradientEnd:"#99f6e4",smooth:true,referenceLines:[{value:55,label:"Target"}],thresholds:[{above:56,color:"#dc2626"}]}]}) as any;
        expect(result.yAxis[0]).toMatchObject({scale:true});expect(result.yAxis[0].min).toBeUndefined();expect(result.yAxis[1]).toMatchObject({min:100,max:150});
        expect(result.series[0].data[1]).toMatchObject({value:58,itemStyle:{color:"#dc2626"}});expect(result.series[1].yAxisIndex).toBe(1);expect(base.series[0].data).toEqual([53,58]);
        expect(result.yAxis[0].axisLabel.formatter(53.1234)).toBe("53.12");
    });
    it("formats dates, numeric labels, tooltips and bounded annotations without author callbacks",()=>{
        const result=applyChartStyle({xAxis:{type:"category"},yAxis:{type:"value"},series:[{type:"line",data:[53.124]}]},{xAxis:[{dateFormat:"iso"}],series:[{labels:true,decimals:1,referenceBands:[{from:50,to:60,label:"Operating range"}]}],tooltipDecimals:2,zoom:true}) as any;
        expect(result.xAxis.axisLabel.formatter("2026-11-06")).toBe("2026-11-06");expect(result.series[0].label.formatter({value:53.124})).toBe("53.1");expect(result.tooltip.formatter({value:53.124,name:"A"})).toBe("A: 53.12");expect(result.dataZoom).toHaveLength(2);
        expect(chartStyleErrors({yAxis:[{domain:"fixed",min:60,max:50}]})).not.toEqual([]);expect(chartStyleErrors({series:[{opacity:2}]})).not.toEqual([]);expect(chartStyleErrors({run:"alert(1)"})).not.toEqual([]);
    });
    it("rejects unknown engine keys, functions, unsafe markup, invalid numbers and URLs in the schema",()=>{
        for(const options of [{imaginaryEngine:{run:true}},{series:[{type:"line",renderItem:()=>null}]},{tooltip:{formatter:"<img src=x onerror=alert(1)>"}},{xAxis:{min:"evil"}},{series:[{type:"line",itemStyle:{color:"https://example.com"}}]}]) {
            expect(sanitizeEChartOptions(options).warnings.length).toBeGreaterThan(0);
            expect(validateSchema({version:"2.0",components:[{type:"lineChart",id:"test",options}]}).errors.length).toBeGreaterThan(0);
        }
        expect(sanitizeEChartOptions({series:[{type:"line",itemStyle:{color:{type:"linear",x:0,y:0,x2:0,y2:1,colorStops:[{offset:0,color:"#fff"},{offset:1,color:"#000"}]}}}]}).warnings).toEqual([]);
        expect(formatBuiltInChartTooltip({name:"<img src=x onerror=alert(1)>",value:53})).toContain("&lt;img");
    });
    it("creates valid field-bound chart templates from metadata without adding component types",()=>{
        const component=createBoundComponent("comboChart",{version:"2.0",components:[]},mapStudioData.fields);
        expect(validateSchema({version:"2.0",components:[component]}).errors).toEqual([]);
        expect((component.series as any[]).every(series=>mapStudioData.fields[series.field])).toBe(true);
    });
    it("edits axes and series through ordinary controls and rejects invalid edits without replacing JSON",()=>{
        const host=document.createElement("div");document.body.append(host);let latest="";
        function Harness(){const [json,setJson]=useState(JSON.stringify({version:"2.0",components:[{type:"comboChart",id:"chart",category:"code",series:[{field:"amount",chartType:"line"}]}]}));latest=json;return <SpecificationInspector json={json} data={mapStudioData} selectedComponentId="chart" onChange={next=>setJson(next)} />;}
        act(()=>render(<Harness />,host));
        const click=(name:string)=>act(()=>{Array.from(host.querySelectorAll("button")).find(button=>button.textContent===name)!.click();});
        click("Axes");const range=host.querySelector('[aria-label="Axis range"]') as HTMLSelectElement;
        act(()=>{range.value="auto";range.dispatchEvent(new Event("change",{bubbles:true}));});expect(JSON.parse(latest).components[0].chartStyle.yAxis[0].domain).toBe("auto");
        click("Series");click("Add series");expect(JSON.parse(latest).components[0].series).toHaveLength(2);
        const axis=host.querySelector('[aria-label="Series Y axis"]') as HTMLSelectElement;act(()=>{axis.value="right";axis.dispatchEvent(new Event("change",{bubbles:true}));});expect(JSON.parse(latest).components[0].series[1].axis).toBe("right");
        const before=latest;const opacity=host.querySelector('[aria-label="Opacity"]') as HTMLInputElement;act(()=>{opacity.value="2";opacity.dispatchEvent(new Event("change",{bubbles:true}));});expect(latest).toBe(before);expect(host.textContent).toContain("invalid value");
        act(()=>render(null,host));host.remove();
    });
});
