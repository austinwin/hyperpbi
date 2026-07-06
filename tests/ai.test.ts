import { describe,expect,it } from "vitest";
import { buildAiPrompt } from "../src/ai/buildAiPrompt";
import { defaultAiPromptSettings } from "../src/ai/aiPromptSettings";
import { extractJsonFromAiResponse } from "../src/ai/extractJsonFromAiResponse";
import { sampleRowsForPrompt } from "../src/ai/sampleRowsForPrompt";
import { buildRepairPrompt } from "../src/ai/buildRepairPrompt";
import { NormalizedData } from "../src/data/normalizeData";
import { calculateAggregates } from "../src/data/aggregations";
import { normalizeMapBindings } from "../src/data/normalizeMapBindings";

const rows=[{asset_id:"MH001",risk_score:82,status:"Open"},{asset_id:"MH002",risk_score:30,status:"Closed"}];
const fields={asset_id:{key:"asset_id",displayName:"Asset ID",type:"dimension" as const,roles:["values"]},risk_score:{key:"risk_score",displayName:"Risk Score",type:"measure" as const,roles:["values"]},status:{key:"status",displayName:"Status",type:"dimension" as const,roles:["values"]}};
const data:NormalizedData={rows,fields,aggregates:calculateAggregates(rows),map:normalizeMapBindings(rows,fields)};
describe("AI authoring",()=>{
    it("builds a professional catalog- and recipe-aware instruction",()=>{const prompt=buildAiPrompt(data,{...defaultAiPromptSettings,privacyMode:"summary",calculationsRequired:true},{width:1200,height:700});for(const text of ["risk_score","Return only one valid JSON object","does not execute JavaScript","1200 x 700","repeat.distinctBy","valueFromRow","Never invent externalSelection","Shared component properties","advancedChart","Executive overview","Map-first dashboard","Dense 600x500 Power BI visual","styles.globalCss","styles.components"])expect(prompt).toContain(text);});
    it("masks sample values and limits rows",()=>{expect(sampleRowsForPrompt(data,"masked",1)).toEqual([{asset_id:"[MASKED]",risk_score:0,status:"[MASKED]"}]);});
    it("extracts the largest valid JSON object from prose and fences",()=>{const result=extractJsonFromAiResponse('Explanation\n```json\n{"version":"1.0","components":[{"type":"text","id":"a"}]}\n```');expect(result.value).toMatchObject({version:"1.0"});});
    it("builds a targeted repair prompt with warnings and strict output",()=>{const prompt=buildRepairPrompt("{}",["components is required"],data,["selectionTarget is not used"]);expect(prompt).toContain("components is required");expect(prompt).toContain("selectionTarget is not used");expect(prompt).toContain("Return one corrected JSON object only");expect(prompt).toContain("Valid field dictionary");});
});
