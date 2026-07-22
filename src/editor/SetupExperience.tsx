import { NormalizedData } from "../data/normalizeData";

export function SetupExperience({ data }: { data: NormalizedData }) {
    return <div class="hp-product-page hp-setup hp-setup-ai">
        <header><div class="hp-product-mark">H</div><div><h1>HyperPBI</h1><p>Designed, Developed and Maintained by H.Nguyen - WWO - <a href="https://hyperpbi.com" target="_blank" rel="noreferrer">HyperPBI Page: https://hyperpbi.com</a> · {data.rows.length.toLocaleString()} rows · {Object.keys(data.fields).length} fields ready</p></div></header>
        <main>
            <span class="hp-eyebrow">YOUR DATA IS READY</span>
            <h2>Open HyperPBI Designer from the visual menu</h2>
            <p>Select the visual, open the <strong>…</strong> menu in its top-right corner, then select <strong>Edit</strong>. Power BI opens the complete AI-assisted designer in focus mode.</p>
            <div class="hp-native-edit-guide" aria-label="Open HyperPBI Designer"><span>1</span><strong>Select the visual</strong><span>2</span><strong>Open …</strong><span>3</span><strong>Select Edit</strong></div>
            <div class="hp-setup-benefits">
                <div><strong>Create with AI</strong><span>Generate a prompt containing the engine skill, fields, safe data context, and dashboard goal.</span></div>
                <div><strong>Import or validate</strong><span>Paste AI JSON, import a file, repair validation issues, and inspect the live preview.</span></div>
                <div><strong>Save to Power BI</strong><span>Save the specification and runtime configuration with persistent visual properties.</span></div>
            </div>
            <div class="hp-field-summary"><strong>{Object.keys(data.fields).length} bound fields</strong>{Object.values(data.fields).slice(0, 12).map(field => <span>{field.displayName}</span>)}</div>
        </main>
    </div>;
}
