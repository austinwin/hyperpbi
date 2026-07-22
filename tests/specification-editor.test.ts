import{describe,expect,it}from"vitest";import{appendToContainer,componentTree,deleteComponent,duplicateComponent,incomingComponentReferences,insertComponent,moveComponent,moveComponentTo,SpecificationHistory}from"../src/editor/inspector/specificationEditor";const spec=()=>({version:"2.0",toolbar:[{type:"toolbar",id:"tools",children:[{type:"text",id:"tool_child"}]}],components:[{type:"tabs",id:"tabs",tabs:[{id:"a",title:"A",children:[{type:"section",id:"nested",children:[{type:"text",id:"leaf"}]}]}]},{type:"accordion",id:"acc",items:[{id:"i",title:"I",children:[{type:"text",id:"acc_child"}]}]},{type:"text",id:"target",uiAction:{type:"openOverlay",target:"nested"}}]});describe("specification editor operations",()=>{it("uses complete canonical JSON pointers",()=>{expect(componentTree(spec()).map(item=>item.path)).toEqual(expect.arrayContaining(["/toolbar/0","/toolbar/0/children/0","/components/0/tabs/0/children/0","/components/0/tabs/0/children/0/children/0","/components/1/items/0/children/0"]));});it("inserts, appends and moves while preserving IDs",()=>{const before=insertComponent(spec(),"target","before",{type:"text",id:"before"})as any;expect(before.components.map((item:any)=>item.id)).toEqual(["tabs","acc","before","target"]);const appended=appendToContainer(spec(),"/components/1/items/0/children",{type:"text",id:"new"})as any;expect(appended.components[1].items[0].children.map((item:any)=>item.id)).toEqual(["acc_child","new"]);const moved=moveComponentTo(spec(),"target","/toolbar/0/children")as any;expect(moved.toolbar[0].children.map((item:any)=>item.id)).toContain("target");expect(moveComponent(spec(),"acc",-1)).toBeTruthy();});it("recursively rekeys duplicates and reports deletion references",()=>{const duplicate=duplicateComponent(spec(),"tabs") as any;const ids=componentTree(duplicate).map(item=>item.id);expect(new Set(ids).size).toBe(ids.length);expect(ids).toEqual(expect.arrayContaining(["tabs-copy","nested-copy","leaf-copy"]));expect(incomingComponentReferences(spec(),"nested")).toContain("/components/2/uiAction/target");expect(componentTree(deleteComponent(spec(),"nested")).map(item=>item.id)).not.toContain("nested");});it("bounds and resets transactional history",()=>{const history=new SpecificationHistory("a",3);history.commit("b");history.commit("c");expect(history.undo()).toBe("b");expect(history.redo()).toBe("c");history.reset("external");expect(history.canUndo).toBe(false);expect(history.value).toBe("external");});});

describe("canonical editor container coverage", () => {
    it("traverses every declared root and nested container with exact pointers", () => {
        const dashboard = {
            version: "2.0",
            toolbar: [{ type: "toolbar", id: "toolbar", children: [{ type: "text", id: "toolbar-child" }] }],
            leftPanel: [{ type: "text", id: "left" }],
            rightPanel: [{ type: "text", id: "right" }],
            components: [
                { type: "card", id: "card", children: [{ type: "text", id: "card-child" }], footer: [{ type: "text", id: "card-footer" }] },
                { type: "tabs", id: "all-tabs", tabs: [
                    { id: "children", title: "Children", children: [{ type: "text", id: "tab-children" }] },
                ] },
                { type: "accordion", id: "accordion", items: [{ id: "item", title: "Item", children: [{ type: "text", id: "accordion-child" }] }] },
                { type: "smallMultiples", id: "multiples", splitField: "region", chart: { type: "barChart", id: "nested-chart", category: "region", measure: "amount" } },
            ],
        };
        expect(componentTree(dashboard).map(item => item.path)).toEqual(expect.arrayContaining([
            "/toolbar/0/children/0", "/leftPanel/0", "/rightPanel/0", "/components/0/footer/0",
            "/components/1/tabs/0/children/0",
            "/components/2/items/0/children/0", "/components/3/chart",
        ]));
    });

    it("creates missing declared roots while rejecting undeclared destinations", () => {
        const moved = moveComponentTo(spec(), "target", "/rightPanel") as { rightPanel: Array<{ id: string }> };
        expect(moved.rightPanel.map(item => item.id)).toEqual(["target"]);
        const invalidMove = moveComponentTo(spec(), "target", "/components/0/not-a-container");
        expect(invalidMove).toEqual(spec());
        const invalidAppend = appendToContainer(spec(), "/components/0/not-a-container", { type: "text", id: "bad" });
        expect(invalidAppend).toEqual(spec());
    });
});
