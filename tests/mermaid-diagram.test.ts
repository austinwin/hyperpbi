import { beforeEach, describe, expect, it } from "vitest";
import { annotateMermaidNodes } from "../src/components/mermaid/mermaidRuntime";
import { sanitizeSvg } from "../src/security/sanitizeSvg";
import { validateSchema } from "../src/schema/validateSchema";
import { getComponentDescriptor } from "../src/catalog/componentDescriptorRegistry";
import { componentKindForType, resolveInteractionPolicy } from "../src/interactions/interactionPolicy";

describe("mermaidDiagram schema and catalog", () => {
    const valid={version:"2.0",components:[{type:"mermaidDiagram",id:"flow",source:"flowchart LR\nSR[Service Request] --> WO[Work Order]",theme:"auto",fit:"contain",panZoom:true,frameless:true,nodeBindings:[{nodeId:"SR",field:"serviceRequestNumber",value:"20302270"}]}]};
    it("registers a first-class component with a multiline source editor",()=>{
        expect(validateSchema(valid).valid).toBe(true);
        expect(getComponentDescriptor("mermaidDiagram")?.inspector.find(item=>item.property==="source")?.control).toBe("multiline");
        expect(componentKindForType("mermaidDiagram")).toBe("dataPoint");
    });
    it("rejects blank/oversized source, duplicate bindings, unknown config, and unsafe identity",()=>{
        expect(validateSchema({version:"2.0",components:[{type:"mermaidDiagram",id:"x",source:"  "}]}).valid).toBe(false);
        expect(validateSchema({version:"2.0",components:[{...(valid.components[0] as any),securityLevel:"loose"}]}).valid).toBe(false);
        expect(validateSchema({version:"2.0",components:[{...(valid.components[0] as any),nodeBindings:[{nodeId:"SR",field:"A"},{nodeId:"SR",field:"B"}]}]}).errors.join(" ")).toContain("duplicated");
        expect(validateSchema({version:"2.0",components:[{...(valid.components[0] as any),nodeBindings:[{nodeId:"bad id",field:"A"}]}]}).valid).toBe(false);
    });
    it("merges component and per-node interaction policy safely",()=>{
        const component:any={type:"mermaidDiagram",id:"flow",source:"flowchart LR\nA-->B",interaction:{enabled:true,internalMode:"filter",externalMode:"selection",targets:["table"]}};
        const merged={...component,interaction:{...component.interaction,selectionMode:"toggle",field:"workOrderNumber"}};
        const policy=resolveInteractionPolicy(merged,{interactions:{}} as any,"dataPoint");
        expect(policy).toMatchObject({enabled:true,internalMode:"filter",externalMode:"selection",selectionMode:"toggle",field:"workOrderNumber",targets:["table"]});
    });
});

describe("Mermaid SVG security and identity",()=>{
    beforeEach(()=>document.body.replaceChildren());
    it("annotates stable flowchart node identity before namespace isolation",()=>{
        const source='<svg xmlns="http://www.w3.org/2000/svg"><g id="flowchart-SR-0" class="node default"><rect/><text>SR</text></g><g id="flowchart-WO-1" class="node default"><rect/></g></svg>';
        const annotated=annotateMermaidNodes(source,["SR","WO"]);
        const sanitized=sanitizeSvg(annotated.svg,"hp-one",{mermaidNodeIds:new Set(["SR","WO"])});
        expect(annotated.boundNodeIds).toEqual(["SR","WO"]);
        expect(sanitized.svg).toContain('data-hp-mermaid-node="SR"');
        expect(sanitized.svg).toContain('id="hp-one-flowchart-SR-0"');
        expect(sanitizeSvg(annotated.svg,"hp-two",{mermaidNodeIds:new Set(["SR","WO"])}).svg).toContain('id="hp-two-flowchart-SR-0"');
    });
    it("blocks scripts, event handlers, links, foreignObject, external URLs, and unrestricted data attributes",()=>{
        const result=sanitizeSvg('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script><foreignObject/><gimachicken data-evil="x"/><g data-hp-mermaid-node="SR" onclick="evil()"><path marker-end="url(#remote)"/></g><a href="javascript:evil()"><text>bad</text></a></svg>',"hp-safe",{mermaidNodeIds:new Set(["SR"])});
        expect(result.svg).not.toMatch(/script|foreignObject|onclick|href=|data-evil|javascript/i);
        expect(result.svg).toContain('data-hp-mermaid-node="SR"');
        expect(sanitizeSvg('<svg><g data-hp-mermaid-node="SR"/></svg>',"hp-raw").svg).not.toContain("data-hp-mermaid-node");
    });
});
