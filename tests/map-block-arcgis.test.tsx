import { h, render } from "preact";
import { act } from "preact/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { calculateAggregates } from "../src/data/aggregations";
import { normalizeMapBindings } from "../src/data/normalizeMapBindings";
import type { DataRow, NormalizedData } from "../src/data/normalizeData";
import { defaultConfig } from "../src/config/hyperpbiConfig";
import {
  RenderContext,
  type RenderContextValue,
} from "../src/render/RenderContext";
import { initialDashboardState } from "../src/render/stateStore";
import {
  toRuntimeSettings,
  VisualFormattingSettingsModel,
} from "../src/settings";
import type { MapComponent } from "../src/schema/hyperpbiSchema";
import type {
  ArcGisFeatureQueryRequest,
  ArcGisFeatureQueryResult,
} from "../src/maps/arcgis/arcGisFeatureQuery";
import type { ResolvedMapLayer } from "../src/maps/model/resolvedMapTypes";

const queryMock = vi.hoisted(() => vi.fn());
let latestLeafletProps:
  | {
      resolvedLayers: ResolvedMapLayer[];
      onViewportChange?: (viewport: {
        bounds: [number, number, number, number];
        center: [number, number];
        zoom: number;
        width: number;
        height: number;
      }) => void;
      onLayerRuntimeStateChange?: (
        layerId: string,
        update: { loading?: boolean; error?: string; warning?: string },
      ) => void;
    }
  | undefined;

vi.mock("../src/maps/arcgis/arcGisFeatureQuery", () => ({
  executeArcGisFeatureQuery: queryMock,
}));
vi.mock("../src/components/maps/LeafletMap", () => ({
  LeafletMap: (props: typeof latestLeafletProps) => {
    latestLeafletProps = props;
    return h("div", { class: "leaflet-stub" });
  },
}));

import {
  MapBlock,
  collectArcGisQueryFields,
  createArcGisErrorShell,
  createCorePackageErrorShell,
  roundViewportBounds,
  viewportEqual,
} from "../src/components/maps/MapBlock";

const rows: DataRow[] = [
  { FacilityID: " a-1 ", Sales: 10 },
  { FacilityID: "B-2", Sales: 20 },
];
const fields: NormalizedData["fields"] = {
  FacilityID: {
    key: "FacilityID",
    displayName: "FacilityID",
    type: "dimension",
    roles: ["values"],
  },
  Sales: {
    key: "Sales",
    displayName: "Sales",
    type: "measure",
    roles: ["values"],
  },
};
const data: NormalizedData = {
  rows,
  rowKeys: ["row-0", "row-1"],
  fields,
  aggregates: calculateAggregates(rows),
  map: normalizeMapBindings(rows, fields),
};

function context(webAccessAvailable = true): RenderContextValue {
  const value = {
    data,
    rows,
    sourceRows: rows,
    sourceRowKeys: data.rowKeys,
    getRowsForComponent: () => rows,
    componentRows: () => [],
    schema: { version: "1.0", components: [] },
    settings: toRuntimeSettings(new VisualFormattingSettingsModel()),
    state: initialDashboardState(),
    dispatch: vi.fn(),
    warnings: [],
    selectExternal: vi.fn(() => ({ sent: true as const })),
    clearExternal: vi.fn(() => ({ sent: true as const })),
    applyExternalFilter: vi.fn(() => ({ sent: true as const })),
    clearExternalFilter: vi.fn(() => ({ sent: true as const })),
    reportInteraction: vi.fn(),
    config: defaultConfig,
    webAccessAvailable,
    executeUiAction: vi.fn(() => ({ success: true as const })),
    isOverlayOpen: () => false,
  } as unknown as RenderContextValue;
  return value;
}

function component(
  layers: NonNullable<MapComponent["layers"]>,
  overrides: Partial<MapComponent> = {},
): MapComponent {
  return {
    type: "map",
    id: "map",
    layers,
    settings: { showLayerControl: true, showLegend: true },
    ...overrides,
  };
}

