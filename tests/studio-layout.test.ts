import { describe, expect, it } from "vitest";
import { defaultStudioLayout, parseStudioLayout } from "../src/editor/studioLayout";
import { readFileSync } from "node:fs";

describe("Studio layout preferences",()=>{
    it("uses AI-first simple defaults",()=>expect(defaultStudioLayout).toMatchObject({advanced:false,bottomOpen:true}));
    it("clamps persisted pane sizes",()=>expect(parseStudioLayout(JSON.stringify({editorPercent:99,bottomHeight:20,advanced:true}))).toMatchObject({editorPercent:75,bottomHeight:120,advanced:true}));
    it("recovers from invalid persisted JSON",()=>expect(parseStudioLayout("bad")).toEqual(defaultStudioLayout));
    it("uses the persisted editor size in simple horizontal and narrow vertical splits",()=>{const css=readFileSync("src/styles/hyperpbi.css","utf8");expect(css).toContain(".hp-studio-simple .hp-studio-workbench { grid-template-columns: minmax(260px, var(--hp-editor-size, 58%)) 4px minmax(260px, 1fr); }");expect(css).toContain("grid-template-rows:minmax(220px,var(--hp-editor-size,55%)) 4px minmax(200px,1fr)");});
});
