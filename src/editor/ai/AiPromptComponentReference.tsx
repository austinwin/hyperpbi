import { componentCategories, componentsByCategory } from "../../catalog/componentCatalog";
import { customComponentTemplates } from "../../components/custom/customComponentTemplates";
import { copyText } from "../textActions";

const capabilityLabels:Record<string,string>={fields:"Fields",calculations:"Calc",css:"CSS",slots:"Slots",interactions:"Click",externalSelection:"Power BI",customHtml:"HTML"};
export function AiPromptComponentReference({fieldKeys=[]}:{fieldKeys?:string[]}) {
    return <details class="hp-ai-details hp-catalog"><summary>Component catalog & safe custom templates</summary><p>Recommended components cover most dashboards. Expand only the category you need; Advanced components are specialized.</p>{componentCategories.map(category=><details open={category==="Display"}><summary>{category}</summary><div class="hp-catalog-grid">{componentsByCategory(category).map(component=><article class={`hp-level-${component.level}`}><header><strong>{component.label}</strong><code>{component.type}</code></header><p>{component.useWhen}</p><div>{Object.entries(component.capability).filter(([,enabled])=>enabled).map(([key])=><span>{capabilityLabels[key]}</span>)}</div></article>)}</div></details>)}<section class="hp-template-gallery"><h4>Custom component templates</h4><div>{customComponentTemplates(fieldKeys).map(template=><article><strong>{template.name}</strong><span>{template.description}</span><button type="button" onClick={()=>void copyText(JSON.stringify(template.component,null,2))}>Copy template</button></article>)}</div></section></details>;
}
