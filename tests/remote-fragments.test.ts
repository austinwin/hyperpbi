import { afterEach, describe, expect, it, vi } from "vitest";
import { prepareRemoteFragment, fragmentComponentTypes } from "../src/fragments/prepareRemoteFragment";
import { assertFragmentAccess, clearRemoteFragmentCache, fetchRemoteFragment } from "../src/fragments/remoteFragmentRequest";
import { matchesHttpsHost, MINIUP_HOSTS } from "../src/security/networkHostPolicy";
import { validateV2Schema } from "../src/schema/validateV2Schema";
import { evaluateDatasets } from "../src/data/datasets";
import { fragmentEndpoint } from "../src/fragments/fragmentBindings";
import { configuredMapEndpoints } from "../src/providers/configuredMapEndpoints";
import demo from "../examples/dashboards/dynamic-content-api.mjs";

const sample = await (await demo.fetch(new Request("https://functions.miniup.app/hyperpbi-dynamic-demo/sensor?id=1024"))).json();

const clone = <T,>(value: T): T => JSON.parse(JSON.stringify(value)) as T;
const request = { endpoint: "https://demo.miniup.io/api/sensor", cacheTtlSeconds: 1 };
const url = new URL(request.endpoint);
afterEach(() => { clearRemoteFragmentCache(); vi.unstubAllGlobals(); vi.useRealTimers(); });

describe("remote fragment canonical preparation", () => {
    it("prepares real components with independent datasets and namespaced IDs", () => {
        const result = prepareRemoteFragment(sample, "popupA");
        expect(result.schema.components[0].id).toBe("popupA-current_pressure");
        expect(result.workspace.sources.pressure.data.rows).toHaveLength(24);
        expect(result.workspace.sources.current.data.rows).toHaveLength(1);
        expect(result.schema.data?.sources).toBeUndefined();
        const evaluated = evaluateDatasets(result.data, {}, undefined, {}, Object.fromEntries(Object.entries(result.workspace.sources).map(([id, source]) => [id, source.data])));
        expect(evaluated.datasets.get("pressure")?.sourceId).toBe("pressure");
        expect(prepareRemoteFragment(sample, "popupB").schema.components[0].id).toBe("popupB-current_pressure");
        expect(sample.components[0].id).toBe("current_pressure");
    });

    it("rejects noncanonical IDs and unapproved asset URLs hidden in datasets", () => {
        expect(() => prepareRemoteFragment({ ...sample, components: [{ type: "text", id: "", text: "Invalid" }] }, "local")).toThrow("canonical IDs");
        expect(() => prepareRemoteFragment({ ...sample, datasets: { data: [{ image: "https://evil.test/pixel.png" }] } }, "local")).toThrow("asset URL");
    });

    it("supports nested tabs through the canonical validator", () => {
        const result = prepareRemoteFragment({ kind: "hyperpbi.fragment", version: "1.0", datasets: { rows: [{ amount: 4 }] }, components: [{ type: "tabs", id: "tabs", tabs: [{ id: "first", title: "First", children: [{ type: "kpi", id: "amount", field: "amount" }] }] }] }, "local");
        expect(validateV2Schema(result.schema).valid).toBe(true);
    });

    it.each(["dynamicContent", "map", "modal", "offcanvas", "html", "custom", "mermaidDiagram"])("rejects restricted %s components at any layout depth", type => {
        const value = { ...clone(sample), components: [{ type: "card", id: "card", children: [{ type, id: "unsafe" }] }] };
        expect(() => prepareRemoteFragment(value, "local")).toThrow("restricted");
        expect(fragmentComponentTypes).not.toContain(type);
    });

    it("rejects network grants, external actions, invalid fields and oversized trees", () => {
        expect(() => prepareRemoteFragment({ ...sample, data: { sources: {} } }, "local")).toThrow("root properties");
        expect(() => prepareRemoteFragment({ ...sample, components: [{ type: "button", id: "open", uiAction: { type: "openOverlay", target: "parent" } }] }, "local")).toThrow("local state");
        expect(() => prepareRemoteFragment({ ...sample, components: [{ type: "kpi", id: "bad", field: "missing" }] }, "local")).toThrow("Invalid fragment");
        expect(() => prepareRemoteFragment({ ...sample, components: Array.from({ length: 101 }, (_, index) => ({ type: "text", id: `text${index}`, text: "Safe" })) }, "local")).toThrow("100-component");
        expect(() => prepareRemoteFragment({ ...sample, datasets: { rows: Array.from({ length: 5001 }, () => ({ x: 1 })) } }, "local")).toThrow("5000-row");
        expect(() => prepareRemoteFragment({ ...sample, components: [{ type: "kpi", id: "k", field: "psi", interaction: { externalMode: "filter" } }] }, "local")).toThrow("Power BI");
        expect(() => prepareRemoteFragment({ ...sample, components: [{ type: "barChart", id: "chart", options: { tooltip: { appendToBody: true } } }] }, "local")).toThrow("inside the chart");
    });
});

