import { calculationReference, componentReference } from "../../ai/promptTemplates";
export function AiPromptComponentReference() { return <details class="hp-ai-details"><summary>HyperPBI capability reference</summary><p>{componentReference}</p><p>{calculationReference}</p></details>; }
