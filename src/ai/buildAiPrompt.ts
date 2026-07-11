import { NormalizedData } from "../data/normalizeData";
import { AiPromptSettings } from "./aiPromptSettings";
import { composeAiPrompt, PromptCompositionContext } from "./promptComposer";
export function buildAiPrompt(data:NormalizedData,settings:AiPromptSettings,context:PromptCompositionContext={}):string{return composeAiPrompt(data,settings,context).prompt;}
