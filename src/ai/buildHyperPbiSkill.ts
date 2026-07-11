import { NormalizedData } from "../data/normalizeData";
import { HYPERPBI_SKILL_MARKDOWN } from "../docs/hyperpbiHelp";
import { fieldManifestForPrompt } from "./fieldManifestForPrompt";
import { calculationReference, chartReference, componentReference, interactionReference, mapReference, recipeReference, securityReference, stylingReference, tableReference, appShellReference, uiActionReference, overlayReference } from "./promptTemplates";

export function buildHyperPbiSkill(data: NormalizedData, includeFieldDictionary = true): string {
    const fields=includeFieldDictionary?`\n\n## Current Power BI field aliases\n\n${JSON.stringify(fieldManifestForPrompt(data), null, 2)}`:"";
    return `${HYPERPBI_SKILL_MARKDOWN}\n\n## Runtime component catalog\n\n${componentReference}\n\n## Application shell contract\n\n${appShellReference}\n\n## UI action contract\n\n${uiActionReference}\n\n## Overlay contract\n\n${overlayReference}\n\n## Styling contract\n\n${stylingReference}\n\n## Chart contract\n\n${chartReference}\n\n## Table contract\n\n${tableReference}\n\n## Calculation contract\n\n${calculationReference}\n\n## Map contract\n\n${mapReference}\n\n## Interaction contract\n\n${interactionReference}\n\n## Reusable dashboard recipes\n\n${recipeReference}\n\n## Security contract\n\n${securityReference}${fields}`;
}
