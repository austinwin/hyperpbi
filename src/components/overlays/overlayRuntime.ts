import type { OverlayComponent } from "./overlayTypes";
import { useRenderContext } from "../../render/RenderContext";

export const createOverlayRuntime = (scope?: string) => ({
    triggers: new Map<string, HTMLElement>(),
    panels: new Map<string, HTMLElement>(),
    definitions: new Map<string, OverlayComponent>(),
    restoreSuppressed: new Set<string>(),
    stack: [] as string[],
    domId: (id: string, suffix: string) => scope ? `${scope}-${id}-${suffix}` : `${id}-${suffix}`,
});

export type OverlayRuntime = ReturnType<typeof createOverlayRuntime>;

export function useOverlayRuntime(): OverlayRuntime {
    const runtime = useRenderContext().overlayRuntime;
    if (!runtime) throw new Error("HyperPBI overlay runtime is unavailable.");
    return runtime;
}

export function registerOverlayDefinition(overlayRuntime: OverlayRuntime, component: OverlayComponent): () => void {
    if (!component.id) return () => undefined;
    overlayRuntime.definitions.set(component.id, component);
    return () => {
        if (overlayRuntime.definitions.get(component.id!) === component) overlayRuntime.definitions.delete(component.id!);
    };
}