function featureLayer(id: string, viewportQuery = false) {
  return {
    id,
    name: id,
    source: {
      type: "arcgisFeature" as const,
      url: `https://services.arcgis.com/example/ArcGIS/rest/services/${id}/FeatureServer/0`,
      mode: "reference" as const,
    },
    performance: { viewportQuery },
  };
}

function result(name: string, objectId = 1): ArcGisFeatureQueryResult {
  return {
    features: [
      {
        objectId,
        attributes: { OBJECTID: objectId, NAME: name },
        geometry: { type: "Point", coordinates: [-95, 29] },
      },
    ],
    metadata: {
      id: 0,
      name,
      objectIdField: "OBJECTID",
      geometryType: "esriGeometryPoint",
      capabilities: "Query",
      fields: [
        { name: "OBJECTID", type: "esriFieldTypeOID" },
        { name: "NAME", type: "esriFieldTypeString" },
      ],
    },
    requestCount: 1,
    truncated: false,
    objectIdField: "OBJECTID",
    geometryType: "point",
    spatialReference: { wkid: 4326 },
    warnings: [],
    sourceUrl: "https://services.arcgis.com/test/0",
    usedCache: false,
    queryStrategy: "pagination",
  };
}

async function settle() {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0));
  });
}

function mount(mapComponent: MapComponent, webAccess = true) {
  const host = document.createElement("div");
  const value = context(webAccess);
  act(() =>
    render(
      h(
        RenderContext.Provider,
        { value },
        h(MapBlock, { component: mapComponent }),
      ),
      host,
    ),
  );
  return { host, value };
}

beforeEach(() => {
  queryMock.mockReset();
  queryMock.mockResolvedValue(result("Default"));
  latestLeafletProps = undefined;
});
afterEach(() => {
  document.body.replaceChildren();
});

