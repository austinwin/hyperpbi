import type { HyperPbiConfig } from "../config/hyperpbiConfig";
import type { ComponentBase, TableComponent } from "../schema/hyperpbiSchema";
import type { ComponentKind, ExternalInteractionMode, InternalInteractionMode, ResolvedInteractionPolicy } from "./interactionTypes";

const controls = new Set(["searchBox", "textInput", "numberInput", "slider", "select", "multiSelect", "segmentedControl", "toggle", "button", "buttonGroup", "filterChips", "dateRange"]);
const dataPoints = new Set(["barChart", "horizontalBarChart", "lineChart", "areaChart", "pieChart", "donutChart", "scatterChart", "heatmap", "smallMultiples", "advancedChart", "table", "matrix", "map", "timeline"]);
const displays = new Set(["kpi", "metricGrid", "infoCard", "statusBadge", "progressBar", "alert", "statList", "detailPanel", "gauge"]);
const navigation = new Set(["tabs", "collapsible", "accordion", "drawer", "filterDrawer", "stepper"]);
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

function legacyEnabled(component: ComponentBase, kind: ComponentKind): boolean {
    if (component.type === "table") return (component as TableComponent).selectable === true;
    if (kind === "control") return !["button", "buttonGroup", "filterChips"].includes(component.type) || component.external === true || component.internal === true;
    if (kind === "custom") return Boolean(component.interactions?.onClick) || component.external === true || component.internal === true;
    if (kind === "dataPoint") return component.external !== false;
    return false;
}

function legacyInternalMode(component: ComponentBase, kind: ComponentKind): InternalInteractionMode {
    if (component.internal === false) return "none";
    if (component.type === "table") {
        const mode = (component as TableComponent).selectionMode;
        if (mode === "highlight") return "highlight";
        if (mode === "filter" || (component as TableComponent).selectable) return "filter";
    }
    if (kind === "control") return "filter";
    if (["map", "timeline"].includes(component.type)) return "highlight";
    return "none";
}

function externalFallback(component: ComponentBase, runtimeConfig: HyperPbiConfig, kind: ComponentKind): ExternalInteractionMode {
    if (component.external === false) return "none";
    return runtimeConfig.interactions?.externalMode ?? "auto";
}

export function resolveInteractionPolicy(component: ComponentBase, runtimeConfig: HyperPbiConfig, componentKind: ComponentKind = componentKindForType(component.type)): ResolvedInteractionPolicy {
    const definition = component.interaction;
    const explicit = definition !== undefined;
    const configuredExternal = definition?.externalMode ?? externalFallback(component, runtimeConfig, componentKind);
    const externalMode = configuredExternal === "auto" ? (componentKind === "control" ? "filter" : "selection") : configuredExternal;
    const legacyScope = component.type === "table" && (component as TableComponent).selectionMode === "filter" ? "self" : "all";
    return {
        enabled: definition?.enabled ?? (explicit ? true : legacyEnabled(component, componentKind)),
        trigger: definition?.trigger && definition.trigger !== "auto" ? definition.trigger : componentKind === "control" ? "change" : "click",
        internalMode: definition?.internalMode ?? legacyInternalMode(component, componentKind),
        internalScope: definition?.internalScope ?? legacyScope,
        externalMode,
        field: definition?.field,
        operator: definition?.operator,
        value: definition?.value,
        selectionMode: definition?.selectionMode ?? "replace",
        multiSelect: definition?.multiSelect ?? runtimeConfig.interactions?.multiSelect !== false,
        showSelector: definition?.showSelector ?? (component.type === "table" && (component as TableComponent).selectable === true),
        clearOnSecondClick: definition?.clearOnSecondClick ?? false,
        componentKind,
        explicit
    };
}
