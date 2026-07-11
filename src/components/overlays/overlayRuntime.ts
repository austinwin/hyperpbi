import type { OverlayComponent } from "./overlayTypes";

export const overlayRuntime = {
    triggers: new Map<string, HTMLElement>(),
    panels: new Map<string, HTMLElement>(),
    definitions: new Map<string, OverlayComponent>(),
    restoreSuppressed: new Set<string>(),
    stack: [] as string[],
};

export function registerOverlayDefinition(component: OverlayComponent): () => void {
    if (!component.id) return () => undefined;
    overlayRuntime.definitions.set(component.id, component);
    return () => {
        if (overlayRuntime.definitions.get(component.id!) === component) overlayRuntime.definitions.delete(component.id!);
    };
}