describe("endpoint bindings and host permissions", () => {
    it("validates trigger references, canonical popup requests, and Power BI origin discovery", () => {
        const source = { type: "button", id: "refresh", title: "Refresh" };
        const region = { type: "dynamicContent", id: "work", trigger: { source: "refresh", event: "click", refresh: true }, request: { endpoint: "https://functions.miniup.app/hyperpbi-dynamic-demo/backlog?priority={{state.priority}}" } };
        const specification = { version: "2.0", components: [source, region] };
        expect(validateV2Schema(specification).valid).toBe(true);
        expect(configuredMapEndpoints(JSON.stringify(specification))).toEqual([region.request.endpoint]);
        expect(validateV2Schema({ ...specification, components: [region] }).diagnostics).toContainEqual(expect.objectContaining({ path: "/components/0/trigger/source", code: "UNKNOWN_COMPONENT_TARGET" }));
        expect(validateV2Schema({ ...specification, components: [{ ...region, trigger: undefined, request: { endpoint: "https://demo.miniup.app/asset?id={{context.asset_id}}", headers: {} } }] }).valid).toBe(false);
    });
    it("encodes event context and control state without changing origin", () => {
        const context = { site_id: "A&B/ C", station_id: 4 };
        const result = fragmentEndpoint("https://demo.miniup.io/api/{{context.site_id}}?station={{context.station_id}}&priority={{state.priority}}", context, { priority: "high & urgent" });
        expect(result.origin).toBe("https://demo.miniup.io");
        expect(result.pathname).toBe("/api/A%26B%2F%20C");
        expect(result.searchParams.get("station")).toBe("4");
        expect(result.searchParams.get("priority")).toBe("high & urgent");
        expect(() => fragmentEndpoint("https://{{context.site_id}}/api", context)).toThrow("literal HTTPS");
        expect(() => fragmentEndpoint("https://demo.miniup.io/api/{{context.missing}}", context)).toThrow("Missing dynamic value");
        expect(() => fragmentEndpoint("https://demo.miniup.io/api/{{context.constructor}}", context)).toThrow("Missing dynamic value");
        expect(() => fragmentEndpoint("https://demo.miniup.io/?{{context.site_id}}=query", context)).toThrow("parameter values");
        expect(() => fragmentEndpoint("https://demo.miniup.io/api/{{context.site_id}}", { site_id: ".." })).toThrow("Dot path");
        expect(() => fragmentEndpoint("https://user:pass@demo.miniup.io/api")).toThrow("credential-free");
    });

    it.each(["miniup.app", "a.miniup.app", "a.b.miniup.app", "miniup.io", "demo.miniup.io"])("allows the MiniUp host %s in both host modes", host => {
        const endpoint = new URL(`https://${host}/api/test`);
        expect(matchesHttpsHost(endpoint.href, MINIUP_HOSTS)).toBe(true);
        expect(() => assertFragmentAccess(endpoint, "web")).not.toThrow();
        expect(() => assertFragmentAccess(endpoint, "powerbi", { tiles: { allowed: false }, geocoder: { allowed: false }, services: { [endpoint.origin]: { allowed: true } } })).not.toThrow();
        expect(() => assertFragmentAccess(endpoint, "powerbi")).toThrow("WebAccess");
    });

    it("rejects lookalikes, ports and universal wildcard permissions", () => {
        for (const endpoint of ["https://miniup.io.evil.test/x", "https://evilminiup.app/x", "https://demo.miniup.app:8443/x"]) expect(matchesHttpsHost(endpoint, MINIUP_HOSTS)).toBe(false);
        expect(matchesHttpsHost("https://example.test", ["https://*"])).toBe(false);
        expect(() => assertFragmentAccess(new URL("https://example.test/data"), "web")).toThrow("not approved");
    });
});

