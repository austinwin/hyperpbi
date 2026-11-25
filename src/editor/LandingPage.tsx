import type { ComponentChildren } from "preact";
import { visual } from "../../pbiviz.json";
import { EXTERNAL_PROVIDERS_AVAILABLE, POWER_BI_BUILT_AT } from "../providers/providerBuild";

const buildDate = POWER_BI_BUILT_AT
    ? new Intl.DateTimeFormat("en", { year: "numeric", month: "short", day: "numeric", timeZone: "UTC" }).format(new Date(POWER_BI_BUILT_AT))
    : undefined;

export function VisualWelcome({ children, hasData = false }: { children: ComponentChildren; hasData?: boolean }) {
    return <div class={`hp-visual-welcome ${hasData ? "hp-setup" : "hp-landing"}`}>
        <header class="hp-visual-welcome-header">
            <div class="hp-visual-welcome-brand">
                <span class="hp-visual-welcome-mark" aria-hidden="true">H</span>
                <div><strong>HyperPBI</strong><span>Dashboard Studio for Power BI</span></div>
            </div>
            <div class="hp-visual-welcome-build" aria-label="Build information">
                <strong>{EXTERNAL_PROVIDERS_AVAILABLE ? "Maps" : "Core"} · v{visual.version}</strong>
                {buildDate && <span>Built <time dateTime={POWER_BI_BUILT_AT}>{buildDate} UTC</time></span>}
            </div>
        </header>
        <div class="hp-visual-welcome-content">{children}</div>
        <footer class="hp-visual-welcome-footer">
            <span>HyperPBI 2.0 specification · by Hoang Nguyen, COH · <a href="https://www.hyperpbi.com" target="_blank" rel="noreferrer">https://www.hyperpbi.com</a></span>
            <a href="https://hyperpbi.com/docs/user-guide" target="_blank" rel="noreferrer">User guide ↗</a>
        </footer>
    </div>;
}

export function LandingPage() {
    return <VisualWelcome>
        <section class="hp-visual-welcome-card">
            <h1>Connect your report data</h1>
            <p>Add columns and measures to <strong>Values</strong>. You can then design a dashboard in HyperPBI Studio.</p>
            <dl class="hp-visual-welcome-steps">
                <div><dt>Bind data</dt><dd>Drag fields into the visual’s Values well.</dd></div>
                <div><dt>Open Studio</dt><dd>Select <strong>Edit</strong> in the visual’s <strong>…</strong> menu.</dd></div>
                <div><dt>Design and save</dt><dd>Build a dashboard or import an existing specification.</dd></div>
            </dl>
        </section>
    </VisualWelcome>;
}
