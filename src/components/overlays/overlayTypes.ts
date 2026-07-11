import type { DashboardComponent, DrawerComponent, DropdownComponent, ModalComponent, OffcanvasComponent, OverlayPlacement, PopoverComponent } from "../../schema/hyperpbiSchema";
import type { HyperPbiSchema } from "../../schema/hyperpbiSchema";
import type { OverlayAnchor } from "../../render/stateStore";

export type OverlayComponent = DropdownComponent | ModalComponent | OffcanvasComponent | PopoverComponent | DrawerComponent;
export type AnchoredOverlayComponent = DropdownComponent | PopoverComponent;
export type { OverlayPlacement };

export const overlayComponentTypes = new Set(["modal", "dropdown", "popover", "offcanvas", "drawer", "filterDrawer"]);

export function getOverlayAnchor(event?: Event): OverlayAnchor | undefined {
    const element = event?.currentTarget;
    if (typeof HTMLElement === "undefined" || !(element instanceof HTMLElement)) return undefined;
    const rect = element.getBoundingClientRect();
    return { top: rect.top, left: rect.left, width: rect.width, height: rect.height, triggerId: element.id || undefined };
}

export function normalizeOffcanvas(component: DrawerComponent | OffcanvasComponent): OffcanvasComponent {
    return {
        ...component,
        type: "offcanvas",
        position: component.position ?? "right",
        width: component.width ?? 360,
        backdrop: "backdrop" in component ? component.backdrop : true,
        backdropClose: "backdropClose" in component ? component.backdropClose : true,
    };
}

function nestedComponents(component: DashboardComponent): DashboardComponent[][] {
    const value = component as unknown as Record<string, unknown>;
    const groups: DashboardComponent[][] = [];
    for (const key of ["children", "footer"]) {
        if (Array.isArray(value[key])) groups.push(value[key] as DashboardComponent[]);
    }
    if (Array.isArray(value.tabs)) {
        for (const tab of value.tabs as Array<Record<string, unknown>>) {
            for (const key of ["children", "components", "content"]) if (Array.isArray(tab[key])) groups.push(tab[key] as DashboardComponent[]);
        }
    }
    if (component.type === "accordion" && Array.isArray(value.items)) {
        for (const item of value.items as Array<Record<string, unknown>>) if (Array.isArray(item.children)) groups.push(item.children as DashboardComponent[]);
    }
    if (component.type === "smallMultiples" && value.chart && typeof value.chart === "object") groups.push([value.chart as DashboardComponent]);
    return groups;
}

export function visitDashboardComponents(schema: HyperPbiSchema, visitor: (component: DashboardComponent, path: string) => void): void {
    const visit = (components: DashboardComponent[], base: string) => {
        components.forEach((component, index) => {
            const path = `${base}[${index}]`;
            visitor(component, path);
            nestedComponents(component).forEach((children, childIndex) => visit(children, `${path}.nested[${childIndex}]`));
        });
    };
    visit(schema.components ?? [], "components");
    visit(schema.toolbar ?? [], "toolbar");
    visit(schema.leftPanel ?? [], "leftPanel");
    visit(schema.rightPanel ?? [], "rightPanel");
}

export function collectOverlayComponents(schema: HyperPbiSchema): Map<string, OverlayComponent> {
    const result = new Map<string, OverlayComponent>();
    visitDashboardComponents(schema, component => {
        if (overlayComponentTypes.has(component.type) && typeof component.id === "string" && component.id.trim()) result.set(component.id, component as OverlayComponent);
    });
    return result;
}

export function overlayKind(component: OverlayComponent | undefined): "modal" | "dropdown" | "popover" | "offcanvas" | "unknown" {
    if (!component) return "unknown";
    if (component.type === "drawer" || component.type === "filterDrawer") return "offcanvas";
    return component.type;
}
