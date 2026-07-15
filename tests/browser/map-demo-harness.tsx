import { render } from "preact";
import { useEffect, useMemo, useReducer, useState } from "preact/hooks";
import "leaflet/dist/leaflet.css";
import "../../src/styles/hyperpbi.css";
import "../../src/styles/hyperpbi-map.css";
import "./map-demo.css";
import { MapBlock } from "../../src/components/maps/MapBlock";
import { RenderContext, type RenderContextValue } from "../../src/render/RenderContext";
import { dashboardReducer, initialDashboardState } from "../../src/render/stateStore";
import { defaultConfig } from "../../src/config/hyperpbiConfig";
import { toRuntimeSettings, VisualFormattingSettingsModel } from "../../src/settings";
import { evaluateDatasets } from "../../src/data/datasets";
import type { HyperPbiSchema, MapComponent } from "../../src/schema/hyperpbiSchema";
import type { MapLayerDefinition } from "../../src/schema/mapSchema";
import { setAllowedHostPatterns } from "../../src/maps/arcgis/arcGisHostPolicy";
import { parseGeometry } from "../../src/maps/geometryParser";
import {
  createDemoData,
  parseDemoCsv,
  type DemoCsvSource,
} from "../helpers/mapDemoCsv";

type DemoId = "feature" | "geometries" | "selection" | "arcgis";

interface DemoDefinition {
  spec: string;
  data: Array<{ file: string; keyField: string }>;
}

const demoDefinitions: Record<DemoId, DemoDefinition> = {
  feature: {
    spec: "map-feature-showcase.json",
    data: [{ file: "map-feature-showcase.csv", keyField: "asset_id" }],
  },
  geometries: {
    spec: "map-multiple-geometries.json",
    data: [
      { file: "map-multiple-geometries-facilities.csv", keyField: "facility_id" },
      { file: "map-multiple-geometries-segments.csv", keyField: "segment_id" },
      { file: "map-multiple-geometries-areas.csv", keyField: "area_id" },
    ],
  },
  selection: {
    spec: "map-selection-details.json",
    data: [{ file: "map-selection-details.csv", keyField: "site_id" }],
  },
  arcgis: {
    spec: "arcgis-map-join-showcase.json",
    data: [{ file: "arcgis-map-join-showcase.csv", keyField: "facility_id" }],
  },
};

declare global {
  interface Window {
    hpMapDemo: {
      ready: boolean;
      selectedRows: number[];
      selectedMulti: boolean;
      selectionCalls: number;
      arcGisRequestCount: number;
      interaction?: ReturnType<typeof initialDashboardState>["mapInteractionState"][string];
      updateRenderer: () => void;
      refreshArcGis: () => void;
    };
  }
}

window.hpMapDemo = {
  ready: false,
  selectedRows: [],
  selectedMulti: false,
  selectionCalls: 0,
  arcGisRequestCount: 0,
  updateRenderer: () => undefined,
  refreshArcGis: () => undefined,
};

async function loadDemo(id: DemoId) {
  const definition = demoDefinitions[id];
  const [specification, ...csvTexts] = await Promise.all([
    fetch(`/examples/specs/${definition.spec}`).then((response) => response.json()),
    ...definition.data.map((source) =>
      fetch(`/examples/data/${source.file}`).then((response) => response.text()),
    ),
  ]);
  const sources: DemoCsvSource[] = definition.data.map((source, index) => ({
    text: csvTexts[index],
    keyField: source.keyField,
  }));
  return {
    schema: specification as HyperPbiSchema,
    data: createDemoData(sources),
  };
}

async function installArcGisFixture(): Promise<() => void> {
  const fixtureText = await fetch(
    "/examples/data/arcgis-map-join-service-fixture.csv",
  ).then((response) => response.text());
  const fixture = parseDemoCsv(fixtureText);
  const serviceOrigin = "https://geogimstest.houstontx.gov";
  const originalFetch = window.fetch.bind(window);
  setAllowedHostPatterns(["https://*"]);
  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url =
      typeof input === "string"
        ? input
        : input instanceof URL
          ? input.href
          : input.url;
    if (!url.startsWith(serviceOrigin)) return originalFetch(input, init);
    window.hpMapDemo.arcGisRequestCount += 1;
    const body = url.includes("/query")
      ? {
          type: "FeatureCollection",
          features: fixture.rows.map((row) => ({
            type: "Feature",
            id: row.OBJECTID,
            properties: {
              OBJECTID: row.OBJECTID,
              facilityid: row.facilityid,
            },
            geometry: parseGeometry(row.geometry)?.geometry ?? null,
          })),
        }
      : {
          id: 9,
          name: "Deterministic municipal facility fixture",
          type: "Feature Layer",
          geometryType: "esriGeometryPoint",
          objectIdField: "OBJECTID",
          capabilities: "Map,Query,Data",
          maxRecordCount: 12,
          supportedQueryFormats: "JSON,geoJSON",
          advancedQueryCapabilities: { supportsPagination: true },
          fields: [
            { name: "OBJECTID", alias: "Object ID", type: "esriFieldTypeOID" },
            { name: "facilityid", alias: "Facility ID", type: "esriFieldTypeString" },
          ],
        };
    return new Response(JSON.stringify(body), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  };
  return () => {
    window.fetch = originalFetch;
  };
}

