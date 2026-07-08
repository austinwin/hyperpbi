import { describe,expect,it } from "vitest";
import { evaluateExpression } from "../src/calculations/expressionEvaluator";
import { validateCalculations } from "../src/calculations/calculationValidator";
import { applyCalculations } from "../src/calculations/calculationEngine";
import { calculateAggregates } from "../src/data/aggregations";
import { normalizeMapBindings } from "../src/data/normalizeMapBindings";
import { NormalizedData } from "../src/data/normalizeData";

const rows=[{risk_score:82,cost:10},{risk_score:40,cost:20}];const fields={risk_score:{key:"risk_score",displayName:"Risk Score",type:"measure" as const,roles:[]},cost:{key:"cost",displayName:"Cost",type:"measure" as const,roles:[]}};const data:NormalizedData={rows,rowKeys:rows.map((_,i)=>`row-${i}`),fields,aggregates:calculateAggregates(rows),map:normalizeMapBindings(rows,fields,undefined,undefined,rows.map((_,i)=>`row-${i}`))};
describe("calculation DSL",()=>{
    it("evaluates case expressions",()=>expect(evaluateExpression({op:"case",cases:[{when:{op:">=",left:{field:"risk_score"},right:{value:80}},then:{value:"High"}}],else:{value:"Normal"}},rows[0])).toBe("High"));
    it("returns null for division by zero",()=>expect(evaluateExpression({op:"/",left:{value:10},right:{value:0}},{})).toBeNull());
    it("detects unknown operators, missing fields, and cycles",()=>{const messages=validateCalculations({fields:[{key:"a",type:"number",expression:{field:"b"}},{key:"b",type:"number",expression:{field:"a"}},{key:"bad",type:"number",expression:{op:"madeUp" as never}}]},Object.keys(fields));expect(messages.some(item=>item.message.includes("Cyclic"))).toBe(true);expect(messages.some(item=>item.message.includes("Unknown calculation operator"))).toBe(true);});
    it("reports missing metric keys instead of duplicate undefined",()=>{const messages=validateCalculations({metrics:[{aggregation:"count"},{aggregation:"count"}] as never},Object.keys(fields));expect(messages.filter(item=>item.message==="Calculated metric key is required.")).toHaveLength(2);expect(messages.some(item=>item.message.includes("undefined"))).toBe(false);});
    it("adds derived fields and metrics",()=>{const result=applyCalculations(data,{fields:[{key:"risk_band",label:"Risk Band",type:"text",expression:{op:"if",condition:{op:">=",left:{field:"risk_score"},right:{value:80}},then:{value:"High"},else:{value:"Normal"}}}],metrics:[{key:"high_risk_count",aggregation:"countWhere",where:{op:"=",left:{field:"risk_band"},right:{value:"High"}}}]});expect(result.errors).toEqual([]);expect(result.data.rows[0].risk_band).toBe("High");expect(result.data.calculatedMetrics?.high_risk_count).toBe(1);});
});
