import { ContentComponent } from "../../schema/hyperpbiSchema";
import { useRenderContext } from "../../render/RenderContext";
import { renderTemplate } from "../../render/renderTemplate";
export function MarkdownBlock({ component }: { component: ContentComponent }) { const { data, schema, state } = useRenderContext(); const text = renderTemplate(component.text ?? "", data, state.values, schema.title ?? ""); return <div class="hp-markdown">{text.split(/\r?\n/).map(line => line.startsWith("### ") ? <h4>{line.slice(4)}</h4> : line.startsWith("## ") ? <h3>{line.slice(3)}</h3> : line.startsWith("# ") ? <h2>{line.slice(2)}</h2> : line.startsWith("- ") ? <div class="hp-markdown-item">• {line.slice(2)}</div> : <p>{line}</p>)}</div>; }
