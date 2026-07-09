import { h } from "preact";
import type { AppFooterConfig } from "../../schema/uiSchema";

export function AppFooter({ config }: { config: AppFooterConfig }) {
    return (
        <footer class="hp-app-footer">
            {config.text && <span class="hp-footer-text">{config.text}</span>}
            {config.secondaryText && <span class="hp-footer-secondary">{config.secondaryText}</span>}
        </footer>
    );
}
