import { afterEach, describe, expect, it, vi } from "vitest";
import {
    ArcGisHttpError,
    getArcGisJson,
} from "../src/maps/arcgis/arcGisRestClient";

afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
});

describe("ArcGIS REST request lifecycle", () => {
    it("does not retry permanent HTTP failures", async () => {
        const fetchMock = vi.fn(async () => new Response("bad request", { status: 400 }));
        vi.stubGlobal("fetch", fetchMock);
        await expect(getArcGisJson("https://example.test/layer", { retries: 3 }))
            .rejects.toBeInstanceOf(ArcGisHttpError);
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it("honors Retry-After for transient responses and removes every abort listener", async () => {
        vi.useFakeTimers();
        const fetchMock = vi.fn()
            .mockResolvedValueOnce(new Response("busy", { status: 503, headers: { "Retry-After": "0" } }))
            .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }));
        vi.stubGlobal("fetch", fetchMock);
        const controller = new AbortController();
        const add = vi.spyOn(controller.signal, "addEventListener");
        const remove = vi.spyOn(controller.signal, "removeEventListener");

        const request = getArcGisJson<{ ok: boolean }>("https://example.test/layer", {
            retries: 2,
            signal: controller.signal,
        });
        await vi.runAllTimersAsync();
        await expect(request).resolves.toEqual({ ok: true });
        expect(fetchMock).toHaveBeenCalledTimes(2);
        expect(remove.mock.calls.filter(call => call[0] === "abort")).toHaveLength(
            add.mock.calls.filter(call => call[0] === "abort").length,
        );
    });

    it("cancels during retry backoff without starting another request", async () => {
        vi.useFakeTimers();
        const fetchMock = vi.fn(async () => new Response("busy", {
            status: 503,
            headers: { "Retry-After": "10" },
        }));
        vi.stubGlobal("fetch", fetchMock);
        const controller = new AbortController();
        const request = getArcGisJson("https://example.test/layer", {
            retries: 3,
            signal: controller.signal,
        });
        await vi.advanceTimersByTimeAsync(0);
        controller.abort();
        await expect(request).rejects.toMatchObject({ name: "AbortError" });
        await vi.runAllTimersAsync();
        expect(fetchMock).toHaveBeenCalledTimes(1);
    });
});
