import { describe, expect, it, vi } from "vitest";
import { defaultConfig } from "../src/config/hyperpbiConfig";
import { createDefaultGeoLibreProject, powerBiLayerId } from "../src/components/geolibre/projectBridge";
import { hydratePowerBiLayers } from "../src/components/geolibre/powerBiBridge";
import { commitGeoLibreSelection, resolveGeoLibreSelection } from "../src/components/geolibre/selectionBridge";
import type { GeoLibreComponent } from "../src/components/geolibre/types";
import type { RenderContextValue, ResolvedDatasetView } from "../src/render/RenderContext";
import { dashboardReducer, initialDashboardState } from "../src/render/stateStore";

const view: ResolvedDatasetView = {
  name: "powerbi",
  rows: [{ lat: 30, lon: -97 }, { lat: 31, lon: -98 }],
  fields: {
    lat: { key: "lat", displayName: "Lat", type: "measure", dataType: "number", roles: [] },
    lon: { key: "lon", displayName: "Lon", type: "measure", dataType: "number", roles: [] },
  },
  rowIndices: [0, 1],
  rowKeys: ["logical-a", "logical-b"],
  sourceRowIndices: [[3], [7, 8]],
  sourceRowKeys: [["source-3"], ["source-7", "source-8"]],
  totalRows: 2,
};

const component: GeoLibreComponent = {
  type: "geolibre",
  id: "gis",
  powerBi: { layers: [{ id: "points", geometry: { latitudeField: "lat", longitudeField: "lon" } }] },
  interaction: { enabled: true, trigger: "click", internalMode: "highlight", internalScope: "all", externalMode: "selection", selectionMode: "replace", multiSelect: true },
};

function context() {
  const sourceRows = Array.from({ length: 10 }, (_, index) => ({ index }));
  const sourceRowKeys = sourceRows.map((_, index) => `source-${index}`);
  const selectSourceRows = vi.fn(() => ({ sent: true as const }));
  const clearExternal = vi.fn(() => ({ sent: true as const }));
  const value = {
    sourceRows,
    sourceRowKeys,
    powerBiSourceRows: sourceRows,
    powerBiSourceRowKeys: sourceRowKeys,
    state: initialDashboardState(),
    config: defaultConfig,
    selectExternal: vi.fn(() => ({ sent: true as const })),
    selectSourceRows,
    clearExternal,
    applyExternalFilter: vi.fn(() => ({ sent: true as const, target: { table: "Data", column: "value" } })),
    clearExternalFilter: vi.fn(() => ({ sent: true as const })),
    reportInteraction: vi.fn(),
  } as unknown as RenderContextValue;
  value.dispatch = action => { value.state = dashboardReducer(value.state, action); };
  return { value, selectSourceRows, clearExternal };
}

describe("GeoLibre selection identity bridge", () => {
  it("maps feature selections back to original Power BI identities and commits one replace", () => {
    const bridge = hydratePowerBiLayers(component, createDefaultGeoLibreProject().document, () => view);
    const identities = [...bridge.identityByLayer.get(powerBiLayerId("points"))!.keys()];
    const resolved = resolveGeoLibreSelection({ layerId: powerBiLayerId("points"), featureIds: [identities[1], identities[0], identities[1]] }, bridge);
    expect(resolved).toMatchObject({ sourceRowIndices: [3, 7, 8], sourceRowKeys: ["source-7", "source-8", "source-3"], acceptedFeatureIds: [identities[1], identities[0]], truncatedFeatureCount: 0 });
    const test = context();
    commitGeoLibreSelection(component, { layerId: powerBiLayerId("points"), featureIds: [identities[1], identities[0]] }, bridge, test.value);
    expect(test.selectSourceRows).toHaveBeenCalledTimes(1);
    expect(test.selectSourceRows).toHaveBeenCalledWith([3, 7, 8], false, expect.objectContaining({ componentId: "gis", componentType: "geolibre" }));
    expect(test.value.state.componentSelectedRows.gis).toEqual([3, 7, 8]);
    expect(test.value.state.selectedRows).toEqual([3, 7, 8]);
  });

  it("caps hostile selection payloads, ignores native-only layers, and clears explicitly", () => {
    const bridge = hydratePowerBiLayers(component, createDefaultGeoLibreProject().document, () => view);
    const ids = [...bridge.identityByLayer.get(powerBiLayerId("points"))!.keys()];
    expect(resolveGeoLibreSelection({ layerId: powerBiLayerId("points"), featureIds: ids }, bridge, 1)).toMatchObject({ acceptedFeatureIds: [ids[0]], truncatedFeatureCount: 1 });
    const test = context();
    expect(commitGeoLibreSelection(component, { layerId: "native-layer", featureIds: ["feature"] }, bridge, test.value)).toBeUndefined();
    commitGeoLibreSelection(component, { layerId: powerBiLayerId("points"), featureIds: [] }, bridge, test.value);
    expect(test.clearExternal).toHaveBeenCalledTimes(1);
    expect(test.selectSourceRows).not.toHaveBeenCalled();
  });
});
