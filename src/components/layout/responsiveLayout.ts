import type {
    ComponentBase,
    DashboardComponent,
    ResponsiveBreakpoint,
    ResponsiveComponentRule,
} from "../../schema/hyperpbiSchema";

export const RESPONSIVE_BREAKPOINTS: Readonly<Record<ResponsiveBreakpoint, number>> = Object.freeze({
    xs: 0,
    sm: 480,
    md: 768,
    lg: 1024,
    xl: 1280,
});

const breakpointOrder = Object.keys(RESPONSIVE_BREAKPOINTS) as ResponsiveBreakpoint[];
const clampSpan = (value: number | undefined, fallback: number): number =>
    Number.isFinite(value) ? Math.max(1, Math.min(12, Math.round(value!))) : fallback;
const positiveColumns = (value: number | undefined, fallback: number): number =>
    Number.isFinite(value) ? Math.max(1, Math.min(24, Math.round(value!))) : fallback;

interface ResolvedResponsiveRule {
    span: number;
    order: number;
    visible: boolean;
    direction: "row" | "column";
    columns: number;
    stack: boolean;
}

function applyRule(
    previous: ResolvedResponsiveRule,
    rule: ResponsiveComponentRule | undefined,
    authoredDirection: "row" | "column",
    authoredColumns: number,
): ResolvedResponsiveRule {
    if (!rule) return previous;
    const stack = rule.stack ?? (rule.direction !== undefined || rule.columns !== undefined ? false : previous.stack);
    const visible = rule.visible ?? (rule.hidden === undefined ? previous.visible : !rule.hidden);
    return {
        span: clampSpan(rule.span, previous.span),
        order: Number.isFinite(rule.order) ? Math.round(rule.order!) : previous.order,
        visible,
        direction: stack ? "column" : rule.direction ?? (rule.stack === false ? authoredDirection : previous.direction),
        columns: stack ? 1 : positiveColumns(rule.columns, rule.stack === false ? authoredColumns : previous.columns),
        stack,
    };
}

/**
 * Resolve mobile-first component variables once. CSS container queries only
 * choose among these trusted values; author JSON is never interpolated into CSS.
 */
export function responsiveComponentStyle(component: ComponentBase): Record<string, string | number> {
    const authoredSpan = clampSpan(component.span, 12);
    const authoredDirection = "direction" in component && component.direction === "column" ? "column" : "row";
    const authoredColumns = "columns" in component && typeof component.columns === "number"
        ? positiveColumns(component.columns, 12)
        : 12;
    const layoutType = component.type;
    const baseStack = layoutType === "grid" || layoutType === "split";
    let current: ResolvedResponsiveRule = {
        span: 12,
        order: Number.isFinite(component.order) ? Math.round(component.order!) : 0,
        visible: true,
        direction: layoutType === "split" ? "column" : authoredDirection,
        columns: layoutType === "grid" ? 1 : authoredColumns,
        stack: baseStack,
    };
    const resolved = {} as Record<ResponsiveBreakpoint, ResolvedResponsiveRule>;

    for (const breakpoint of breakpointOrder) {
        // Preserve the historical full-width compact layout unless an author
        // opts into a smaller-breakpoint span. Desktop restores authored spans.
        if (breakpoint === "md" && layoutType === "split") {
            current = { ...current, stack: false, direction: authoredDirection, columns: authoredColumns };
        }
        if (breakpoint === "lg") {
            current = {
                ...current,
                span: authoredSpan,
                ...(layoutType === "grid"
                    ? { stack: false, columns: authoredColumns, direction: authoredDirection }
                    : {}),
            };
        }
        current = applyRule(current, component.responsive?.[breakpoint], authoredDirection, authoredColumns);
        resolved[breakpoint] = { ...current };
    }

    const style: Record<string, string | number> = {};
    for (const breakpoint of breakpointOrder) {
        const value = resolved[breakpoint];
        style[`--hp-span-${breakpoint}`] = value.span;
        style[`--hp-order-${breakpoint}`] = value.order;
        style[`--hp-display-${breakpoint}`] = value.visible ? "block" : "none";
        style[`--hp-layout-direction-${breakpoint}`] = value.direction;
        style[`--hp-layout-columns-${breakpoint}`] = value.columns;
        style[`--hp-split-handle-display-${breakpoint}`] = value.stack ? "none" : "flex";
        style[`--hp-split-pane-grow-${breakpoint}`] = value.stack ? 0 : 1;
        style[`--hp-split-pane-basis-${breakpoint}`] = value.stack ? "auto" : "0px";
        style[`--hp-split-pane-overflow-${breakpoint}`] = value.stack ? "visible" : "auto";
        style[`--hp-split-child-height-${breakpoint}`] = value.stack ? "auto" : "100%";
        style[`--hp-split-cursor-${breakpoint}`] = value.direction === "column" ? "row-resize" : "col-resize";
    }
    return style;
}

function childComponents(component: DashboardComponent): DashboardComponent[] {
    const result: DashboardComponent[] = [];
    if ("children" in component && Array.isArray(component.children)) result.push(...component.children);
    if ("footer" in component && Array.isArray(component.footer)) result.push(...component.footer);
    if (component.type === "tabs" && "tabs" in component && Array.isArray(component.tabs)) {
        for (const tab of component.tabs) result.push(...(tab.children ?? tab.components ?? tab.content ?? []));
    }
    if (component.type === "accordion" && "items" in component && Array.isArray(component.items)) {
        for (const item of component.items) if (item && typeof item === "object" && "children" in item && Array.isArray(item.children)) result.push(...item.children as DashboardComponent[]);
    }
    if (component.type === "smallMultiples" && "chart" in component && component.chart) result.push(component.chart);
    return result;
}

export function componentSubtreeRequestsFill(component: DashboardComponent): boolean {
    return component.heightMode === "fill" || childComponents(component).some(componentSubtreeRequestsFill);
}

/** Establish an inline-size query boundary around authored child layouts. */
export function componentOwnsResponsiveLayout(component: DashboardComponent): boolean {
    return childComponents(component).length > 0;
}

export function componentListRequestsFill(components: readonly DashboardComponent[]): boolean {
    return components.some(componentSubtreeRequestsFill);
}
