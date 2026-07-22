import { describe, expect, it } from "vitest";
import { positionAnchoredOverlay } from "../src/components/overlays/overlayPositioning";
import { getOverlayAnchor } from "../src/components/overlays/overlayTypes";
import { dashboardReducer, initialDashboardState } from "../src/render/stateStore";
import { validateSchema } from "../src/schema/validateSchema";

describe("overlay architecture",()=>{
    it("flips and shifts anchored panels inside the visual viewport",()=>{
        const result=positionAnchoredOverlay({anchor:{top:170,left:280,width:20,height:20},panelWidth:120,panelHeight:100,placement:"bottom-end",viewportWidth:320,viewportHeight:200,padding:8});
        expect(result.placement).toBe("top-end");
        expect(result.left).toBeGreaterThanOrEqual(8);expect(result.left+120).toBeLessThanOrEqual(312);expect(result.top).toBeGreaterThanOrEqual(8);
    });
    it("captures serializable trigger geometry and clears it on close",()=>{
        const button=document.createElement("button");button.id="menu-trigger";button.getBoundingClientRect=()=>({top:10,left:20,width:30,height:40,right:50,bottom:50,x:20,y:10,toJSON:()=>({})});
        const anchor=getOverlayAnchor({currentTarget:button} as unknown as Event);
        expect(anchor).toEqual({top:10,left:20,width:30,height:40,triggerId:"menu-trigger"});
        const open=dashboardReducer(initialDashboardState(),{type:"openOverlay",id:"menu",anchor});
        expect(open.overlayAnchors.menu).toEqual(anchor);
        expect(dashboardReducer(open,{type:"closeOverlay",id:"menu"}).overlayAnchors.menu).toBeUndefined();
    });
    it("requires overlay IDs and detects duplicates throughout nested containers",()=>{
        const missing=validateSchema({version:"2.0",components:[{type:"dropdown",items:[{id:"x",label:"X"}]}]});
        expect(missing.errors.join(" ")).toContain("Every version 2.0 component requires a stable ID");
        const duplicate=validateSchema({version:"2.0",components:[{type:"card",id:"card",children:[{type:"text",id:"same",text:"A"}],footer:[{type:"popover",id:"same",trigger:{label:"More"},children:[{type:"text",id:"inside",text:"B"}]}]}]});
        expect(duplicate.diagnostics).toContainEqual(expect.objectContaining({code:"DUPLICATE_COMPONENT_ID",path:"/components/0/footer/0/id"}));
    });
    it("reports precise strict property paths",()=>{
        const result=validateSchema({version:"2.0",components:[{type:"comboChart",id:"combo",category:"Category",series:[{field:"A",chartType:"line"}],legacyOption:true}]});
        expect(result.diagnostics).toContainEqual(expect.objectContaining({code:"UNKNOWN_PROPERTY",path:"/components/0/legacyOption"}));
    });
});
