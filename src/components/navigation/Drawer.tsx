import { DashboardComponent, DrawerComponent } from "../../schema/hyperpbiSchema";
import { useRenderContext } from "../../render/RenderContext";
import { selectedSourceRowIndex } from "../../render/selection";

export function Drawer({ component, renderChildren }: { component: DrawerComponent; renderChildren: (children: DashboardComponent[]) => preact.ComponentChildren }) {
    const { state, dispatch } = useRenderContext(); const id=component.id??component.type; const selected=selectedSourceRowIndex(state);
    const condition=component.openWhen??(component.type==="filterDrawer"?"always":"selectedRow"); const conditionOpen=condition==="always"||condition==="selectedRow"&&selected!==undefined||condition==="state"&&Boolean(state.values[component.stateKey??id]);
    const collapsed=state.collapsed[id]??!(component.defaultOpen??conditionOpen); const open=conditionOpen&&!collapsed; const filterDrawer=component.type==="filterDrawer";
    const toggle=()=>dispatch({type:"collapse",id,value:open});
    return <aside class={`hp-drawer hp-drawer-${component.position??"right"} ${open?"is-open":"is-closed"}`} style={{"--hp-drawer-width":`${Math.min(560,Math.max(220,component.width??320))}px`}}>
        <header><div><strong>{component.title??(filterDrawer?"Filters":"Details")}</strong>{filterDrawer&&<span>{state.filters.length} applied</span>}</div><div>{filterDrawer&&state.filters.length>0&&<button type="button" onClick={()=>dispatch({type:"clearFilters"})}>Clear filters</button>}<button type="button" aria-expanded={open} onClick={toggle}>{open?"Close":filterDrawer?"Filters":"Open"}</button></div></header>
        {open&&<div class="hp-drawer-body">{renderChildren(component.children??[])}</div>}
    </aside>;
}
