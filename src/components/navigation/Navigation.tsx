import { DashboardComponent, TabsComponent } from "../../schema/hyperpbiSchema";
import { useRenderContext } from "../../render/RenderContext";
import { executeComponentInteraction } from "../../interactions/componentInteraction";
import { createInteractionPayload } from "../../interactions/interactionPayload";
import { resolveInteractionPolicy } from "../../interactions/interactionPolicy";

export function Tabs({ component, renderChildren }: { component: TabsComponent; renderChildren: (children: DashboardComponent[]) => preact.ComponentChildren }) {
    const context=useRenderContext();const { state, dispatch } = context;const policy=resolveInteractionPolicy(component,context.config,"navigation");
    const id = component.id ?? "mainTabs";
    const active = state.activeTabs[id] ?? component.tabs[0]?.id;
    const tab = component.tabs.find(item => item.id === active) ?? component.tabs[0];
    const children = tab?.children ?? [];
    return <div class="hp-tabs"><div class="nav nav-tabs" role="tablist">{component.tabs.map(item => <button type="button" role="tab" aria-selected={item.id === tab?.id} class={`nav-link ${item.id === tab?.id ? "active" : ""}`} onClick={event=>{dispatch({ type: "tab", id, value: item.id });executeComponentInteraction(policy,createInteractionPayload(component,{value:item.id}),context,{trigger:"click",event});}}>{item.title}</button>)}</div><div class="hp-tab-content">{tab && renderChildren(children)}</div></div>;
}

export function Collapsible({ component, renderChildren }: { component: DashboardComponent; renderChildren: (children: DashboardComponent[]) => preact.ComponentChildren }) {
    const context=useRenderContext();const { state, dispatch } = context;const policy=resolveInteractionPolicy(component,context.config,"navigation");
    const id = component.id ?? component.title ?? "collapsible";
    const fallback = !("defaultOpen" in component) || component.defaultOpen !== false;
    const open = state.collapsed[id] === undefined ? fallback : !state.collapsed[id];
    const children = "children" in component ? component.children ?? [] : [];
    return <section class="hp-collapsible"><button type="button" class="hp-collapse-button" aria-expanded={open} onClick={event=>{dispatch({ type: "collapse", id });executeComponentInteraction(policy,createInteractionPayload(component,{value:!open}),context,{trigger:"click",event});}}><span>{component.title ?? "Section"}</span><span>{open ? "−" : "+"}</span></button>{open && <div class="hp-collapse-content">{renderChildren(children)}</div>}</section>;
}
