import { h, render } from "preact";
import { act } from "preact/test-utils";
import { describe, expect, it, vi } from "vitest";
import { MapFeatureDetails } from "../src/components/maps/MapFeatureDetails";
import type { ResolvedMapLayer } from "../src/maps/model/resolvedMapTypes";

const layer = (name: string): ResolvedMapLayer => ({
  id: "facilities",
  name: "Facilities",
  sourceType: "arcgisFeature",
  sourceIdentity: "service",
  capabilities: {
    display: true,
    featureInteraction: true,
    popup: true,
    tooltip: true,
    join: true,
    selection: true,
    serviceRenderer: true,
    serviceLabels: true,
  },
  geometryType: "point",
  visible: true,
  opacity: 1,
  order: 0,
  features: [{
    featureKey: "feature-key",
    id: "7",
    layerId: "facilities",
    geometryType: "point",
    geometry: null,
    lat: 30,
    lon: -95,
    serviceAttributes: { NAME: name },
    powerBiAttributes: {},
    powerBiRowIndices: [],
    powerBiRowKeys: [],
    joinedAttributes: {},
    selected: false,
  }],
  renderer: { type: "simple", symbol: {} },
  popup: {
    enabled: true,
    title: "{{NAME}}",
    defaultFieldSource: "service",
    fields: [{ field: "NAME", fieldSource: "service", label: "Name", display: "text" }],
    actions: [],
  },
  diagnostics: {
    featureCount: 1,
    requestCount: 1,
    loading: false,
    sourceType: "arcgisFeature",
    geometryType: "point",
    usedServiceSymbology: false,
    usedServiceLabels: false,
    warnings: [],
  },
  loading: false,
});

const interaction = {
  selectedFeatureKeys: ["feature-key"],
  activeFeature: {
    featureKey: "feature-key",
    layerId: "facilities",
    featureId: "7",
    anchor: { lat: 30, lon: -95, containerX: 100, containerY: 120 },
  },
};

describe("MapFeatureDetails", () => {
  it("renders outside Leaflet state, updates content in place, and closes accessibly", () => {
    const host = document.createElement("div");
    const close = vi.fn();
    const draw = (layers: ResolvedMapLayer[]) =>
      act(() =>
        render(
          <MapFeatureDetails
            mapId="map"
            component={{ type: "map", id: "map" }}
            layers={layers}
            interaction={interaction}
            onClose={close}
            executeAction={() => undefined}
          />,
          host,
        ),
      );
    draw([layer("North Clinic")]);
    const details = host.querySelector<HTMLElement>(".hp-map-feature-details")!;
    expect(details.textContent).toContain("North Clinic");
    draw([layer("West Hospital")]);
    expect(host.querySelector(".hp-map-feature-details")).toBe(details);
    expect(details.textContent).toContain("West Hospital");
    act(() => host.querySelector<HTMLButtonElement>('[aria-label="Close feature details"]')!.click());
    expect(close).toHaveBeenCalledOnce();
  });

  it("uses a meaningful attribute instead of an internal Power BI row identity", () => {
    const host = document.createElement("div");
    const fallbackLayer = layer("unused");
    fallbackLayer.popup = { enabled: true, fields: [], actions: [] };
    fallbackLayer.features[0] = {
      ...fallbackLayer.features[0],
      id: '[{"identityIndex":8},{"identityIndex":8}]',
      serviceAttributes: {},
      powerBiAttributes: { asset_id: "AS-108", latitude: 30, longitude: -95 },
    };
    act(() => render(
      <MapFeatureDetails
        mapId="map"
        component={{ type: "map", id: "map" }}
        layers={[fallbackLayer]}
        interaction={interaction}
        onClose={() => undefined}
        executeAction={() => undefined}
      />,
      host,
    ));
    expect(host.querySelector(".hp-map-feature-details")?.textContent).toContain("AS-108");
    expect(host.textContent).not.toContain("identityIndex");
  });
});

