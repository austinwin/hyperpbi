import { ComponentBase } from "../../schema/hyperpbiSchema";
import { AuthoredMarkup } from "../../security/AuthoredMarkup";
import { DataRow } from "../../data/normalizeData";

export function SlotRenderer({ component, name, row }: { component: ComponentBase; name: keyof NonNullable<ComponentBase["slots"]>; row?: DataRow }) {
    const template = component.slots?.[name]; if (!template) return null;
    return <div class={`hp-slot hp-slot-${name}`}><AuthoredMarkup template={template} componentId={component.id ?? component.type} title={component.title} row={row} props={component.props} css={component.css} /></div>;
}
