import { describe,expect,it } from "vitest";
import { buildAiPrompt } from "../src/ai/buildAiPrompt";
import { defaultAiPromptSettings } from "../src/ai/aiPromptSettings";
import { extractJsonFromAiResponse } from "../src/ai/extractJsonFromAiResponse";
import { buildAiImportErrorLog } from "../src/editor/ai/AiResponseImporter";
import { sampleRowsForPrompt } from "../src/ai/sampleRowsForPrompt";
import { buildRepairPrompt } from "../src/ai/buildRepairPrompt";
import { NormalizedData } from "../src/data/normalizeData";
import { calculateAggregates } from "../src/data/aggregations";
import { normalizeMapBindings } from "../src/data/normalizeMapBindings";

const rows=[{asset_id:"MH001",risk_score:82,status:"Open"},{asset_id:"MH002",risk_score:30,status:"Closed"}];
const fields={asset_id:{key:"asset_id",displayName:"Asset ID",type:"dimension" as const,roles:["values"]},risk_score:{key:"risk_score",displayName:"Risk Score",type:"measure" as const,roles:["values"]},status:{key:"status",displayName:"Status",type:"dimension" as const,roles:["values"]}};
const data:NormalizedData={rows,rowKeys:rows.map((_,i)=>`row-${i}`),fields,aggregates:calculateAggregates(rows),map:normalizeMapBindings(rows,fields,undefined,undefined,rows.map((_,i)=>`row-${i}`))};
describe("AI authoring",()=>{
    it("builds a relevance-aware version 2 instruction",()=>{const prompt=buildAiPrompt(data,{...defaultAiPromptSettings,privacyMode:"summary",calculationsRequired:true},{width:1200,height:700});for(const text of ["riskScore","schema version 2.0","Return one JSON object only","no JavaScript","1200 × 700","Allowed operations","APPLICATION PATTERNS","COMPONENTS AVAILABLE","globalCss","components","Any component type, property, action, dataset operation"])expect(prompt).toContain(text);expect(prompt).not.toContain("CURRENT DASHBOARD");});
    it("masks sample values and limits rows",()=>{expect(sampleRowsForPrompt(data,"masked",1)).toEqual([{asset_id:"[MASKED]",risk_score:0,status:"[MASKED]"}]);});
    it("extracts one fenced JSON object without broad text repair",()=>{const result=extractJsonFromAiResponse('Explanation\n```json\n{"version":"2.0","components":[{"type":"text","id":"a"}]}\n```\nDone');expect(result.value).toMatchObject({version:"2.0"});expect(result.repaired).toBe(false);const invalid=extractJsonFromAiResponse('{“version”:“2.0”}');expect(invalid.diagnostics?.[0].code).toBe("INVALID_JSON");});
    it("unwraps specification and config package responses",()=>{const result=extractJsonFromAiResponse('{"specification":{"version":"1.0","components":[]},"config":{"version":"1.0"}}');expect(result.value).toMatchObject({version:"1.0",components:[]});expect(result.config).toMatchObject({version:"1.0"});});
    it("builds a complete copyable AI import error log",()=>{const log=buildAiImportErrorLog("original response","{\"fixed\":true}",["bad schema"],["unknown field"],"Repair needed");for(const value of ["Timestamp:","Repair needed","bad schema","unknown field","fixed","original response"])expect(log).toContain(value);});
    it("builds a targeted repair prompt with warnings and strict output",()=>{const prompt=buildRepairPrompt("{}",["components is required"],data,["selectionTarget is not used"]);expect(prompt).toContain("components is required");expect(prompt).toContain("selectionTarget is not used");expect(prompt).toContain("Return one complete corrected JSON object only");expect(prompt).toContain("Valid field aliases");});
});