describe("MapBlock ArcGIS runtime", () => {
  it("runs the initial query for every feature definition and builds static shells without querying them", async () => {
    mount(
      component([
        featureLayer("static"),
        {
          id: "tiles",
          name: "Tiles",
          source: {
            type: "arcgisTile",
            url: "https://tiles.arcgisonline.com/test/MapServer",
          },
        },
      ]),
    );
    await settle();
    expect(queryMock).toHaveBeenCalledTimes(1);
    expect(
      (queryMock.mock.calls[0][0] as ArcGisFeatureQueryRequest).url,
    ).toContain("static");
    expect(
      latestLeafletProps?.resolvedLayers.map((layer) => layer.sourceType),
    ).toContain("arcgisTile");
  });

  it("requeries only viewport-enabled feature layers after a meaningful viewport change", async () => {
    mount(component([featureLayer("static"), featureLayer("viewport", true)]));
    await settle();
    // Static layers resolve immediately; viewport layers wait for real bounds
    // instead of issuing a duplicate unbounded request during mount.
    expect(queryMock).toHaveBeenCalledTimes(1);
    act(() =>
      latestLeafletProps?.onViewportChange?.({
        bounds: [-96, 29, -94, 31],
        center: [30, -95],
        zoom: 10,
        width: 800,
        height: 600,
      }),
    );
    await settle();
    expect(queryMock).toHaveBeenCalledTimes(2);
    expect(
      (queryMock.mock.calls[1][0] as ArcGisFeatureQueryRequest).url,
    ).toContain("viewport");
    expect(
      (queryMock.mock.calls[1][0] as ArcGisFeatureQueryRequest).viewportQuery,
    ).toBe(true);
  });

  it("ignores stale responses and retains the previous successful layer while the replacement loads", async () => {
    let resolveFirstViewport!: (value: ArcGisFeatureQueryResult) => void;
    let resolveSecondViewport!: (value: ArcGisFeatureQueryResult) => void;
    queryMock
      .mockResolvedValueOnce(result("Old", 1))
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveFirstViewport = resolve;
        }),
      )
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveSecondViewport = resolve;
        }),
    );
    mount(component([featureLayer("viewport", true)]));
    await settle();
    act(() =>
      latestLeafletProps?.onViewportChange?.({
        bounds: [-95.5, 29.5, -94.5, 30.5],
        center: [30, -95],
        zoom: 9,
        width: 800,
        height: 600,
      }),
    );
    await settle();
    expect(
      latestLeafletProps?.resolvedLayers[0].features[0].serviceAttributes.NAME,
    ).toBe("Old");
    act(() =>
      latestLeafletProps?.onViewportChange?.({
        bounds: [-96, 29, -94, 31],
        center: [30, -95],
        zoom: 10,
        width: 800,
        height: 600,
      }),
    );
    await settle();
    expect(
      latestLeafletProps?.resolvedLayers[0].features[0].serviceAttributes.NAME,
    ).toBe("Old");
    expect(latestLeafletProps?.resolvedLayers[0].loading).toBe(true);
    act(() =>
      latestLeafletProps?.onViewportChange?.({
        bounds: [-97, 28, -93, 32],
        center: [30, -95],
        zoom: 11,
        width: 800,
        height: 600,
      }),
    );
    await settle();
    resolveSecondViewport(result("Newest", 2));
    await settle();
    expect(
      latestLeafletProps?.resolvedLayers[0].features[0].serviceAttributes.NAME,
    ).toBe("Newest");

    // A late, abort-insensitive response from an older version cannot overwrite the newest layer.
    resolveFirstViewport(result("Stale", 3));
    await settle();
    expect(
      latestLeafletProps?.resolvedLayers[0].features[0].serviceAttributes.NAME,
    ).toBe("Newest");
  });

  it("keeps a successful sibling when one isolated layer fails", async () => {
    queryMock.mockImplementation((request: ArcGisFeatureQueryRequest) =>
      request.url.includes("bad")
        ? Promise.reject(new Error("service failed"))
        : Promise.resolve(result("Good")),
    );
    mount(component([featureLayer("good"), featureLayer("bad")]));
    await settle();
    const layers = latestLeafletProps?.resolvedLayers ?? [];
    expect(layers.find((layer) => layer.id === "good")?.features).toHaveLength(
      1,
    );
    expect(layers.find((layer) => layer.id === "bad")?.diagnostics.error).toBe(
      "service failed",
    );
  });

  it("passes join values, normalization, strategy, service flags, and tooltip fields in a typed query", async () => {
    const joined = featureLayer("joined");
    joined.source = {
      ...joined.source,
      mode: "join",
      useServiceRenderer: true,
      useServiceLabels: true,
    };
    const mapComponent = component([
      {
        ...joined,
        join: {
          enabled: true,
          powerBiField: "FacilityID",
          serviceField: "FACILITYID",
          normalization: ["trim", "upper"],
          queryStrategy: "keyBatches",
        },
        renderer: { type: "service" },
        tooltip: {
          enabled: true,
          template: "{{NAME}}",
          fields: [{ field: "FACILITYID", fieldSource: "service" }],
        },
      },
    ]);
    mount(mapComponent);
    await settle();
    const request = queryMock.mock.calls[0][0] as ArcGisFeatureQueryRequest;
    expect(request.joinKeys).toEqual({
      field: "FACILITYID",
      values: [" a-1 ", "B-2"],
      normalization: ["trim", "upper"],
    });
    expect(request.queryStrategy).toBe("keyBatches");
    expect(request.useServiceRenderer).toBe(true);
    expect(request.useServiceLabels).toBe(true);
    expect(request.outFields).toEqual(expect.arrayContaining(["FACILITYID"]));
    expect(request.outFields).not.toContain("NAME");
  });

  it("preserves source types for Core and runtime error shells", async () => {
    const coreShell = createCorePackageErrorShell(featureLayer("core"));
    expect(queryMock).not.toHaveBeenCalled();
    expect(coreShell.sourceType).toBe("arcgisFeature");
    expect(coreShell.diagnostics.error).toMatch(/Maps package/);
    const tileError = createArcGisErrorShell(
      {
        id: "tile",
        name: "Tile",
        source: {
          type: "arcgisTile",
          url: "https://tiles.arcgisonline.com/a/MapServer",
        },
      },
      "blocked",
    );
    expect(tileError.sourceType).toBe("arcgisTile");
    expect(tileError.tile?.url).toContain("MapServer");
  });

  it("uses one resolved toolbar default and switches directly between panels", async () => {
    const mapComponent = component([featureLayer("ui")], {
      layerPanel: { visible: true, defaultOpen: true },
      legend: { defaultOpen: true },
    });
    const { host, value } = mount(mapComponent);
    await settle();
    expect(host.querySelector(".hp-map-layer-panel")).not.toBeNull();
    expect(host.querySelector(".hp-map-legend")).toBeNull();
    act(() =>
      (
        host.querySelector('[aria-label="Legend"]') as HTMLButtonElement
      ).click(),
    );
    expect(value.dispatch).toHaveBeenCalledWith({
      type: "setMapToolbarPopover",
      mapId: "map",
      popover: "legend",
    });
    value.state.mapUiState.map = { toolbarPopover: "legend" };
    act(() =>
      render(
        h(
          RenderContext.Provider,
          { value },
          h(MapBlock, { component: mapComponent }),
        ),
        host,
      ),
    );
    expect(host.querySelector(".hp-map-layer-panel")).toBeNull();
    expect(host.querySelector(".hp-map-legend")).not.toBeNull();
  });

  it("applies Leaflet runtime diagnostics immutably to only the requested layer", async () => {
    mount(
      component([
        {
          id: "dynamic",
          name: "Dynamic",
          source: {
            type: "arcgisDynamic",
            url: "https://services.arcgis.com/x/MapServer",
          },
        },
      ]),
    );
    await settle();
    const before = latestLeafletProps!.resolvedLayers[0];
    act(() =>
      latestLeafletProps?.onLayerRuntimeStateChange?.("dynamic", {
        loading: true,
        warning: "refreshing",
      }),
    );
    await settle();
    const after = latestLeafletProps!.resolvedLayers[0];
    expect(after).not.toBe(before);
    expect(after.diagnostics).not.toBe(before.diagnostics);
    expect(after.diagnostics.warnings).toContain("refreshing");
    expect(before.diagnostics.warnings).toEqual([]);
  });
});

