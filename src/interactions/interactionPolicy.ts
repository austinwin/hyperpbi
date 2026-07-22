import type { HyperPbiConfig } from "../config/hyperpbiConfig";
import type { ComponentBase } from "../schema/hyperpbiSchema";
import type { ComponentKind, ExternalInteractionMode, InternalInteractionMode, ResolvedInteractionPolicy } from "./interactionTypes";

const controls = new Set(["searchBox", "textInput", "numberInput", "slider", "select", "multiSelect", "segmentedControl", "toggle", "button", "buttonGroup", "filterChips", "dateRange"]);
const dataPoints = new Set(["barChart", "horizontalBarChart", "lineChart", "areaChart", "pieChart", "donutChart", "scatterChart", "heatmap", "comboChart", "waterfallChart", "sankeyChart", "treemapChart", "funnelChart", "radarChart", "smallMultiples", "advancedChart", "table", "matrix", "map", "timeline"]);
const displays = new Set(["kpi", "metricGrid", "infoCard", "statusBadge", "progressBar", "alert", "statList", "detailPanel", "gauge"]);
const navigation = new Set(["tabs", "collapsible", "accordion", "steps", "dropdown", "popover", "offcanvas", "modal"]);
const layouts = new Set(["grid", "flex", "split", "section", "toolbar", "leftPanel", "rightPanel", "spacer", "divider"]);
const content = new Set(["text", "markdown", "html"]);

export function componentKindForType(type: string): ComponentKind {
    if (controls.has(type)) return "control";
    if (dataPoints.has(type)) return "dataPoint";
    if (displays.has(type)) return "display";
    if (navigation.has(type)) return "navigation";
    if (layouts.has(type)) return "layout";
    if (content.has(type)) return "content";
    return "custom";
}

function defaultEnabled(component: ComponentBase, kind: ComponentKind): boolean {
    if (kind === "control") return !["button", "buttonGroup", "filterChips"].includes(component.type);
    if (kind === "custom") return Boolean(component.interactions?.onClick);
    if (kind === "dataPoint") return true;
    return false;
}

function defaultInternalMode(component: ComponentBase, kind: ComponentKind): InternalInteractionMode {
    if (kind === "control") return "filter";
    if (["map", "timeline"].includes(component.type)) return "highlight";
    return "none";
}

function externalFallback(runtimeConfig: HyperPbiConfig): ExternalInteractionMode {
    return runtimeConfig.interactions?.externalMode ?? "auto";
}

export function resolveInteractionPolicy(component: ComponentBase, runtimeConfig: HyperPbiConfig, componentKind: ComponentKind = componentKindForType(component.type)): ResolvedInteractionPolicy {
    const definition = component.interaction;
    const explicit = definition !== undefined;
    const configuredExternal = definition?.externalMode ?? externalFallback(runtimeConfig);
    const externalMode = configuredExternal === "auto" ? (componentKind === "control" ? "filter" : "selection") : configuredExternal;
    return {
        enabled: definition?.enabled ?? (explicit ? true : defaultEnabled(component, componentKind)),
        trigger: definition?.trigger && definition.trigger !== "auto" ? definition.trigger : componentKind === "control" ? "change" : "click",
        internalMode: definition?.internalMode ?? defaultInternalMode(component, componentKind),
        internalScope: definition?.internalScope ?? "all",
        externalMode,
        field: definition?.field,
        operator: definition?.operator,
        value: definition?.value,
        selectionMode: definition?.selectionMode ?? "replace",
        multiSelect: definition?.multiSelect ?? runtimeConfig.interactions?.multiSelect !== false,
        showSelector: definition?.showSelector ?? false,
        clearOnSecondClick: definition?.clearOnSecondClick ?? false,
        targets: definition?.targets?.length ? Array.from(new Set(definition.targets)) : definition?.target ? [definition.target] : undefined,
        componentKind,
        explicit
    };
}
