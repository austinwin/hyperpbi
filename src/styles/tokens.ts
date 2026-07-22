import { HyperPbiTheme } from "../schema/hyperpbiSchema";
import { RuntimeSettings } from "../runtime/runtimeSettings";

function color(value: string | undefined, fallback: string): string { return value && /^(#[0-9a-f]{3,8}|rgba?\([\d\s,.%]+\)|hsla?\([\d\s,.%]+\))$/i.test(value.trim()) ? value.trim() : fallback; }
function size(value: number | undefined, fallback: number, max = 64): number { return Number.isFinite(value) ? Math.max(0, Math.min(max, Number(value))) : fallback; }
function font(value: string | undefined, fallback: string): string { return value && /^[A-Za-z0-9 ,'-]{1,120}$/.test(value) ? value : fallback; }

export function themeVariables(schema: HyperPbiTheme | undefined, settings: RuntimeSettings): Record<string, string | number> {
    return {
        "--hp-primary": color(schema?.primaryColor, settings.theme.primary), "--hp-accent": color(schema?.accentColor, settings.theme.accent),
        "--hp-surface": color(schema?.surfaceColor, settings.theme.surface), "--hp-text": color(schema?.textColor, settings.theme.text), "--hp-border": color(schema?.borderColor, settings.theme.border),
        "--hp-danger": color(schema?.dangerColor, settings.theme.danger), "--hp-warning": color(schema?.warningColor, settings.theme.warning), "--hp-success": color(schema?.successColor, settings.theme.success),
        "--hp-font": font(schema?.fontFamily, settings.theme.fontFamily), "--hp-font-size": `${size(settings.theme.baseFontSize, 12, 20)}px`, "--hp-radius": `${size(schema?.radius, settings.theme.radius, 24)}px`,
        "--hp-card-padding": `${size(schema?.cardPadding, settings.layout.cardPadding, 32)}px`, "--hp-gap": `${size(schema?.gap, settings.layout.gap, 32)}px`, "--hp-shadow-opacity": Math.max(0, Math.min(.2, settings.theme.shadow * .025)),
        "--hp-header-height": `${size(settings.layout.headerHeight, 44, 120)}px`
    };
}
