import { NormalizedData } from "../data/normalizeData";
import { fieldManifestForPrompt } from "./fieldManifestForPrompt";
/** @deprecated Use fieldManifestForPrompt. Retained for extensions importing the v1 helper. */
export function fieldDictionaryForPrompt(data: NormalizedData, selected: string[] = [], typesOnly = false): unknown[] { return fieldManifestForPrompt(data,selected,typesOnly?"types":"fields"); }
