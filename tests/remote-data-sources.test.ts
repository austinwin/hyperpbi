import { afterEach, describe, expect, it, vi } from "vitest";
import {
  clearRemoteDataSourceCache,
  configuredRemoteDataEndpoints,
  fetchRemoteDataSource,
  remoteSourcePlaceholderData,
} from "../src/data/remoteDataSources";

afterEach(() => {
  clearRemoteDataSourceCache();
  vi.restoreAllMocks();
});

describe("MiniUp remote data sources", () => {
  it("loads and normalizes paged MiniUp table records", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        records: [
          { id: "a", fields: { Status: "Open", Amount: 10 }, createdAt: 1, updatedAt: 2 },
          { id: "b", fields: { Status: "Closed", Amount: 20 }, createdAt: 1, updatedAt: 2 },
        ],
      }), { status: 200, headers: { "Content-Type": "application/json" } }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ records: [] }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const source = await fetchRemoteDataSource("orders", {
      type: "miniup.table",
      site: "demo",
      table: "orders",
      maxRows: 400,
      cacheTtlSeconds: 0,
    });

    expect(source.kind).toBe("miniup.table");
    expect(source.data.rows).toHaveLength(2);
    expect(source.data.rows[0]).toMatchObject({ status: "Open", amount: 10, record_id: "a" });
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(String(fetchMock.mock.calls[0][0])).toContain("https://demo.miniup.app/api/data/demo/orders");
  });

  it("binds state values into MiniUp Function query parameters and supports dataPath", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({
      result: { rows: [{ district: "8", count: 12 }] },
    }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const source = await fetchRemoteDataSource("summary", {
      type: "miniup.function",
      function: "sso-summary",
      path: "/query",
      dataPath: "result.rows",
      params: { district: { state: "district", default: "all" } },
      cacheTtlSeconds: 0,
    }, { district: 8 });

    expect(source.data.rows).toEqual([{ district: 8, count: 12 }]);
    expect(String(fetchMock.mock.calls[0][0])).toContain("https://functions.miniup.app/sso-summary/query?district=8");
  });

  it("keeps remote placeholders dynamic until the real response is available", () => {
    const placeholders = remoteSourcePlaceholderData({
      data: { sources: { orders: { type: "miniup.table", site: "demo", table: "orders" } } },
    });
    expect(placeholders.orders.dynamicSchema).toBe(true);
    expect(placeholders.orders.rows).toEqual([]);
  });

  it("only exposes fixed MiniUp origins rather than arbitrary REST hosts", () => {
    expect(configuredRemoteDataEndpoints({
      data: {
        sources: {
          orders: { type: "miniup.table", site: "demo", table: "orders" },
          summary: { type: "miniup.function", function: "summary" },
        },
      },
    })).toEqual(["https://demo.miniup.app", "https://functions.miniup.app"]);
  });
});
