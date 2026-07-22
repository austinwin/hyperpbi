import { HyperPbiSchema } from "../../schema/hyperpbiSchema";
import { RuntimeSettings } from "../../runtime/runtimeSettings";
import { DashboardState } from "../../render/stateStore";
import type { ResolvedAppShell } from "../../schema/uiSchema";

export function resolveAppShell(
    schema: HyperPbiSchema,
    settings: RuntimeSettings,
    state: DashboardState
): ResolvedAppShell {
    const app = schema.app;

    if (!app?.enabled) {
        // The app shell is optional in the canonical schema.
        return {
            enabled: false,
            layout: "vertical",
            container: "fluid",
            density: schema.theme?.density === "compact" ? "compact" : "normal",
            stickyHeader: settings.layout.stickyToolbar,
            contentPadding: "normal",
        };
    }

    return {
        enabled: true,
        layout: app.layout ?? "vertical",
        container: app.container ?? "fluid",
        density: app.density ?? schema.theme?.density === "compact" ? "compact" : "normal",
        stickyHeader: app.stickyHeader ?? false,
        contentPadding: app.contentPadding ?? "normal",
        brand: app.brand,
        navbar: app.navbar,
        sidebar: app.sidebar,
        pageHeader: app.pageHeader,
        footer: app.footer,
    };
}
