import { NormalizedData } from "../data/normalizeData";
import { HYPERPBI_SKILL_MARKDOWN } from "../docs/hyperpbiHelp";
import { fieldDictionaryForPrompt } from "./fieldDictionaryForPrompt";
import { calculationReference, chartReference, componentReference, interactionReference, mapReference, recipeReference, securityReference, stylingReference, tableReference } from "./promptTemplates";

export function buildHyperPbiSkill(data: NormalizedData, includeFieldDictionary = true): string {
    const fields=includeFieldDictionary?`\n\n## Current Power BI field dictionary\n\n${JSON.stringify(fieldDictionaryForPrompt(data), null, 2)}`:"";
    return `${HYPERPBI_SKILL_MARKDOWN}\n\n## Runtime component catalog\n\n${componentReference}\n\n## Styling contract\n\n${stylingReference}\n\n## Chart contract\n\n${chartReference}\n\n## Table contract\n\n${tableReference}\n\n## Calculation contract\n\n${calculationReference}\n\n## Map contract\n\n${mapReference}\n\n## Interaction contract\n\n${interactionReference}\n\n## Reusable dashboard recipes\n\n${recipeReference}\n\n## Security contract\n\n${securityReference}${fields}`;
}
