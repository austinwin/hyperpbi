import { describe, expect, it } from "vitest";
import { defaultStudioLayout, parseStudioLayout } from "../src/editor/studioLayout";

describe("Studio layout preferences",()=>{
    it("uses AI-first simple defaults",()=>expect(defaultStudioLayout).toMatchObject({advanced:false,bottomOpen:true}));
    it("clamps persisted pane sizes",()=>expect(parseStudioLayout(JSON.stringify({editorPercent:99,bottomHeight:20,advanced:true}))).toMatchObject({editorPercent:75,bottomHeight:120,advanced:true}));
    it("recovers from invalid persisted JSON",()=>expect(parseStudioLayout("bad")).toEqual(defaultStudioLayout));
});
