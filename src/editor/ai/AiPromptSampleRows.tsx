import { useState } from "preact/hooks";
import type { NormalizedData } from "../../data/normalizeData";
import { samplePreviewRows } from "../../data/samplePreviewRows";

export function AiPromptSampleRows({ data }: { data: NormalizedData }) {
    const [open, setOpen] = useState(false);
    return <details class="hp-ai-details" onToggle={event => setOpen(event.currentTarget.open)}>
        <summary>Local sample preview (not sent automatically)</summary>
        {open && <pre>{JSON.stringify(samplePreviewRows(data, 3), null, 2)}</pre>}
    </details>;
}
