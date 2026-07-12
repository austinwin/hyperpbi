const features = [
    ["Complete dashboards", "Layouts, KPI cards, controls, tabs, charts, tables, maps, detail panels, and custom content."],
    ["Human-controlled AI workflow", "HyperPBI builds a reviewed prompt from your goal, Field Manifest, privacy mode, relevant contract, and visual size; you choose an approved external AI."],
    ["Power BI interactions", "Selectable tables, charts, maps, and safe actions can interact with compatible report visuals."],
    ["Safe calculations", "Derived fields and metrics use a deterministic JSON DSL instead of JavaScript."],
    ["Enterprise styling", "Theme tokens, global application CSS, reusable component defaults, scoped CSS, slots, and responsive layouts."],
    ["GIS and maps", "Geometry, latitude/longitude, X/Y, layers, legends, OSM tiles, and controlled user-triggered geocoding."],
    ["Secure by design", "No user JavaScript, eval, scripts, iframes, inline handlers, or silent external requests."],
    ["Built-in diagnostics", "Data preview, normalized fields, validation issues, logs, provider status, and interaction status."],
];

export function LandingPage() {
    return <div class="hp-product-page hp-landing-v2">
        <header><div class="hp-product-mark">H</div><div><h1>HyperPBI</h1><p>AI-powered enterprise dashboard designer for Power BI · Designed, Developed and Maintained by H.Nguyen - WWO - <a href="https://austinwin.github.io/hyperpbi" target="_blank" rel="noreferrer">HyperPBI Page: https://austinwin.github.io/hyperpbi</a></p></div><span>Values-only workflow</span></header>
        <main>
            <section class="hp-landing-hero"><div><span class="hp-eyebrow">DESCRIBE · GENERATE · PREVIEW · PUBLISH</span><h2>Build a complete Power BI dashboard by describing what you need</h2><p>Add your report fields once. HyperPBI creates an AI-ready prompt, safely compiles the returned JSON, and renders a responsive dashboard inside one visual.</p><div class="hp-landing-pills"><span>No JavaScript</span><span>Power BI selections</span><span>ECharts</span><span>Leaflet</span><span>Global CSS</span><span>Calculation DSL</span></div></div><div class="hp-landing-mini"><strong>Get started</strong><ol><li>Add fields and measures to <b>Values</b>.</li><li>Open the visual <b>…</b> menu and select <b>Edit</b>.</li><li>Copy the generated prompt to your preferred AI.</li><li>Paste the response, preview, and save.</li></ol></div></section>
            <section class="hp-landing-add-data"><span class="hp-step-icon">1</span><div><h3>Add your Power BI data</h3><p>Drag every column or measure needed by the dashboard into the single <strong>Values</strong> field well. HyperPBI normalizes safe field keys automatically.</p></div></section>
            <section class="hp-feature-grid">{features.map(([title, description], index) => <article><span>{String(index + 1).padStart(2, "0")}</span><h3>{title}</h3><p>{description}</p></article>)}</section>
            <section class="hp-landing-builds"><div><strong>Core build</strong><p>Offline/certification-oriented package with neutral maps and no WebAccess.</p></div><div><strong>Maps build</strong><p>Optional OSM and Nominatim providers with attribution, privacy controls, caching, and tenant-approved WebAccess.</p></div></section>
        </main>
        <footer><strong>HyperPBI 1.0</strong><span>Sanitized HTML/CSS · AI response validation · Persistent Power BI properties · No external AI service dependency</span></footer>
    </div>;
}
