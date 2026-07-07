import { h, render } from "preact";
import { act } from "preact/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { calculateAggregates } from "../src/data/aggregations";
import { normalizeMapBindings } from "../src/data/normalizeMapBindings";
import { DataRow, NormalizedData } from "../src/data/normalizeData";
import { CustomComponent, prepareCustomRepeatRows } from "../src/components/custom/CustomComponent";
import { ControlBlock } from "../src/components/controls/Controls";
import { resolveSelection, runSafeInteraction } from "../src/components/custom/customInteractionResolver";
import { SimpleVirtualTable } from "../src/components/tables/TableBlock";
import { InteractionsPanel } from "../src/editor/InteractionsPanel";
import { defaultConfig } from "../src/config/hyperpbiConfig";
import { RenderContext, RenderContextValue } from "../src/render/RenderContext";
import { initialDashboardState } from "../src/render/stateStore";
import { ContentComponent, HyperPbiSchema, TableComponent } from "../src/schema/hyperpbiSchema";
import { validateReferences } from "../src/schema/validateReferences";
import { toRuntimeSettings, VisualFormattingSettingsModel } from "../src/settings";

const rows: DataRow[] = [{ leadby: "Pranav", status: "Open" }, { leadby: "Alex", status: "Open" }, { leadby: "Pranav", status: "Closed" }];
const fields: NormalizedData["fields"] = {
    leadby: { key: "leadby", displayName: "LeadBy", type: "dimension", roles: ["values"] },
    status: { key: "status", displayName: "Status", type: "dimension", roles: ["values"] }
};
const data: NormalizedData = { rows, fields, aggregates: calculateAggregates(rows), map: normalizeMapBindings(rows, fields) };

function context() {
    const selectExternal = vi.fn(() => ({ sent: true as const })); const clearExternal = vi.fn(() => ({ sent: true as const })); const reportInteraction = vi.fn();
    const value: RenderContextValue = { data, rows, sourceRows: rows, schema: { version: "1.0", components: [] }, settings: toRuntimeSettings(new VisualFormattingSettingsModel()), state: initialDashboardState(), dispatch: action => {
        if (action.type === "selectRows") value.state.selectedRows = action.rows;
        if (action.type === "selectComponentRows") value.state.componentSelectedRows[action.id] = action.rows;
    }, warnings: [], selectExternal, clearExternal, reportInteraction, config: defaultConfig, webAccessAvailable: false };
    return { value, selectExternal, clearExternal, reportInteraction };
}

afterEach(() => { document.body.replaceChildren(); });

describe("safe row-level interactions", () => {
    it("prepares distinct, sorted repeat rows with source indices", () => {
        const prepared = prepareCustomRepeatRows(rows, rows, { source: "rows", template: "", distinctBy: "leadby", sortBy: "leadby", sortDirection: "asc", limit: 200 });
        expect(prepared.map(item => [item.row.leadby, item.sourceIndex])).toEqual([["Alex", 1], ["Pranav", 0]]);
    });
    it("renders individual sanitized clickable rows and resolves valueFromRow", () => {
        const test = context(); const host = document.createElement("div"); document.body.append(host);
        const component: ContentComponent = { type: "custom", id: "leadby_toggle_filter", repeat: { source: "rows", distinctBy: "leadby", sortBy: "leadby", sortDirection: "asc", limit: 200, template: "<div onclick='bad()'>{{row.leadby}}</div>" }, interactions: { onClick: { action: "selectWhere", selectionMode: "replace", external: true, internal: false, where: { op: "=", left: { field: "leadby" }, right: { valueFromRow: "leadby" } } } } };
        render(h(RenderContext.Provider, { value: test.value }, h(CustomComponent, { component })), host);
        const repeatRows = host.querySelectorAll<HTMLElement>(".hp-custom-repeat-row");
        expect(repeatRows).toHaveLength(2); expect(repeatRows[0].textContent).toContain("Alex"); expect(host.innerHTML).not.toContain("onclick");
        repeatRows[1].dispatchEvent(new MouseEvent("click", { bubbles: true }));
        expect(test.selectExternal).toHaveBeenCalledWith([0, 2], false, expect.objectContaining({ componentId: "leadby_toggle_filter", field: "leadby", value: "Pranav" }));
        expect(test.value.state.selectedRows).toEqual([]); expect(test.value.state.componentSelectedRows.leadby_toggle_filter).toEqual([0, 2]);
        render(h(RenderContext.Provider, { value: test.value }, h(CustomComponent, { component })), host);
        const pranav = Array.from(host.querySelectorAll(".hp-custom-repeat-row")).find(element => element.textContent?.includes("Pranav"));
        expect(pranav?.classList.contains("is-selected")).toBe(true); expect(pranav?.classList.contains("hp-row-selected")).toBe(true);
    });
    it("supports replace, add, toggle, modifier behavior, and external:false", () => {
        expect(resolveSelection([0], [1], "replace")).toEqual([1]); expect(resolveSelection([0], [1], "add")).toEqual([0, 1]); expect(resolveSelection([0, 1], [1], "toggle")).toEqual([0]); expect(resolveSelection([0], [1], "replace", true)).toEqual([0, 1]);
        const test = context(); runSafeInteraction({ action: "selectWhere", external: false, internal: true, where: { op: "=", left: { field: "status" }, right: { value: "Open" } } }, test.value, undefined, undefined, { componentId: "status" });
        expect(test.value.state.selectedRows).toEqual([0, 1]); expect(test.selectExternal).not.toHaveBeenCalled();
    });
    it("passes multiSelect for toggle custom external interactions",()=>{const test=context();runSafeInteraction({action:"selectWhere",selectionMode:"toggle",external:true,internal:false,where:{op:"=",left:{field:"status"},right:{value:"Open"}}},test.value,undefined,undefined,{componentId:"status_toggle",multiSelect:true});expect(test.selectExternal).toHaveBeenCalledWith([0,1],true,expect.objectContaining({componentId:"status_toggle",field:"status"}));});
    it("returns no matches for unknown clicked-row fields", () => {
        const test = context(); const result = runSafeInteraction({ action: "selectWhere", where: { op: "=", left: { field: "leadby" }, right: { valueFromRow: "unknown" } } }, test.value, rows[0], 0, { componentId: "invalid" });
        expect(result.matchedRows).toEqual([]); expect(test.selectExternal).toHaveBeenCalledWith([], false, expect.any(Object));
    });
});

