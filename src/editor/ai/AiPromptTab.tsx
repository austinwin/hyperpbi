import { useMemo, useState } from "preact/hooks";
import { buildAiPrompt } from "../../ai/buildAiPrompt";
import { defaultAiPromptSettings } from "../../ai/aiPromptSettings";
import { fieldDictionaryForPrompt } from "../../ai/fieldDictionaryForPrompt";
import { promptQualityChecks } from "../../ai/promptQualityChecks";
import { NormalizedData } from "../../data/normalizeData";
import { InteractionDiagnostics } from "../../powerbi/interactionDiagnostics";
import { InteractionsPanel } from "../InteractionsPanel";
import { copyText, downloadText } from "../textActions";
import { AiPromptChecklist } from "./AiPromptChecklist";
import { AiPromptComponentReference } from "./AiPromptComponentReference";
import { AiPromptFieldSummary } from "./AiPromptFieldSummary";
import { AiPromptPreview } from "./AiPromptPreview";
import { AiPromptSampleRows } from "./AiPromptSampleRows";
import { AiPromptSettingsPanel } from "./AiPromptSettingsPanel";
import { AiResponseImporter } from "./AiResponseImporter";

export function AiPromptTab({data,currentSpecification,onApply,onPreview,previewReady,diagnostics}:{data:NormalizedData;currentSpecification:string;onApply:(json:string,merge:boolean,configJson?:string)=>void;onPreview:(json:string,configJson?:string)=>boolean;previewReady:boolean;diagnostics:InteractionDiagnostics}){
    const [settings,setSettings]=useState(defaultAiPromptSettings);const [generated,setGenerated]=useState("");const [copyStatus,setCopyStatus]=useState("");const prompt=generated||buildAiPrompt(data,settings,{width:window.innerWidth,height:window.innerHeight});const checks=useMemo(()=>promptQualityChecks(prompt,settings),[prompt,settings]);
    const copyPrompt=async()=>{const next=buildAiPrompt(data,settings,{width:window.innerWidth,height:window.innerHeight});setGenerated(next);const copied=await copyText(next);setCopyStatus(copied?"Prompt copied. Paste it into your preferred AI.":"Copy was blocked; open Review generated prompt and copy manually.");};
    return <div class="hp-guided-builder"><header class="hp-builder-intro"><div><span>GUIDED BUILDER</span><h2>Build a professional dashboard without editing JSON</h2><p>Bind fields in Power BI, describe the dashboard, copy the AI prompt, paste the AI response, preview, and save.</p></div><div><strong>{Object.keys(data.fields).length}</strong><span>fields ready</span><strong>{data.rows.length.toLocaleString()}</strong><span>rows available</span></div></header><div class="hp-builder-grid"><aside class="hp-builder-setup-column"><AiPromptSettingsPanel value={settings} fields={Object.keys(data.fields)} onChange={setSettings}/><AiPromptFieldSummary data={data} onCopy={()=>void copyText(JSON.stringify(fieldDictionaryForPrompt(data),null,2))}/><AiPromptSampleRows data={data}/></aside><main class="hp-builder-workflow-column"><section class="hp-builder-step hp-copy-prompt"><header><span>6</span><div><strong>Generate AI prompt</strong><small>HyperPBI combines your choices, safe engine rules, recipes, and field dictionary.</small></div></header><button class="hp-primary-action" type="button" onClick={()=>void copyPrompt()}>Copy AI Prompt</button>{copyStatus&&<p>{copyStatus}</p>}<details><summary>Review generated prompt</summary><AiPromptPreview prompt={prompt} onCopy={()=>void copyText(prompt)} onDownload={()=>downloadText(prompt,"hyperpbi-ai-prompt.txt")}/><AiPromptChecklist checks={checks}/></details></section><AiResponseImporter data={data} currentSpecification={currentSpecification} onApply={onApply} onPreview={onPreview}/><section class={`hp-builder-step hp-save-ready ${previewReady?"is-ready":""}`}><header><span>8</span><div><strong>Save to Power BI</strong><small>{previewReady?"Validation passed. Use Save & return in the header.":"Save becomes available after a successful preview."}</small></div></header><div>{previewReady?"✓ Ready to save":"Waiting for a valid preview"}</div></section><details class="hp-builder-support"><summary>Interaction status</summary><InteractionsPanel diagnostics={diagnostics} compact/></details><AiPromptComponentReference fieldKeys={Object.keys(data.fields)}/></main></div></div>;
}
