import { ContentComponent } from "../../schema/hyperpbiSchema";
import { useRenderContext } from "../../render/RenderContext";
import { renderTemplate } from "../../render/renderTemplate";
export function TextBlock({ component }: { component: ContentComponent }) { const context=useRenderContext();const { data, schema, state }=context;const scopedData={...data,rows:context.getRowsForComponent(component.id??component.type)}; return <div class="hp-text-block">{renderTemplate(component.text ?? "", scopedData, state.values, schema.title ?? "")}</div>; }
