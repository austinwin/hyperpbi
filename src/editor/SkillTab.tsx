import { useMemo, useState } from "preact/hooks";
import { buildHyperPbiSkill } from "../ai/buildHyperPbiSkill";
import { NormalizedData } from "../data/normalizeData";
import { copyText, downloadText } from "./textActions";

export function SkillTab({ data }: { data: NormalizedData }) {
    const skill = useMemo(() => buildHyperPbiSkill(data), [data]); const [message, setMessage] = useState("");
    const copy = async () => setMessage(await copyText(skill) ? "Skill copied." : "Copy was blocked by the host.");
    return <div class="hp-copy-document"><header><div><h2>AI Skill</h2><p>Copy this complete engine contract before asking an AI to generate HyperPBI JSON. It includes the current field dictionary.</p></div><div class="hp-button-row"><button class="hp-primary-action" onClick={() => void copy()}>Copy Skill</button><button onClick={() => downloadText(skill, "hyperpbi-ai-skill.md", "text/markdown")}>Download .md</button></div></header>{message && <div class="hp-copy-status">{message}</div>}<textarea readOnly value={skill} aria-label="HyperPBI AI skill Markdown" /></div>;
}
