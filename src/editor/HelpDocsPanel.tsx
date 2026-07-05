import { useState } from "preact/hooks";
import { HYPERPBI_HELP_MARKDOWN } from "../docs/hyperpbiHelp";
import { copyText, downloadText } from "./textActions";

export function HelpDocsPanel() {
    const [message, setMessage] = useState("");
    const copy = async () => setMessage(await copyText(HYPERPBI_HELP_MARKDOWN) ? "Copied Markdown." : "Copy was blocked by the host.");
    return <div class="hp-copy-document"><header><div><h2>Help / Docs</h2><p>Plain Markdown that can be copied directly into ChatGPT, DeepSeek, Copilot, or internal documentation.</p></div><div class="hp-button-row"><button onClick={() => void copy()}>Copy Markdown</button><button onClick={() => downloadText(HYPERPBI_HELP_MARKDOWN, "hyperpbi-authoring-guide.md", "text/markdown")}>Download .md</button></div></header>{message && <div class="hp-copy-status">{message}</div>}<textarea readOnly value={HYPERPBI_HELP_MARKDOWN} aria-label="HyperPBI help documentation Markdown" /></div>;
}
