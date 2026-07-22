import powerbi from "powerbi-visuals-api";
import type { NormalizedField } from "../data/normalizeData";
import type {
    FilterRequest,
    HyperPbiHostBridge,
    InteractionResult,
    RuntimeDiagnostic,
    SelectionRequest
} from "../host/HyperPbiHostBridge";
import {
    applyExternalFilter,
    clearExternalFilter,
    type ExternalFilterResult
} from "./externalFilters";
import type { ExternalSelectionResult } from "./interactionDiagnostics";

export interface PowerBiHostBridgeContext {
    host: powerbi.extensibility.visual.IVisualHost;
    selectionManager: powerbi.extensibility.ISelectionManager;
    selectionIds: () => Array<powerbi.visuals.ISelectionId | undefined>;
    fields: () => Record<string, NormalizedField>;
    interactionsEnabled: () => boolean;
    reportDiagnostic?: (diagnostic: RuntimeDiagnostic) => void;
}

export class PowerBiHostBridge implements HyperPbiHostBridge {
    readonly hostType = "powerbi" as const;

    constructor(private readonly context: PowerBiHostBridgeContext) {}

    requestSelectionSync(request: SelectionRequest): ExternalSelectionResult {
        if (!this.context.interactionsEnabled()) return { sent: false, reason: "interactions disabled" };
        if (!this.context.host.hostCapabilities.allowInteractions) return { sent: false, reason: "host disallowed" };
        const selectionIds = this.context.selectionIds();
        if (!selectionIds.length) return { sent: false, reason: "no selection identities" };
        if (request.clear) {
            void this.context.selectionManager.clear();
            return { sent: true };
        }
        const indices = Array.from(new Set(request.rowIndices)).filter(
            index => Number.isInteger(index) && index >= 0 && index < selectionIds.length
        );
        const identities = indices
            .map(index => selectionIds[index])
            .filter((identity): identity is powerbi.visuals.ISelectionId => identity !== undefined);
        if (!indices.length) {
            void this.context.selectionManager.clear();
            return { sent: false, reason: "no matching source rows" };
        }
        if (!identities.length) return { sent: false, reason: "no selection identities" };
        void this.context.selectionManager.select(identities, request.multiSelect ?? false);
        return { sent: true };
    }

    async requestSelection(request: SelectionRequest): Promise<InteractionResult> {
        const result = this.requestSelectionSync(request);
        return {
            supported: result.reason !== "host disallowed",
            success: result.sent,
            code: result.reason,
            message: result.reason
        };
    }

    requestExternalFilterSync(request: FilterRequest): ExternalFilterResult {
        if (!this.context.interactionsEnabled()) return { sent: false, reason: "interactions disabled" };
        if (!this.context.host.hostCapabilities.allowInteractions) return { sent: false, reason: "host disallowed" };
        if (request.clear) return clearExternalFilter(this.context.host, request.details);
        if (!request.field || !request.operator) {
            return { sent: false, reason: "field has no Power BI filter target" };
        }
        return applyExternalFilter(
            this.context.host,
            this.context.fields(),
            request.field,
            request.operator,
            request.value,
            request.details
        );
    }

    async requestExternalFilter(request: FilterRequest): Promise<InteractionResult> {
        const result = this.requestExternalFilterSync(request);
        return {
            supported: result.reason !== "host disallowed",
            success: result.sent,
            code: result.reason,
            message: result.reason
        };
    }

    openUrl(url: string): void {
        try {
            const parsed = new URL(url);
            if (parsed.protocol !== "https:") return;
            this.context.host.launchUrl?.(parsed.href);
        } catch {
            this.reportDiagnostic({ code: "POWERBI_URL_REJECTED", severity: "warning", message: "The URL was invalid." });
        }
    }

    reportDiagnostic(diagnostic: RuntimeDiagnostic): void {
        this.context.reportDiagnostic?.(diagnostic);
    }
}
