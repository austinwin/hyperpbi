import { h, render } from "preact";
import { act } from "preact/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const searchRuntime = vi.hoisted(() => ({
    search: vi.fn(),
    allowed: true,
    reason: undefined as string | undefined,
}));

vi.mock("../src/providers/geocoderProviderRegistry", () => ({
    getGeocoderProvider: () => ({
        id: "nominatim",
        label: "Nominatim (OpenStreetMap)",
        external: true,
        defaults: {},
        geocode: vi.fn(),
        search: searchRuntime.search,
    }),
}));
vi.mock("../src/providers/providerPolicy", () => ({
    resolveProviderPolicy: () => ({
        externalAvailable: searchRuntime.allowed,
        certificationSafe: false,
        tilesAllowed: false,
        geocoderAllowed: searchRuntime.allowed,
        geocoderReason: searchRuntime.reason,
        warnings: [],
    }),
}));

import { MapSearchPanel } from "../src/components/maps/MapSearchPanel";
import { RenderContext, type RenderContextValue } from "../src/render/RenderContext";

function mount() {
    const onResult = vi.fn();
    const onClearResult = vi.fn();
    const value = {
        config: {
            version: "1.0",
            providers: {
                mode: "maps",
                privacyAcknowledged: true,
                geocoder: { provider: "nominatim", enabled: true, endpoint: "https://nominatim.openstreetmap.org/search", autocomplete: false, userTriggeredOnly: true, resultLimit: 3 },
            },
        },
        webAccessAvailable: true,
    } as unknown as RenderContextValue;
    const host = document.createElement("div");
    act(() => render(h(RenderContext.Provider, { value }, h(MapSearchPanel, { mapId: "map", onResult, onClearResult })), host));
    return { host, onResult, onClearResult };
}

function type(host: HTMLElement, value: string) {
    const input = host.querySelector<HTMLInputElement>('input[type="search"]')!;
    act(() => { input.value = value; input.dispatchEvent(new Event("input", { bubbles: true })); });
}

async function submit(host: HTMLElement) {
    await act(async () => { host.querySelector("form")!.dispatchEvent(new Event("submit", { bubbles: true, cancelable: true })); });
}

beforeEach(() => {
    searchRuntime.allowed = true;
    searchRuntime.reason = undefined;
    searchRuntime.search.mockReset();
});
afterEach(() => document.body.replaceChildren());

describe("MapSearchPanel", () => {
    it("does not request on render or while typing and requests only on submit", async () => {
        searchRuntime.search.mockResolvedValue([{ latitude: 29.76, longitude: -95.37, label: "Houston, Texas", provider: "nominatim" }]);
        const { host, onResult } = mount();
        expect(searchRuntime.search).not.toHaveBeenCalled();
        type(host, "Houston");
        expect(searchRuntime.search).not.toHaveBeenCalled();
        await submit(host);
        expect(searchRuntime.search).toHaveBeenCalledTimes(1);
        expect(host.textContent).toContain("Houston, Texas");
        act(() => host.querySelector<HTMLButtonElement>(".hp-map-search-results button")!.click());
        expect(onResult).toHaveBeenCalledWith(expect.objectContaining({ latitude: 29.76, longitude: -95.37 }));
    });

    it("validates query length without issuing a request", async () => {
        const { host } = mount();
        type(host, "ab");
        await submit(host);
        expect(searchRuntime.search).not.toHaveBeenCalled();
        expect(host.textContent).toContain("at least 3 characters");
    });

    it("blocks a duplicate in-flight query but aborts it for a new query", async () => {
        const signals: AbortSignal[] = [];
        searchRuntime.search.mockImplementation((query: string, _config: unknown, signal: AbortSignal) => {
            signals.push(signal);
            if (query === "Dallas") return Promise.resolve([{ latitude: 32.78, longitude: -96.8, provider: "nominatim" }]);
            return new Promise(() => undefined);
        });
        const { host } = mount();
        type(host, "Houston");
        void submit(host);
        await Promise.resolve();
        await submit(host);
        expect(searchRuntime.search).toHaveBeenCalledTimes(1);
        type(host, "Dallas");
        await submit(host);
        expect(signals[0].aborted).toBe(true);
        expect(searchRuntime.search).toHaveBeenCalledTimes(2);
    });

    it("invalidates an older result when a later submit fails validation", async () => {
        let resolveSearch!: (value: Array<{ latitude: number; longitude: number; provider: string }>) => void;
        searchRuntime.search.mockImplementation(() => new Promise(resolve => { resolveSearch = resolve; }));
        const { host, onResult } = mount();
        type(host, "Houston");
        void submit(host);
        await Promise.resolve();
        type(host, "ab");
        await submit(host);
        resolveSearch([{ latitude: 29.76, longitude: -95.37, provider: "nominatim" }]);
        await Promise.resolve();
        expect(host.textContent).toContain("at least 3 characters");
        expect(onResult).not.toHaveBeenCalled();
    });

    it("aborts an outstanding request on unmount", async () => {
        let signal: AbortSignal | undefined;
        searchRuntime.search.mockImplementation((_query: string, _config: unknown, current: AbortSignal) => { signal = current; return new Promise(() => undefined); });
        const { host } = mount();
        type(host, "Houston");
        void submit(host);
        await Promise.resolve();
        act(() => render(null, host));
        expect(signal?.aborted).toBe(true);
    });

    it("shows the policy reason and never calls a provider when unavailable", async () => {
        searchRuntime.allowed = false;
        searchRuntime.reason = "Core package does not include external providers.";
        const { host } = mount();
        expect(host.textContent).toContain(searchRuntime.reason);
        expect(host.querySelector("input")?.hasAttribute("disabled")).toBe(true);
        await submit(host);
        expect(searchRuntime.search).not.toHaveBeenCalled();
    });

    it("does not expose provider endpoints or tokens in errors", async () => {
        searchRuntime.search.mockRejectedValue(new Error("request failed for https://secret.example/geocode?token=top-secret"));
        const { host } = mount();
        type(host, "Houston");
        await submit(host);
        expect(host.textContent).toContain("Location search failed");
        expect(host.textContent).not.toContain("secret.example");
        expect(host.textContent).not.toContain("top-secret");
    });
});
