import { ContentComponent } from "../../schema/hyperpbiSchema";
import { AuthoredMarkup } from "../../security/AuthoredMarkup";

export function HtmlBlock({ component }: { component: ContentComponent }) {
    return <div class="hp-html-block"><AuthoredMarkup template={component.html ?? ""} componentId={component.id ?? component.type} title={component.title} css={component.css} /></div>;
}
