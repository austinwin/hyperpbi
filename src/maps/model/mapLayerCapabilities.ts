import type { MapLayerSourceType } from "../../schema/mapSchema";

export interface MapLayerCapabilities {
  display: boolean;
  featureInteraction: boolean;
  popup: boolean;
  tooltip: boolean;
  join: boolean;
  selection: boolean;
  serviceRenderer: boolean;
  serviceLabels: boolean;
  identify?: boolean;
}

const CAPABILITIES: Readonly<Record<MapLayerSourceType, MapLayerCapabilities>> = {
  powerbi: {
    display: true,
    featureInteraction: true,
    popup: true,
    tooltip: true,
    join: false,
    selection: true,
    serviceRenderer: false,
    serviceLabels: false,
  },
  arcgisFeature: {
    display: true,
    featureInteraction: true,
    popup: true,
    tooltip: true,
    join: true,
    selection: true,
    serviceRenderer: true,
    serviceLabels: true,
    identify: true,
  },
  arcgisDynamic: {
    display: true,
    featureInteraction: true,
    popup: true,
    tooltip: false,
    join: false,
    selection: false,
    serviceRenderer: false,
    serviceLabels: false,
    identify: true,
  },
  arcgisTile: {
    display: true,
    featureInteraction: false,
    popup: false,
    tooltip: false,
    join: false,
    selection: false,
    serviceRenderer: false,
    serviceLabels: false,
    identify: false,
  },
  geoJson: {
    display: true,
    featureInteraction: true,
    popup: true,
    tooltip: true,
    join: false,
    selection: true,
    serviceRenderer: false,
    serviceLabels: false,
  },
  xyz: {
    display: true,
    featureInteraction: false,
    popup: false,
    tooltip: false,
    join: false,
    selection: false,
    serviceRenderer: false,
    serviceLabels: false,
    identify: false,
  },
};

export function resolveMapLayerCapabilities(
  sourceType: MapLayerSourceType,
): MapLayerCapabilities {
  return CAPABILITIES[sourceType];
}

export function mapLayerCapabilityExplanation(
  sourceType: MapLayerSourceType,
): string | undefined {
  if (sourceType === "arcgisTile")
    return "ArcGIS tile layers are display-only images. Feature details, joins, labels, and selection are unavailable.";
  if (sourceType === "arcgisDynamic")
    return "ArcGIS dynamic layers render server images and support temporary, read-only click identify details. Persistent selection, joins, tooltips, service labels, and client feature rendering are unavailable.";
  if (sourceType === "powerbi")
    return "Power BI geometry supports native row selection; ArcGIS service joins are only available on ArcGIS feature layers.";
  if (sourceType === "xyz")
    return "XYZ tile layers are display-only images. Feature details, joins, labels, and selection are unavailable.";
  return undefined;
}

