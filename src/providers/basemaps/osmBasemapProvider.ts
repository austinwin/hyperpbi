import { BasemapProvider } from "../providerTypes";
export const osmBasemapProvider: BasemapProvider={id:"osm",label:"OpenStreetMap",external:true,defaults:{provider:"osm",enabled:true,tileUrl:"https://tile.openstreetmap.org/{z}/{x}/{y}.png",attribution:"© OpenStreetMap contributors",maxZoom:19}};