describe("external control interactions",()=>{
    const settle=()=>new Promise<void>(resolve=>setTimeout(resolve,25));
    it("sends select and segmented matches without requiring internal filtering",async()=>{for(const type of ["select","segmentedControl"] as const){const test=context();const host=document.createElement("div");act(()=>render(h(RenderContext.Provider,{value:test.value},h(ControlBlock,{component:{type,id:type,field:"status",internal:false,external:true}})),host));await act(settle);test.selectExternal.mockClear();await act(async()=>{if(type==="select"){const select=host.querySelector("select") as HTMLSelectElement;select.value="Open";select.dispatchEvent(new Event("change",{bubbles:true}));}else{Array.from(host.querySelectorAll("button")).find(button=>button.textContent==="Open")?.dispatchEvent(new MouseEvent("click",{bubbles:true}));}await settle();});expect(test.selectExternal).toHaveBeenCalledWith([0,1],false,expect.objectContaining({componentId:type,componentType:type,field:"status",value:"Open"}));render(null,host);}});
    it("sends multiSelect matches with the Power BI multi-select flag",async()=>{const test=context();const host=document.createElement("div");act(()=>render(h(RenderContext.Provider,{value:test.value},h(ControlBlock,{component:{type:"multiSelect",id:"statuses",field:"status",internal:false,external:true}})),host));await act(settle);test.selectExternal.mockClear();await act(async()=>{const select=host.querySelector("select") as HTMLSelectElement;Array.from(select.options).forEach(option=>option.selected=option.value==="Open"||option.value==="Closed");select.dispatchEvent(new Event("change",{bubbles:true}));await settle();});expect(test.selectExternal).toHaveBeenCalledWith([0,1,2],true,expect.objectContaining({componentId:"statuses",field:"status"}));render(null,host);});
    it("clears external selection when an external text input is cleared",async()=>{const test=context();const host=document.createElement("div");act(()=>render(h(RenderContext.Provider,{value:test.value},h(ControlBlock,{component:{type:"textInput",id:"status_search",field:"status",internal:false,external:true}})),host));await act(settle);const input=host.querySelector("input") as HTMLInputElement;await act(async()=>{input.value="Open";input.dispatchEvent(new Event("input",{bubbles:true}));await settle();});expect(test.selectExternal).toHaveBeenLastCalledWith([0,1],false,expect.objectContaining({value:"Open"}));test.clearExternal.mockClear();await act(async()=>{input.value="";input.dispatchEvent(new Event("input",{bubbles:true}));await settle();});expect(test.clearExternal).toHaveBeenCalledWith(expect.objectContaining({componentId:"status_search"}));render(null,host);});
});

describe("built-in table and diagnostics", () => {
    it("sends a table row's source index and keeps highlight rows visible", () => {
        const test = context(); const host = document.createElement("div"); const component: TableComponent = { type: "table", id: "details", selectable: true, selectionMode: "highlight", columns: ["leadby"], search: false, pagination: false };
        render(h(RenderContext.Provider, { value: test.value }, h(SimpleVirtualTable, { component })), host);
        host.querySelector("tbody tr")?.dispatchEvent(new MouseEvent("click", { bubbles: true }));
        expect(test.selectExternal).toHaveBeenCalledWith([0], false, expect.objectContaining({ componentId: "details", componentType: "table" })); expect(host.querySelectorAll("tbody tr")).toHaveLength(3);
    });
    it("shows complete interaction diagnostics and report configuration guidance", () => {
        const host = document.createElement("div"); render(h(InteractionsPanel, { diagnostics: { externalInteractionEnabled: true, hostAllowsInteractions: false, selectionIdentityCount: 3, lastClickedComponentId: "details", lastClickedComponentType: "table", lastClickedField: "leadby", lastClickedValue: "Pranav", lastResolvedSourceRowCount: 2, lastSelectedSourceRowIndices: [0, 2], externalSelectionSent: false, reasonExternalSelectionNotSent: "host disallowed" } }), host);
        expect(host.textContent).toContain("hostAllowsInteractionsNo"); expect(host.textContent).toContain("The host did not allow interactions."); expect(host.textContent).toContain("Edit interactions"); expect(host.textContent).toContain("compatible model lineage");
    });
    it("warns about ignored interaction-looking properties without blocking schema rendering", () => {
        const schema = { version: "1.0" as const, components: [{ type: "custom", id: "fake", html: "Safe", externalSelection: true, selectionTarget: "report", crossFilter: true, powerBISelection: true }] };
        const warnings = validateReferences(schema as unknown as HyperPbiSchema, data);
        expect(warnings).toHaveLength(4); expect(warnings.join(" ")).toContain("not used");
    });
});
