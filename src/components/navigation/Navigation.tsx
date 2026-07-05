import { DashboardComponent, TabsComponent } from "../../schema/hyperpbiSchema";
import { useRenderContext } from "../../render/RenderContext";

export function Tabs({ component, renderChildren }: { component: TabsComponent; renderChildren: (children: DashboardComponent[]) => preact.ComponentChildren }) {
    const { state, dispatch } = useRenderContext();
    const id = component.id ?? "mainTabs";
    const active = state.activeTabs[id] ?? component.tabs[0]?.id;
    const tab = component.tabs.find(item => item.id === active) ?? component.tabs[0];
    const children = tab?.children ?? tab?.components ?? tab?.content ?? [];
    return <div class="hp-tabs"><div class="nav nav-tabs" role="tablist">{component.tabs.map(item => <button type="button" role="tab" aria-selected={item.id === tab?.id} class={`nav-link ${item.id === tab?.id ? "active" : ""}`} onClick={() => dispatch({ type: "tab", id, value: item.id })}>{item.title}</button>)}</div><div class="hp-tab-content">{tab && renderChildren(children)}</div></div>;
}

export function Collapsible({ component, renderChildren }: { component: DashboardComponent; renderChildren: (children: DashboardComponent[]) => preact.ComponentChildren }) {
    const { state, dispatch } = useRenderContext();
    const id = component.id ?? component.title ?? "collapsible";
    const fallback = !("defaultOpen" in component) || component.defaultOpen !== false;
    const open = state.collapsed[id] === undefined ? fallback : !state.collapsed[id];
    const children = "children" in component ? component.children ?? [] : [];
    return <section class="hp-collapsible"><button type="button" class="hp-collapse-button" aria-expanded={open} onClick={() => dispatch({ type: "collapse", id })}><span>{component.title ?? "Section"}</span><span>{open ? "−" : "+"}</span></button>{open && <div class="hp-collapse-content">{renderChildren(children)}</div>}</section>;
}
