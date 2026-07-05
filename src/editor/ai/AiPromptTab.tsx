import { useMemo, useState } from "preact/hooks";
import { buildAiPrompt } from "../../ai/buildAiPrompt";
import { defaultAiPromptSettings } from "../../ai/aiPromptSettings";
import { fieldDictionaryForPrompt } from "../../ai/fieldDictionaryForPrompt";
import { promptQualityChecks } from "../../ai/promptQualityChecks";
import { NormalizedData } from "../../data/normalizeData";
import { AiPromptChecklist } from "./AiPromptChecklist";
import { AiPromptComponentReference } from "./AiPromptComponentReference";
import { AiPromptFieldSummary } from "./AiPromptFieldSummary";
import { AiPromptPreview } from "./AiPromptPreview";
import { AiPromptSampleRows } from "./AiPromptSampleRows";
import { AiPromptSettingsPanel } from "./AiPromptSettingsPanel";
import { AiResponseImporter } from "./AiResponseImporter";
import { copyText, downloadText } from "../textActions";

export function AiPromptTab({data,currentSpecification,onApply,onPreview}:{data:NormalizedData;currentSpecification:string;onApply:(json:string,merge:boolean)=>void;onPreview:(json:string)=>void}){
    const [settings,setSettings]=useState(defaultAiPromptSettings);const [generated,setGenerated]=useState("");const prompt=generated||buildAiPrompt(data,settings,{width:window.innerWidth,height:window.innerHeight});const checks=useMemo(()=>promptQualityChecks(prompt,settings),[prompt,settings]);
    return <div class="hp-ai-designer"><header class="hp-ai-workflow"><div><span>1</span><strong>Describe the dashboard</strong><small>HyperPBI combines your goal, the full engine skill, and current Power BI fields.</small></div><div><span>2</span><strong>Ask your AI</strong><small>Copy the prompt into ChatGPT, DeepSeek, or Copilot.</small></div><div><span>3</span><strong>Paste and preview</strong><small>Import the response, then preview and save to the report.</small></div></header><div class="hp-ai-tab"><aside><div class="hp-privacy-warning"><strong>Your data stays under your control</strong><p>HyperPBI never sends data to an AI service. Review the prompt before copying it. Field-only mode is the default.</p></div><AiPromptSettingsPanel value={settings} fields={Object.keys(data.fields)} onChange={setSettings}/><button class="hp-primary-action hp-generate-prompt" onClick={()=>setGenerated(buildAiPrompt(data,settings,{width:window.innerWidth,height:window.innerHeight}))}>Update AI prompt</button><AiPromptChecklist checks={checks}/><AiPromptFieldSummary data={data} onCopy={()=>void copyText(JSON.stringify(fieldDictionaryForPrompt(data),null,2))}/><AiPromptSampleRows data={data}/><AiPromptComponentReference/></aside><main><AiPromptPreview prompt={prompt} onCopy={()=>void copyText(prompt)} onDownload={()=>downloadText(prompt,"hyperpbi-ai-prompt.txt")}/><AiResponseImporter data={data} currentSpecification={currentSpecification} onApply={onApply} onPreview={onPreview}/></main></div></div>;
}
