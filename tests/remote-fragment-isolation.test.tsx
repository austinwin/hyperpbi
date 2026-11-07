import "../src/render/HyperPbiRoot";
import { h, render } from "preact";
import { act } from "preact/test-utils";
import { afterEach, expect, it, vi } from "vitest";
import { RemoteFragmentHost } from "../src/fragments/RemoteFragmentHost";
import { RenderContext, type RenderContextValue } from "../src/render/RenderContext";
import { defaultRuntimeSettings } from "../src/runtime/runtimeSettings";
import { clearRemoteFragmentCache } from "../src/fragments/remoteFragmentRequest";

afterEach(() => { clearRemoteFragmentCache(); vi.unstubAllGlobals(); });
it("renders the canonical tree with independent local state and no parent data/actions", async () => {
    const payload = { kind: "hyperpbi.fragment", version: "1.0", datasets: { values: [{ pressure: 63 }] }, components: [
        { type: "kpi", id: "pressure", field: "pressure", title: "Pressure", aggregation: "first" },
        { type: "text", id: "state", text: "Local state: {{state.note}}" },
        { type: "button", id: "change", title: "Change local state", uiAction: { type: "setState", target: "note", value: "local-only" } },
    ] };
    vi.stubGlobal("fetch", vi.fn().mockImplementation(() => Promise.resolve(new Response(JSON.stringify(payload)))));
    const dispatch = vi.fn(), external = vi.fn();
    const parent = { settings: defaultRuntimeSettings, remoteSourceHost: "web", webAccessAvailable: true, rows: [{ pressure: 9999 }], state: { values: { note: "parent-secret" } }, dispatch, selectExternal: external, executeUiAction: external } as unknown as RenderContextValue;
    const host = document.createElement("div");
    act(() => render(h(RenderContext.Provider, { value: parent }, h(RemoteFragmentHost, { request: { endpoint: "https://demo.miniup.app/fragment" } })), host));
    for (let attempt = 0; attempt < 100 && !host.textContent?.includes("Change local state"); attempt++) await act(async () => { await new Promise(resolve => setTimeout(resolve, 10)); });
    expect(host.textContent).toContain("63");
    expect(host.textContent).not.toContain("9999");
    expect(host.textContent).not.toContain("parent-secret");
    expect(host.querySelector('[data-hp-id$="-pressure"]')).not.toBeNull();
    const button = Array.from(host.querySelectorAll("button")).find(node => node.textContent === "Change local state")!;
    act(() => button.click());
    expect(host.textContent).toContain("local-only");
    expect(dispatch).not.toHaveBeenCalled();
    expect(external).not.toHaveBeenCalled();
    act(() => render(null, host));
    expect(host.childElementCount).toBe(0);
});
