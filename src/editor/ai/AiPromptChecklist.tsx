import { PromptQualityCheck } from "../../ai/promptQualityChecks";
export function AiPromptChecklist({ checks }: { checks: PromptQualityCheck[] }) { return <div class="hp-ai-checklist">{checks.map(check=><span class={check.passed?"pass":"fail"}>{check.passed?"✓":"!"} {check.label}</span>)}</div>; }
