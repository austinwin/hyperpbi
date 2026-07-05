import { ContentComponent } from "../../schema/hyperpbiSchema";
import { useRenderContext } from "../../render/RenderContext";
import { renderTemplate } from "../../render/renderTemplate";
export function TextBlock({ component }: { component: ContentComponent }) { const { data, schema, state } = useRenderContext(); return <div class="hp-text-block">{renderTemplate(component.text ?? "", data, state.values, schema.title ?? "")}</div>; }
