import { h, render } from "preact";
import { act } from "preact/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
vi.mock("../src/providers/providerBuild", () => ({ EXTERNAL_PROVIDERS_AVAILABLE: true }));
import { MapSearchPanel } from "../src/components/maps/MapSearchPanel";
import { RenderContext, type RenderContextValue } from "../src/render/RenderContext";

afterEach(() => { vi.restoreAllMocks(); document.body.replaceChildren(); });

describe("MapSearchPanel real provider integration", () => {
    it("uses the real provider registry, auto-applies one result, and reports no results", async () => {
        const fetchMock = vi.fn()
            .mockResolvedValueOnce(new Response(JSON.stringify({ candidates: [{ address: "Houston", score: 99, location: { x: -95.37, y: 29.76 } }] }), { status: 200, headers: { "Content-Type": "application/json" } }))
            .mockResolvedValueOnce(new Response(JSON.stringify({ candidates: [] }), { status: 200, headers: { "Content-Type": "application/json" } }));
        vi.stubGlobal("fetch", fetchMock);
        const onResult = vi.fn();
        const value = {
            config: { version: "1.0", providers: { mode: "maps", privacyAcknowledged: true, geocoder: { provider: "arcgis", enabled: true, endpoint: "https://geocode.example/GeocodeServer", autocomplete: false, userTriggeredOnly: true, resultLimit: 3 } } },
            webAccessAvailable: false,
            providerAccess: { tiles: { allowed: false }, geocoder: { allowed: true } },
        } as unknown as RenderContextValue;
        const host = document.createElement("div");
        act(() => render(h(RenderContext.Provider, { value }, h(MapSearchPanel, { mapId: "map", onResult, onClearResult: vi.fn() })), host));
        const input = host.querySelector<HTMLInputElement>("input")!;
        input.value = "Houston";
        act(() => input.dispatchEvent(new Event("input", { bubbles: true })));
        await act(async () => host.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
        await vi.waitFor(() => expect(onResult).toHaveBeenCalledWith(expect.objectContaining({ label: "Houston", latitude: 29.76, longitude: -95.37 })));
        expect(host.querySelector('[aria-current="true"]')).not.toBeNull();
        input.value = "Nowhere";
        act(() => input.dispatchEvent(new Event("input", { bubbles: true })));
        await act(async () => host.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })));
        await vi.waitFor(() => expect(host.textContent).toContain("No locations matched your search"));
        expect(fetchMock).toHaveBeenCalledTimes(2);
    });
});
