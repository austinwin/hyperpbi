import { h, render } from "preact";
import { act } from "preact/test-utils";
import { afterEach, describe, expect, it, vi } from "vitest";
import { calculateAggregates } from "../src/data/aggregations";
import { normalizeMapBindings } from "../src/data/normalizeMapBindings";
import type { NormalizedData } from "../src/data/normalizeData";
import type { HyperPbiSchema } from "../src/schema/hyperpbiSchema";
import { useRemoteDataWorkspace } from "../src/data/useRemoteDataWorkspace";
import { clearRemoteDataSourceCache } from "../src/data/remoteDataSources";

const base: NormalizedData = {
  rows: [],
  rowKeys: [],
  fields: {},
  aggregates: calculateAggregates([]),
  map: normalizeMapBindings([], {}, undefined, undefined, []),
};

const schema: HyperPbiSchema = {
  version: "2.0",
  data: {
    sources: {
      remote: {
        type: "miniup.function",
        function: "district-rows",
        params: { district: { state: "district" } },
        cacheTtlSeconds: 0,
      },
    },
  },
  components: [],
};

function Probe({ district }: { district: number }) {
  const result = useRemoteDataWorkspace(schema, undefined, base, { district });
  const source = result.workspace.sources.remote;
  return h("div", {
    "data-status": result.statuses.remote?.status ?? "none",
    "data-rows": JSON.stringify(source?.data.rows ?? []),
  });
}

afterEach(() => {
  clearRemoteDataSourceCache();
  vi.restoreAllMocks();
  document.body.replaceChildren();
});

describe("remote data workspace lifecycle", () => {
  it("invalidates old rows immediately when query state changes", async () => {
    let resolveSecond!: (value: Response) => void;
    const second = new Promise<Response>(resolve => { resolveSecond = resolve; });
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ rows: [{ district: 8 }] }), { status: 200 }))
      .mockReturnValueOnce(second);
    vi.stubGlobal("fetch", fetchMock);

    const host = document.createElement("div");
    document.body.append(host);
    await act(async () => {
      render(h(Probe, { district: 8 }), host);
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(host.firstElementChild?.getAttribute("data-status")).toBe("ready");
    expect(host.firstElementChild?.getAttribute("data-rows")).toContain('"district":8');

    await act(async () => {
      render(h(Probe, { district: 9 }), host);
      await Promise.resolve();
    });
    expect(host.firstElementChild?.getAttribute("data-status")).toBe("loading");
    expect(host.firstElementChild?.getAttribute("data-rows")).toBe("[]");

    await act(async () => {
      resolveSecond(new Response(JSON.stringify({ rows: [{ district: 9 }] }), { status: 200 }));
      await second;
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(host.firstElementChild?.getAttribute("data-status")).toBe("ready");
    expect(host.firstElementChild?.getAttribute("data-rows")).toContain('"district":9');
    expect(host.firstElementChild?.getAttribute("data-rows")).not.toContain('"district":8');
  });

  it("keeps a failed current request empty rather than restoring stale rows", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({ rows: [{ district: 8 }] }), { status: 200 }))
      .mockRejectedValueOnce(new Error("network down"));
    vi.stubGlobal("fetch", fetchMock);
    const host = document.createElement("div");

    await act(async () => {
      render(h(Probe, { district: 8 }), host);
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(host.firstElementChild?.getAttribute("data-status")).toBe("ready");

    await act(async () => {
      render(h(Probe, { district: 10 }), host);
      await Promise.resolve();
      await Promise.resolve();
    });
    expect(host.firstElementChild?.getAttribute("data-status")).toBe("error");
    expect(host.firstElementChild?.getAttribute("data-rows")).toBe("[]");
  });
});
