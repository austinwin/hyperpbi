import { describe,expect,it } from "vitest";
import { nextTableSelection, tableRowsForSelection } from "../src/components/tables/TableBlock";

describe("table selection behavior",()=>{
    it("replaces selection on normal click and toggles with Ctrl/Cmd",()=>{expect(nextTableSelection([1,2],3,false)).toEqual([3]);expect(nextTableSelection([1],2,true)).toEqual([1,2]);expect(nextTableSelection([1,2],2,true)).toEqual([1]);});
    it("filters selectable tables by default and supports highlight-only mode",()=>{const rows=[{id:1},{id:2},{id:3}];expect(tableRowsForSelection(rows,rows,[1],undefined)).toEqual([{id:2}]);expect(tableRowsForSelection(rows,rows,[1],"highlight")).toEqual(rows);});
});
