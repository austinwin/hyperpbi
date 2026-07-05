import { customTileProvider } from "./basemaps/customTileProvider";import { noBasemapProvider } from "./basemaps/noBasemapProvider";import { osmBasemapProvider } from "./basemaps/osmBasemapProvider";import { BasemapProvider, BasemapProviderId } from "./providerTypes";
const providers:Record<BasemapProviderId,BasemapProvider>={none:noBasemapProvider,osm:osmBasemapProvider,customTile:customTileProvider};
export const listBasemapProviders=()=>Object.values(providers);export const getBasemapProvider=(id:BasemapProviderId)=>providers[id]??providers.none;
