import { calculateAggregates } from "../../data/aggregations";
import { normalizeMapBindings } from "../../data/normalizeMapBindings";
import { RenderContext } from "../../render/RenderContext";
import { SmallMultiplesComponent } from "../../schema/hyperpbiSchema";
import { useRenderContext } from "../../render/RenderContext";
import { ChartBlock } from "./ChartBlock";

export function SmallMultiples({ component }: { component: SmallMultiplesComponent }) {
    const context=useRenderContext();const values=Array.from(new Set(context.rows.map(row=>String(row[component.splitField]??"(Blank)")))).slice(0,Math.min(24,Math.max(1,component.maxPanels??6)));
    return <section class="hp-small-multiples"><header><h3>{component.title??"Small multiples"}</h3></header><div>{values.map((value,index)=>{const rows=context.rows.filter(row=>String(row[component.splitField]??"(Blank)")===value);const data={...context.data,rows,aggregates:calculateAggregates(rows),map:normalizeMapBindings(rows,context.data.fields)};const child={...component.chart,id:`${component.id??"multiples"}-${index}`,title:value,height:component.height??180};return <RenderContext.Provider value={{...context,rows,data}}><ChartBlock component={child}/></RenderContext.Provider>;})}</div></section>;
}

