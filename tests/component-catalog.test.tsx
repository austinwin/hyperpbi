import { h, render } from "preact";
import { describe, expect, it } from "vitest";
import { componentTypeNames } from "../src/catalog/componentCatalog";
import { AiPromptComponentReference } from "../src/editor/ai/AiPromptComponentReference";

describe("AI component catalog",()=>{
    it("provides compact copyable JSON for every standard component",()=>{const host=document.createElement("div");render(h(AiPromptComponentReference,{fieldKeys:["field"]}),host);expect(host.querySelectorAll(".hp-component-json")).toHaveLength(componentTypeNames.length);expect(host.textContent).toContain("Copy minimal dashboard JSON");expect(host.textContent).toContain("Copy component JSON");expect(host.innerHTML).toContain("__field_key__");});
});
