import { NormalizedData } from "../../data/normalizeData";
export function AiPromptSampleRows({ data }: { data: NormalizedData }) { return <details class="hp-ai-details"><summary>Local sample preview (not sent automatically)</summary><pre>{JSON.stringify(data.rows.slice(0,3),null,2)}</pre></details>; }
