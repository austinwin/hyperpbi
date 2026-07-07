import { describe,expect,it,vi } from "vitest";
import { applyExternalFilter,clearExternalFilter } from "../src/powerbi/externalFilters";
import { NormalizedField } from "../src/data/normalizeData";

const fields:Record<string,NormalizedField>={status:{key:"status",displayName:"Status",sourceTable:"Work Orders",sourceColumn:"Status",type:"dimension",roles:["values"]},calculated:{key:"calculated",displayName:"Calculated",type:"dimension",roles:[]}};
const host=()=>({applyJsonFilter:vi.fn()});

describe("external Power BI filters",()=>{
    it("creates a BasicFilter for select values",()=>{const target=host();const result=applyExternalFilter(target,fields,"status","=","Open");expect(result.sent).toBe(true);expect(target.applyJsonFilter).toHaveBeenCalledWith(expect.objectContaining({$schema:expect.stringContaining("#basic"),target:{table:"Work Orders",column:"Status"},operator:"In",values:["Open"]}),"general","filter",0);});
    it("creates one In BasicFilter for multi-select",()=>{const target=host();applyExternalFilter(target,fields,"status","in",["Open","Closed"]);expect(target.applyJsonFilter).toHaveBeenCalledWith(expect.objectContaining({operator:"In",values:["Open","Closed"]}),"general","filter",0);});
    it("creates an AdvancedFilter Contains for text search",()=>{const target=host();applyExternalFilter(target,fields,"status","contains","open");expect(target.applyJsonFilter).toHaveBeenCalledWith(expect.objectContaining({$schema:expect.stringContaining("#advanced"),logicalOperator:"And",conditions:[{operator:"Contains",value:"open"}]}),"general","filter",0);});
    it("removes the general filter for All/empty",()=>{const target=host();applyExternalFilter(target,fields,"status","=","");expect(target.applyJsonFilter).toHaveBeenCalledWith(null,"general","filter",1);const second=host();clearExternalFilter(second);expect(second.applyJsonFilter).toHaveBeenCalledWith(null,"general","filter",1);});
    it("reports fields without a Power BI target",()=>{const target=host();const result=applyExternalFilter(target,fields,"calculated","=","x");expect(result).toMatchObject({sent:false,reason:"field has no Power BI filter target"});expect(target.applyJsonFilter).not.toHaveBeenCalled();});
});