function updateComponent(
  component: MapComponent,
  rendererVariant: boolean,
  arcGisRefresh: number,
): MapComponent {
  return {
    ...component,
    layers: component.layers?.map((layer): MapLayerDefinition => {
      const renderer = layer.renderer;
      const nextRenderer =
        rendererVariant && renderer?.type === "uniqueValue"
          ? {
              ...renderer,
              values: renderer.values?.map((entry, index) =>
                index === 0
                  ? {
                      ...entry,
                      symbol: { ...entry.symbol, fillColor: "#4338ca" },
                    }
                  : entry,
              ),
            }
          : renderer;
      const source =
        layer.source.type === "arcgisFeature" && arcGisRefresh > 0
          ? {
              ...layer.source,
              definitionExpression:
                arcGisRefresh % 2 === 0 ? "(1=1)" : "1=1",
            }
          : layer.source;
      return { ...layer, source, renderer: nextRenderer };
    }),
  };
}

function DemoHarness({ demoId }: { demoId: DemoId }) {
  const [loaded, setLoaded] = useState<Awaited<ReturnType<typeof loadDemo>>>();
  const [loadError, setLoadError] = useState<string>();
  const [rendererVariant, setRendererVariant] = useState(false);
  const [arcGisRefresh, setArcGisRefresh] = useState(0);
  const [state, dispatch] = useReducer(dashboardReducer, initialDashboardState());

  useEffect(() => {
    let active = true;
    let restoreFixture: (() => void) | undefined;
    void (async () => {
      try {
        if (demoId === "arcgis") restoreFixture = await installArcGisFixture();
        const result = await loadDemo(demoId);
        if (active) setLoaded(result);
      } catch (error) {
        if (active)
          setLoadError(error instanceof Error ? error.message : String(error));
      }
    })();
    return () => {
      active = false;
      restoreFixture?.();
    };
  }, [demoId]);

  const datasets = useMemo(
    () =>
      loaded
        ? evaluateDatasets(loaded.data, loaded.schema.data?.datasets)
        : undefined,
    [loaded],
  );
  const component = useMemo(() => {
    const base = loaded?.schema.components.find(
      (candidate): candidate is MapComponent => candidate.type === "map",
    );
    return base ? updateComponent(base, rendererVariant, arcGisRefresh) : undefined;
  }, [arcGisRefresh, loaded, rendererVariant]);

  useEffect(() => {
    window.hpMapDemo.updateRenderer = () =>
      setRendererVariant((current) => !current);
    window.hpMapDemo.refreshArcGis = () =>
      setArcGisRefresh((current) => current + 1);
    window.hpMapDemo.ready = Boolean(loaded && component);
    window.hpMapDemo.interaction = component
      ? state.mapInteractionState[component.id ?? "map"]
      : undefined;
  }, [component, loaded, state]);

  if (loadError) return <pre role="alert">{loadError}</pre>;
  if (!loaded || !datasets || !component) return <p>Loading map demo…</p>;

  const getDatasetView: NonNullable<RenderContextValue["getDatasetView"]> = (
    name = "powerbi",
  ) => {
    const result = datasets.datasets.get(name);
    if (!result) return undefined;
    const rowIndices = result.data.rows.map((_row, index) => index);
    return {
      name,
      rows: result.data.rows,
      fields: result.data.fields,
      rowIndices,
      rowKeys: result.data.rowKeys,
      sourceRowIndices: rowIndices.map((index) => [...(result.lineage[index] ?? [])]),
      sourceRowKeys: rowIndices.map((index) =>
        (result.lineage[index] ?? []).map(
          (sourceIndex) => loaded.data.rowKeys[sourceIndex] ?? String(sourceIndex),
        ),
      ),
      totalRows: result.data.rows.length,
    };
  };
  const context: RenderContextValue = {
    instanceId: "map-demo-preview",
    data: loaded.data,
    rows: loaded.data.rows,
    sourceRows: loaded.data.rows,
    sourceRowKeys: loaded.data.rowKeys,
    powerBiSourceRows: loaded.data.rows,
    powerBiSourceRowKeys: loaded.data.rowKeys,
    getRowsForComponent: () => loaded.data.rows,
    getDatasetView,
    componentRows: () => [],
    schema: loaded.schema,
    settings: toRuntimeSettings(new VisualFormattingSettingsModel()),
    state,
    dispatch,
    warnings: [],
    config: defaultConfig,
    webAccessAvailable: true,
    selectExternal: (indices, multiSelect) => {
      window.hpMapDemo.selectedRows = indices;
      window.hpMapDemo.selectedMulti = multiSelect === true;
      window.hpMapDemo.selectionCalls += 1;
      return { sent: true };
    },
    selectSourceRows: (indices, multiSelect) => {
      window.hpMapDemo.selectedRows = indices;
      window.hpMapDemo.selectedMulti = multiSelect === true;
      window.hpMapDemo.selectionCalls += 1;
      return { sent: true };
    },
    clearExternal: () => {
      window.hpMapDemo.selectedRows = [];
      return { sent: true };
    },
    applyExternalFilter: () => ({ sent: false }),
    clearExternalFilter: () => ({ sent: false }),
    reportInteraction: () => undefined,
    executeUiAction: () => ({ success: true }),
    isOverlayOpen: () => false,
  };

  return (
    <RenderContext.Provider value={context}>
      <main class="hyperpbi-root hp-demo-root">
        <MapBlock component={component} />
      </main>
    </RenderContext.Provider>
  );
}

const requested = new URLSearchParams(window.location.search).get("demo");
const demoId: DemoId =
  requested && requested in demoDefinitions ? (requested as DemoId) : "feature";
render(<DemoHarness demoId={demoId} />, document.getElementById("app")!);
