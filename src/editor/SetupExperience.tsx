import type { NormalizedData } from "../data/normalizeData";
import { DataLoadNotice } from "../components/system/DataLoadNotice";
import { VisualWelcome } from "./LandingPage";

export function SetupExperience({ data, showProgress }: { data: NormalizedData; showProgress?: boolean }) {
    const fields = Object.values(data.fields);
    const loading = data.loadStatus?.completeness === "loading";
    return <VisualWelcome hasData>
        <DataLoadNotice status={data.loadStatus} showProgress={showProgress} />
        <section class="hp-visual-welcome-card">
            <h1>Open HyperPBI Studio</h1>
            <p>Select the visual, then choose <strong>Edit</strong> from its <strong>…</strong> menu. Create a dashboard, import a specification, or start with an AI prompt.</p>
            <div class="hp-visual-welcome-field-summary">
                <strong>{fields.length.toLocaleString()} bound fields{!loading && ` · ${data.rows.length.toLocaleString()} rows`}</strong>
                <ul class="hp-visual-welcome-fields" aria-label="Example bound fields">
                    {fields.slice(0, 6).map(field => <li key={field.key}>{field.displayName}</li>)}
                    {fields.length > 6 && <li>+{fields.length - 6} more</li>}
                </ul>
            </div>
        </section>
    </VisualWelcome>;
}
