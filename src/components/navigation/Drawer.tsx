import { DashboardComponent, DrawerComponent } from "../../schema/hyperpbiSchema";
import { useRenderContext } from "../../render/RenderContext";
import { selectedSourceRowIndex } from "../../render/selection";
import { executeComponentInteraction } from "../../interactions/componentInteraction";
import { createInteractionPayload } from "../../interactions/interactionPayload";
import { resolveInteractionPolicy } from "../../interactions/interactionPolicy";

export function Drawer({ component, renderChildren }: { component: DrawerComponent; renderChildren: (children: DashboardComponent[]) => preact.ComponentChildren }) {
    const context=useRenderContext();const { state, sourceRowKeys, dispatch } = context; const id=component.id??component.type; const selected=selectedSourceRowIndex(state, sourceRowKeys);const policy=resolveInteractionPolicy(component,context.config,"navigation");
    const condition=component.openWhen??(component.type==="filterDrawer"?"always":"selectedRow"); const conditionOpen=condition==="always"||condition==="selectedRow"&&selected!==undefined||condition==="state"&&Boolean(state.values[component.stateKey??id]);
    const collapsed=state.collapsed[id]??!(component.defaultOpen??conditionOpen); const open=conditionOpen&&!collapsed; const filterDrawer=component.type==="filterDrawer";
    const toggle=(event:Event)=>{dispatch({type:"collapse",id,value:open});executeComponentInteraction(policy,createInteractionPayload(component,{value:!open}),context,{trigger:"click",event});};
    return <aside class={`hp-drawer hp-drawer-${component.position??"right"} ${open?"is-open":"is-closed"}`} style={{"--hp-drawer-width":`${Math.min(560,Math.max(220,component.width??320))}px`}}>
        <header><div><strong>{component.title??(filterDrawer?"Filters":"Details")}</strong>{filterDrawer&&<span>{state.filters.length+state.interactionFilters.length} applied</span>}</div><div>{filterDrawer&&(state.filters.length+state.interactionFilters.length)>0&&<button type="button" onClick={event=>{event.stopPropagation();dispatch({type:"clearFilters"});}}>Clear filters</button>}<button type="button" aria-expanded={open} onClick={toggle}>{open?"Close":filterDrawer?"Filters":"Open"}</button></div></header>
        {open&&<div class="hp-drawer-body">{renderChildren(component.children??[])}</div>}
    </aside>;
}
