import { h, render } from "preact";
import { afterEach, describe, expect, it } from "vitest";
import { calculateAggregates } from "../src/data/aggregations";
import { normalizeMapBindings } from "../src/data/normalizeMapBindings";
import { NormalizedData } from "../src/data/normalizeData";
import { HyperPbiRoot } from "../src/render/HyperPbiRoot";
import { toRuntimeSettings, VisualFormattingSettingsModel } from "../src/settings";
import { defaultConfig } from "../src/config/hyperpbiConfig";

const rows=[{name:"A"}]; const fields={name:{key:"name",displayName:"Name",type:"dimension" as const,roles:["values"]}}; const data:NormalizedData={rows,fields,aggregates:calculateAggregates(rows),map:normalizeMapBindings(rows,fields)};
afterEach(()=>document.body.replaceChildren());

describe("rendered dashboard chrome",()=>{
    it("does not render schema title or row count by default",()=>{const host=document.createElement("div");render(h(HyperPbiRoot,{instanceId:"default-chrome",schema:{version:"1.0",title:"Hidden title",components:[]},data,settings:toRuntimeSettings(new VisualFormattingSettingsModel()),renderMs:0}),host);expect(host.querySelector(".hp-header")).toBeNull();expect(host.textContent).not.toContain("rows");});
    it("renders optional header and row count when Runtime Config enables both",()=>{const host=document.createElement("div");render(h(HyperPbiRoot,{instanceId:"enabled-chrome",schema:{version:"1.0",title:"Visible title",components:[]},data,settings:toRuntimeSettings(new VisualFormattingSettingsModel()),config:{...defaultConfig,renderer:{showHeader:true,showRowCount:true,showStudioButton:true}},renderMs:0}),host);expect(host.querySelector(".hp-header")?.textContent).toContain("Visible title");expect(host.querySelector(".hp-header")?.textContent).toContain("1 of 1 rows");});
    it("keeps sanitizer warnings out of normal dashboards",()=>{const host=document.createElement("div");render(h(HyperPbiRoot,{instanceId:"warning-default",schema:{version:"1.0",components:[{type:"html",id:"unsafe",html:'<div onclick="bad()">Safe</div>'}]},data,settings:toRuntimeSettings(new VisualFormattingSettingsModel()),renderMs:0}),host);expect(host.textContent).toContain("Safe");expect(host.querySelector(".hp-sanitizer-warning")).toBeNull();});
});
