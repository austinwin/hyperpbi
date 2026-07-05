import { HyperPbiConfig } from "../config/hyperpbiConfig";
import { normalizeMapBindings } from "./normalizeMapBindings";
import { NormalizedData } from "./normalizeData";

export function applyConfigToData(data: NormalizedData, config: HyperPbiConfig): NormalizedData {
    return { ...data, map: normalizeMapBindings(data.rows, data.fields, config.bindings?.map, config.providers?.geocoder?.cacheEntries) };
}
