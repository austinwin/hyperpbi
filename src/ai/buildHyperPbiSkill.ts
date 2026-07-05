import { NormalizedData } from "../data/normalizeData";
import { HYPERPBI_SKILL_MARKDOWN } from "../docs/hyperpbiHelp";
import { fieldDictionaryForPrompt } from "./fieldDictionaryForPrompt";

export function buildHyperPbiSkill(data: NormalizedData): string {
    return `${HYPERPBI_SKILL_MARKDOWN}\n\n## Current Power BI field dictionary\n\n${JSON.stringify(fieldDictionaryForPrompt(data), null, 2)}`;
}
