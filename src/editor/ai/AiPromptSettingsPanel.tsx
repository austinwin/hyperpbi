import { useState } from "preact/hooks";
import { AiPromptSettings } from "../../ai/aiPromptSettings";
import { builderAudiences, builderComponentOptions, dashboardGoals, layoutPatterns, stylePresetOptions } from "../builder/builderState";

const ChoiceGrid=({items,value,onChoose}:{items:string[];value:string;onChoose:(item:string)=>void})=><div class="hp-choice-grid">{items.map(item=><button type="button" class={value===item?"is-selected":""} title={item} aria-label={item} onClick={()=>onChoose(item)}><span>{item}</span></button>)}</div>;

interface BuilderAccordionStepProps {
    number: number;
    title: string;
    description: string;
    summary: string;
    open: boolean;
    onToggle: () => void;
    children: preact.ComponentChildren;
}
function BuilderAccordionStep({number,title,description,summary,open,onToggle,children}:BuilderAccordionStepProps){
    return <section class={`hp-builder-accordion-step ${open?"is-open":"is-collapsed"}`}>
        <button type="button" class="hp-builder-step-toggle" aria-expanded={open} aria-controls={`builder-step-${number}`} onClick={onToggle}>
            <span class="hp-builder-step-number">{number}</span>
            <span class="hp-builder-step-copy"><strong>{title}</strong><small>{description}</small></span>
            <span class="hp-builder-step-summary" title={summary}>{summary}</span>
            <span class="hp-builder-chevron" aria-hidden="true">{open?"−":"+"}</span>
        </button>
        {open && <div id={`builder-step-${number}`} class="hp-builder-step-content">{children}</div>}
    </section>;
}

export function AiPromptSettingsPanel({ value, fields, onChange }: { value: AiPromptSettings; fields: string[]; onChange: (value: AiPromptSettings) => void }) {
    const [openStep, setOpenStep] = useState<number | null>(null);
    const update = <K extends keyof AiPromptSettings>(key: K, next: AiPromptSettings[K]) => onChange({ ...value, [key]: next });
    const toggleStep=(step:number)=>setOpenStep(openStep===step?null:step);
    const toggleComponent=(item:string)=>{const components=value.components.includes(item)?value.components.filter(existing=>existing!==item):[...value.components,item];onChange({...value,components,externalInteractions:components.includes("External Power BI selection"),mapRequired:components.includes("Map"),tableRequired:components.includes("Table"),chartsRequired:components.includes("Charts")||components.includes("Advanced ECharts"),controlsRequired:components.includes("Search box")||components.includes("Filters/selectors")});};

    const componentSummary=()=>{const count=value.components.length;if(!count)return"No optional components";if(count===1)return value.components[0];return `${count} selected`;};
    const componentTitle=()=>value.components.length?value.components.join(", "):"No optional components";

    return <div class="hp-builder-choices">
        <div class="hp-builder-setup-heading">
            <div><strong>Dashboard setup</strong><small>Defaults are ready. Expand a step to customize.</small></div>
            <button type="button" onClick={()=>setOpenStep(openStep===null?1:null)}>{openStep===null?"Customize":"Collapse"}</button>
        </div>

        <BuilderAccordionStep number={1} title="Dashboard goal" description="Choose the closest outcome." summary={value.goal} open={openStep===1} onToggle={()=>toggleStep(1)}>
            <ChoiceGrid items={dashboardGoals} value={value.goal} onChoose={item=>update("goal",item)}/>
            <label class="hp-builder-custom"><span>Or describe it</span><input value={value.goal} onInput={event=>update("goal",event.currentTarget.value)}/></label>
        </BuilderAccordionStep>

        <BuilderAccordionStep number={2} title="Audience" description="Sets density and explanation level." summary={value.audience} open={openStep===2} onToggle={()=>toggleStep(2)}>
            <ChoiceGrid items={builderAudiences} value={value.audience} onChoose={item=>update("audience",item)}/>
        </BuilderAccordionStep>

        <BuilderAccordionStep number={3} title="Layout pattern" description="Start with a proven information hierarchy." summary={value.layoutPattern} open={openStep===3} onToggle={()=>toggleStep(3)}>
            <ChoiceGrid items={layoutPatterns} value={value.layoutPattern} onChoose={item=>update("layoutPattern",item)}/>
        </BuilderAccordionStep>

        <BuilderAccordionStep number={4} title="Components" description="Select only what supports the decision." summary={componentSummary()} open={openStep===4} onToggle={()=>toggleStep(4)}>
            <div class="hp-builder-toggles">{builderComponentOptions.map(item=><label title={item}><input type="checkbox" checked={value.components.includes(item)} onChange={()=>toggleComponent(item)}/><span>{item}</span></label>)}</div>
        </BuilderAccordionStep>

        <BuilderAccordionStep number={5} title="Style preset" description="Professional tokens and component guidance." summary={value.stylePreset} open={openStep===5} onToggle={()=>toggleStep(5)}>
            <ChoiceGrid items={stylePresetOptions} value={value.stylePreset} onChoose={item=>onChange({...value,stylePreset:item,designStyle:item})}/>
        </BuilderAccordionStep>

        <details class="hp-builder-data-options">
            <summary>Advanced data options <small>Privacy, samples, and selected fields</small></summary>
            <div class="hp-form-grid">
                <label><span>Privacy</span><select value={value.privacyMode} onChange={event=>update("privacyMode",event.currentTarget.value as AiPromptSettings["privacyMode"])}><option value="fields">Field dictionary only</option><option value="samples">Sample rows</option><option value="masked">Masked samples</option><option value="summary">Summary only</option><option value="types">Types only</option></select></label>
                <label><span>Sample rows</span><input type="number" min="1" max="50" value={value.sampleRows} onInput={event=>update("sampleRows",Math.min(50,Math.max(1,Number(event.currentTarget.value))))}/></label>
            </div>
            <label><span>Fields (empty means all)</span><select multiple onChange={event=>update("selectedFields",Array.from(event.currentTarget.selectedOptions).map(option=>option.value))}>{fields.map(field=><option value={field} selected={value.selectedFields.includes(field)}>{field}</option>)}</select></label>
        </details>
    </div>;
}
