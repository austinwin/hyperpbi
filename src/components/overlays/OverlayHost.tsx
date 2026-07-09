import { h } from "preact";
import { useRenderContext } from "../../render/RenderContext";
import { DashboardRenderer } from "../../render/DashboardRenderer";
import type { DashboardComponent } from "../../schema/hyperpbiSchema";

/**
 * OverlayHost renders the body of active overlay components (modal, offcanvas, dropdown, popover)
 * at the root level so they are not clipped by cards or scrolling containers.
 */
export function OverlayHost() {
    const context = useRenderContext();
    const { state, dispatch } = context;

    if (!state.openOverlays || state.openOverlays.length === 0) {
        return null;
    }

    // Collect overlay components from schema
    const overlayComponents = collectOverlayComponents(context.schema);
    const activeOverlays = state.openOverlays
        .map(id => overlayComponents[id])
        .filter((comp): comp is DashboardComponent => comp !== undefined);

    if (activeOverlays.length === 0) return null;

    return (
        <div class="hp-overlay-host" aria-live="polite">
            {activeOverlays.map(component => {
                const compId = component.id ?? component.type;
                const isOpen = state.openOverlays.includes(compId);

                if (!isOpen) return null;

                switch (component.type) {
                    case "modal":
                        return <ModalOverlay key={compId} component={component} />;
                    case "offcanvas":
                    case "drawer":
                    case "filterDrawer":
                        return null; // offcanvas/drawer render inline via ComponentRegistry
                    case "dropdown":
                    case "popover":
                        return null; // these render near their triggers
                    default:
                        return null;
                }
            })}
        </div>
    );
}

// Stub modal overlay rendered at root level for escape/backdrop behavior.
// The actual content is rendered by ComponentRegistry when triggered.
function ModalOverlay({ component }: { component: any }) {
    const context = useRenderContext();
    const compId = component.id ?? component.type;

    const close = () => {
        context.dispatch({ type: "closeOverlay", id: compId });
    };

    const onBackdrop = (e: MouseEvent) => {
        if (e.target === e.currentTarget && component.backdropClose !== false) {
            close();
        }
    };

    const onKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape") {
            close();
        }
    };

    return (
        <div
            class="hp-modal-backdrop"
            onClick={onBackdrop}
            onKeyDown={onKeyDown}
            role="dialog"
            aria-modal="true"
            aria-label={component.title ?? component.ariaLabel ?? "Dialog"}
        >
            <div class={`hp-modal hp-modal-${component.size ?? "md"}`}>
                <div class="hp-modal-header">
                    <h2 class="hp-modal-title">{component.title ?? ""}</h2>
                    <button type="button" class="hp-btn-icon" aria-label="Close" onClick={close}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 6l12 12M18 6L6 18" /></svg>
                    </button>
                </div>
                <div class="hp-modal-body">
                    {component.children && component.children.length > 0 && (
                        <DashboardRenderer components={component.children} />
                    )}
                </div>
                {component.footer && component.footer.length > 0 && (
                    <div class="hp-modal-footer">
                        <DashboardRenderer components={component.footer} />
                    </div>
                )}
            </div>
        </div>
    );
}

// ── Overlay collection ─────────────────────────────────────────────────

function collectOverlayComponents(schema: any): Record<string, DashboardComponent> {
    const result: Record<string, DashboardComponent> = {};

    const visit = (components: any[]) => {
        if (!components) return;
        for (const comp of components) {
            if (!comp || typeof comp !== "object") continue;
            const id = comp.id ?? comp.type;
            if (id && ["modal", "dropdown", "popover", "offcanvas", "drawer", "filterDrawer"].includes(comp.type)) {
                result[id] = comp as DashboardComponent;
            }
            if (comp.children) visit(comp.children);
            if (comp.tabs) {
                for (const tab of comp.tabs) {
                    if (tab.children) visit(tab.children);
                }
            }
            if (comp.items) {
                for (const item of comp.items as any[]) {
                    if (item.children) visit(item.children);
                }
            }
        }
    };

    visit(schema.components ?? []);
    visit(schema.toolbar ?? []);
    visit(schema.leftPanel ?? []);
    visit(schema.rightPanel ?? []);

    return result;
}
