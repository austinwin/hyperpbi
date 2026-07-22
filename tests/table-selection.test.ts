import { describe,expect,it } from "vitest";
import { nextTableSelection } from "../src/components/tables/TableBlock";

describe("table selection behavior",()=>{
    it("replaces selection on normal click and toggles with Ctrl/Cmd",()=>{expect(nextTableSelection([1,2],3,false)).toEqual([3]);expect(nextTableSelection([1],2,true)).toEqual([1,2]);expect(nextTableSelection([1,2],2,true)).toEqual([1]);});
});
