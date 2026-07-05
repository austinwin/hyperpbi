import { useState } from "preact/hooks";
import { buildRepairPrompt } from "../../ai/buildRepairPrompt";
import { extractJsonFromAiResponse } from "../../ai/extractJsonFromAiResponse";
import { validateAiGeneratedSpec } from "../../ai/validateAiGeneratedSpec";
import { NormalizedData } from "../../data/normalizeData";
import { copyText } from "../textActions";

export function AiResponseImporter({ data, currentSpecification, onApply, onPreview }: { data: NormalizedData; currentSpecification: string; onApply: (json:string, merge:boolean)=>void; onPreview:(json:string)=>void }) {
    const [response,setResponse]=useState(""); const [json,setJson]=useState(""); const [errors,setErrors]=useState<string[]>([]); const [warnings,setWarnings]=useState<string[]>([]);
    const extract=()=>{const result=extractJsonFromAiResponse(response); if(result.error){setErrors([result.error]);return;} const validation=validateAiGeneratedSpec(result.value,data); setJson(result.json??"");setErrors(validation.errors);setWarnings(validation.warnings);};
    const repair=buildRepairPrompt(json||response,errors,data);
    return <section class="hp-ai-import"><header><strong>Paste the AI response</strong><span>Raw JSON, fenced JSON, and explanatory text are accepted.</span></header><textarea value={response} onInput={event=>setResponse(event.currentTarget.value)} placeholder="Paste the complete ChatGPT, DeepSeek, or Copilot response here…"/><div class="hp-button-row"><button class="hp-primary-action" onClick={extract}>Use this response</button>{json&&<><button disabled={errors.length>0} onClick={()=>onApply(json,false)}>Replace dashboard</button><button disabled={errors.length>0} onClick={()=>onPreview(json)}>Preview only</button><details class="hp-inline-advanced"><summary>More</summary><button disabled={errors.length>0} onClick={()=>onApply(json,true)}>Merge with current</button></details></>}{errors.length>0&&<button onClick={()=>void copyText(repair)}>Copy repair prompt</button>}<button onClick={()=>{setResponse("");setJson("");setErrors([]);}}>Clear</button></div>{errors.length>0&&<div class="hp-validation-list hp-validation-error"><strong>{errors.length} issue(s) to fix</strong><ul>{errors.map(error=><li>{error}</li>)}</ul></div>}{warnings.length>0&&<div class="hp-validation-list"><strong>{warnings.length} note(s)</strong><ul>{warnings.map(warning=><li>{warning}</li>)}</ul></div>}{json&&<details><summary>Show extracted JSON</summary><pre>{json}</pre></details>}</section>;
}
