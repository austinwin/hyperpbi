import { HyperPbiConfig } from "../config/hyperpbiConfig";
import { lazyMapBindings } from "./normalizeMapBindings";
import { NormalizedData } from "./normalizeData";

export function applyConfigToData(data: NormalizedData, config: HyperPbiConfig): NormalizedData {
    return { ...data, map: lazyMapBindings(data.rows, data.fields, config.bindings?.map, config.providers?.geocoder?.cacheEntries, data.rowKeys) };
}
