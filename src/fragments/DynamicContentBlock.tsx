import type { DynamicContentComponent } from "../schema/hyperpbiSchema";
import { useRenderContext } from "../render/RenderContext";
import { dynamicEventKey } from "./fragmentTypes";
import { RemoteFragmentHost } from "./RemoteFragmentHost";

export function DynamicContentBlock({ component }: { component: DynamicContentComponent }) {
    const context = useRenderContext();
    const trigger = component.trigger;
    const event = trigger && context.dynamicEvents?.[dynamicEventKey(trigger.source, trigger.event)];
    if (trigger && !event && !component.loadOnMount) {
        return <section aria-label={component.title ?? "Dynamic content"} class="hp-dynamic-idle">
            {component.title && <h3>{component.title}</h3>}
            <p>{component.emptyText ?? "Make a selection to load details."}</p>
        </section>;
    }
    return <RemoteFragmentHost request={component.request} values={event?.context} title={component.title}
        eventRevision={event?.revision} refreshOnEvent={trigger?.refresh} />;
}