describe("bounded fragment requests", () => {
    it("fetches credential-free GET, caches by resolved URL, expires and refreshes", async () => {
        vi.useFakeTimers();
        const fetcher = vi.fn().mockImplementation(() => Promise.resolve(new Response(JSON.stringify(sample))));
        vi.stubGlobal("fetch", fetcher);
        await fetchRemoteFragment(url, request, new AbortController().signal);
        await fetchRemoteFragment(url, request, new AbortController().signal);
        expect(fetcher).toHaveBeenCalledTimes(1);
        expect(fetcher.mock.calls[0][1]).toMatchObject({ method: "GET", credentials: "omit", redirect: "error" });
        vi.advanceTimersByTime(1001);
        await fetchRemoteFragment(url, request, new AbortController().signal);
        await fetchRemoteFragment(url, request, new AbortController().signal, true);
        expect(fetcher).toHaveBeenCalledTimes(3);
    });

    it("honors a shorter TTL requested by a later consumer", async () => {
        vi.useFakeTimers();
        const fetcher = vi.fn().mockImplementation(() => Promise.resolve(new Response(JSON.stringify(sample))));
        vi.stubGlobal("fetch", fetcher);
        await fetchRemoteFragment(url, { ...request, cacheTtlSeconds: 60 }, new AbortController().signal);
        vi.advanceTimersByTime(1500);
        await fetchRemoteFragment(url, { ...request, cacheTtlSeconds: 1 }, new AbortController().signal);
        expect(fetcher).toHaveBeenCalledTimes(2);
    });

    it("explains CORS and WebAccess failures and rejects invalid or oversized JSON", async () => {
        vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("Failed to fetch")));
        await expect(fetchRemoteFragment(url, request, new AbortController().signal)).rejects.toThrow("CORS, or Power BI WebAccess");
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("<html>")));
        await expect(fetchRemoteFragment(url, request, new AbortController().signal)).rejects.toThrow("invalid JSON");
        vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("{}", { headers: { "content-length": "1048577" } })));
        await expect(fetchRemoteFragment(url, request, new AbortController().signal)).rejects.toThrow("size limit");
    });

    it("cancels pending requests without caching their responses", async () => {
        const controller = new AbortController();
        vi.stubGlobal("fetch", vi.fn().mockImplementation((_url, init: RequestInit) => new Promise((_resolve, reject) => init.signal?.addEventListener("abort", () => reject(init.signal?.reason)))));
        const promise = fetchRemoteFragment(url, request, controller.signal);
        controller.abort();
        await expect(promise).rejects.toHaveProperty("name", "AbortError");
    });

    it("enforces a bounded timeout", async () => {
        vi.useFakeTimers();
        vi.stubGlobal("fetch", vi.fn().mockImplementation((_url, init: RequestInit) => new Promise((_resolve, reject) => init.signal?.addEventListener("abort", () => reject(init.signal?.reason)))));
        const promise = fetchRemoteFragment(url, { ...request, timeoutMs: 1000 }, new AbortController().signal);
        const assertion = expect(promise).rejects.toThrow("timed out");
        await vi.advanceTimersByTimeAsync(1001);
        await assertion;
    });
});
