import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearRemoteDataSourceCache,
  configuredRemoteDataEndpoints,
  configuredWebRestHostPatterns,
  fetchRemoteDataSource,
  remoteSourcePlaceholderData,
} from "../src/data/remoteDataSources";

afterEach(() => {
  clearRemoteDataSourceCache();
  vi.restoreAllMocks();
});

describe("remote data sources", () => {
  it("loads and normalizes bounded MiniUp table records", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      records: [
        { id: "a", fields: { Status: "Open", Amount: 10 }, createdAt: 1, updatedAt: 2 },
        { id: "b", fields: { Status: "Closed", Amount: 20 }, createdAt: 1, updatedAt: 2 },
      ],
    }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const source = await fetchRemoteDataSource("orders", {
      type: "miniup.table", site: "demo", table: "orders", maxRows: 400, cacheTtlSeconds: 0,
    });
    expect(source.data.rows[0]).toMatchObject({ status: "Open", amount: 10, record_id: "a" });
    expect(String(fetchMock.mock.calls[0][0])).toContain("https://demo.miniup.app/api/data/demo/orders");
  });

  it("binds state into MiniUp Functions and supports dataPath", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      result: { rows: [{ district: "8", count: 12 }] },
    }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const source = await fetchRemoteDataSource("summary", {
      type: "miniup.function", function: "sso-summary", path: "/query",
      dataPath: "result.rows", params: { district: { state: "district", default: "all" } }, cacheTtlSeconds: 0,
    }, { district: 8 });
    expect(source.data.rows).toEqual([{ district: 8, count: 12 }]);
    expect(String(fetchMock.mock.calls[0][0])).toContain("https://functions.miniup.app/sso-summary/query?district=8");
  });

  it("rejects Function traversal and invalid or reserved slugs before fetch", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    for (const definition of [
      { type: "miniup.function" as const, function: "api" },
      { type: "miniup.function" as const, function: "Bad_Name" },
      { type: "miniup.function" as const, function: "safe-name", path: "/../api" },
      { type: "miniup.function" as const, function: "safe-name", path: "/%2e%2e/api" },
    ]) await expect(fetchRemoteDataSource("bad", definition)).rejects.toThrow();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("supports build-trusted web REST GET sources and rejects untrusted origins", async () => {
    expect(configuredWebRestHostPatterns()).toEqual(["https://*.miniup.app"]);
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ rows: [{ ok: true }] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const source = await fetchRemoteDataSource("web", {
      type: "rest.get", baseUrl: "https://demo.miniup.app", path: "/api/public", dataPath: "rows", cacheTtlSeconds: 0,
    });
    expect(source.data.rows).toEqual([{ ok: true }]);
    await expect(fetchRemoteDataSource("bad", {
      type: "rest.get", baseUrl: "https://example.com", path: "/data", cacheTtlSeconds: 0,
    })).rejects.toThrow("not trusted by this web build");
  });

  it("stops reading oversized streamed responses", async () => {
    const chunk = new Uint8Array(3 * 1024 * 1024);
    const body = new ReadableStream({
      start(controller) {
        controller.enqueue(chunk);
        controller.enqueue(chunk);
        controller.close();
      },
    });
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(body, { status: 200 })));
    await expect(fetchRemoteDataSource("big", {
      type: "miniup.function", function: "safe-name", cacheTtlSeconds: 0,
    })).rejects.toThrow("5 MB");
  });

  it("does not share one abortable in-flight request across consumers", async () => {
    const fetchMock = vi.fn().mockImplementation((_url, init: RequestInit) => new Promise((_resolve, reject) => {
      init.signal?.addEventListener("abort", () => reject(init.signal?.reason ?? new DOMException("aborted", "AbortError")), { once: true });
    }));
    vi.stubGlobal("fetch", fetchMock);
    const first = new AbortController();
    const second = new AbortController();
    void fetchRemoteDataSource("same", { type: "miniup.function", function: "safe-name", cacheTtlSeconds: 0 }, {}, first.signal).catch(() => undefined);
    void fetchRemoteDataSource("same", { type: "miniup.function", function: "safe-name", cacheTtlSeconds: 0 }, {}, second.signal).catch(() => undefined);
    await Promise.resolve();
    expect(fetchMock).toHaveBeenCalledTimes(2);
    first.abort();
    second.abort();
  });

  it("keeps placeholders dynamic and exposes only Power BI-supported remote origins", () => {
    const placeholders = remoteSourcePlaceholderData({
      data: { sources: { orders: { type: "miniup.table", site: "demo", table: "orders" } } },
    });
    expect(placeholders.orders.dynamicSchema).toBe(true);
    expect(configuredRemoteDataEndpoints({
      data: { sources: {
        orders: { type: "miniup.table", site: "demo", table: "orders" },
        summary: { type: "miniup.function", function: "summary-ok" },
        web: { type: "rest.get", baseUrl: "https://demo.miniup.app", path: "/rows" },
      } },
    })).toEqual(["https://functions.miniup.app"]);
  });
});
