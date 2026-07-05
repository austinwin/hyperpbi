import { NormalizedData } from "../data/normalizeData";
import { fieldDictionaryForPrompt } from "./fieldDictionaryForPrompt";
import { calculationReference, componentReference, securityReference } from "./promptTemplates";
export function buildRepairPrompt(json: string, errors: string[], data: NormalizedData): string { return `This HyperPBI JSON failed validation. Fix only the errors below. Do not change working parts unnecessarily. Return valid JSON only, without markdown or explanation.\n\nErrors:\n${errors.map(error=>`- ${error}`).join("\n")}\n\nValid fields:\n${JSON.stringify(fieldDictionaryForPrompt(data),null,2)}\n\n${componentReference}\n${calculationReference}\n${securityReference}\n\nOriginal JSON:\n${json}`; }
