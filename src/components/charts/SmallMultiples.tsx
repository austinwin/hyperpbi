import { calculateAggregates } from "../../data/aggregations";
import { normalizeMapBindings } from "../../data/normalizeMapBindings";
import { RenderContext } from "../../render/RenderContext";
import { SmallMultiplesComponent } from "../../schema/hyperpbiSchema";
import { useRenderContext } from "../../render/RenderContext";
import { ChartBlock } from "./ChartBlock";

export function SmallMultiples({ component }: { component: SmallMultiplesComponent }) {
    const context=useRenderContext();const id=component.id??"smallMultiples";const componentRows=context.getRowsForComponent(id);const values=Array.from(new Set(componentRows.map(row=>String(row[component.splitField]??"(Blank)")))).slice(0,Math.min(24,Math.max(1,component.maxPanels??6)));
    return <section class="hp-small-multiples"><header><h3>{component.title??"Small multiples"}</h3></header><div>{values.map(value=>{const rows=componentRows.filter(row=>String(row[component.splitField]??"(Blank)")===value);const data={...context.data,rows,aggregates:calculateAggregates(rows),map:normalizeMapBindings(rows,context.data.fields)};const child={...component.chart,id,title:value,height:component.height??180,interaction:component.interaction??component.chart.interaction};return <RenderContext.Provider value={{...context,rows,data,getRowsForComponent:()=>rows}}><ChartBlock component={child}/></RenderContext.Provider>;})}</div></section>;
}
