import { describe,expect,it } from "vitest";
import { scopeComponentCss } from "../src/components/custom/componentCssScope";
import { renderTemplate } from "../src/render/renderTemplate";
import { sanitizeHtml } from "../src/security/sanitizeHtml";
import { calculateAggregates } from "../src/data/aggregations";
import { normalizeMapBindings } from "../src/data/normalizeMapBindings";
import { NormalizedData } from "../src/data/normalizeData";

const rows=[{asset_id:"MH001"}];const fields={asset_id:{key:"asset_id",displayName:"Asset ID",type:"dimension" as const,roles:[]}};const data:NormalizedData={rows,fields,aggregates:calculateAggregates(rows),calculatedMetrics:{high_risk_count:3},map:normalizeMapBindings(rows,fields)};
describe("custom components",()=>{
    it("binds metrics, rows, props, state and field labels",()=>{const output=renderTemplate("{{metric.high_risk_count}} {{row.asset_id}} {{prop.tone}} {{state.mode}} {{field.asset_id.displayName}}",data,{},"",{row:rows[0],props:{tone:"warning"},state:{mode:"compact"}});expect(output).toBe("3 MH001 warning compact Asset ID");});
    it("scopes CSS and blocks fixed positioning",()=>{const result=scopeComponentCss(".card { color:red; position:fixed }","riskSummary");expect(result.css).toContain('[data-hp-id="riskSummary"] .card');expect(result.css).not.toContain("fixed");});
    it("removes scripts and event handlers from custom HTML",()=>{const result=sanitizeHtml('<div onclick="alert(1)"><script>bad()</script>Safe</div>');expect(result.html).toContain("Safe");expect(result.html).not.toContain("script");expect(result.html).not.toContain("onclick");});
});