describe("MapBlock exported runtime helpers", () => {
  it("compares rounded bounds plus zoom and size", () => {
    const left = {
      bounds: [-95.00001, 29.00001, -94.00001, 30.00001] as [
        number,
        number,
        number,
        number,
      ],
      center: [29.5, -94.5] as [number, number],
      zoom: 10,
      width: 800,
      height: 600,
    };
    expect(roundViewportBounds(left.bounds)).toEqual([-95, 29, -94, 30]);
    expect(
      viewportEqual(left, {
        ...left,
        bounds: [-95.00009, 29.00009, -94.00009, 30.00009],
      }),
    ).toBe(true);
    expect(viewportEqual(left, { ...left, zoom: 11 })).toBe(false);
  });

  it("collects actual renderer, label, popup, tooltip, template, and join fields", () => {
    const definition = {
      ...featureLayer("fields"),
      join: {
        enabled: true,
        powerBiField: "FacilityID",
        serviceField: "FACILITYID",
      },
      renderer: { type: "uniqueValue" as const, field: "STATUS" },
      labels: { field: "LABEL", template: "{{LABEL2}}" },
      popup: {
        fields: [
          { field: "POP", fieldSource: "service" as const },
          { field: "LOCAL", fieldSource: "powerbi" as const },
        ],
      },
      tooltip: {
        fields: [{ field: "TIP", fieldSource: "joined" as const }],
        template: "{{TIP2}}",
      },
    };
    expect(collectArcGisQueryFields(definition, definition.source)).toEqual(
      expect.arrayContaining([
        "FACILITYID",
        "STATUS",
        "LABEL",
        "LABEL2",
        "POP",
        "TIP2",
      ]),
    );
    expect(
      collectArcGisQueryFields(definition, definition.source),
    ).not.toContain("LOCAL");
    expect(
      collectArcGisQueryFields(definition, definition.source),
    ).not.toContain("TIP");
  });
});
