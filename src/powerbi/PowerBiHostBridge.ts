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
    selectionRowCount: () => number;
    selectionIdForRow: (index: number) => powerbi.visuals.ISelectionId | undefined;
    fields: () => Record<string, NormalizedField>;
    interactionsEnabled: () => boolean;
    reportDiagnostic?: (diagnostic: RuntimeDiagnostic) => void;
}

const MAX_SELECTION_IDENTITIES = 10_000;

export class PowerBiHostBridge implements HyperPbiHostBridge {
    readonly hostType = "powerbi" as const;

    constructor(private readonly context: PowerBiHostBridgeContext) {}

    requestSelectionSync(request: SelectionRequest): ExternalSelectionResult {
        if (!this.context.interactionsEnabled()) return { sent: false, reason: "interactions disabled" };
        if (!this.context.host.hostCapabilities.allowInteractions) return { sent: false, reason: "host disallowed" };
        const rowCount = this.context.selectionRowCount();
        if (!rowCount) return { sent: false, reason: "no selection identities" };
        if (request.clear) {
            void this.context.selectionManager.clear();
            return { sent: true };
        }
        const indices = new Set<number>();
        for (const index of request.rowIndices) {
            if (!Number.isInteger(index) || index < 0 || index >= rowCount) continue;
            indices.add(index);
            if (indices.size > MAX_SELECTION_IDENTITIES) {
                this.context.host.displayWarningIcon?.("Power BI selection is too large", `The selection covers more than ${MAX_SELECTION_IDENTITIES.toLocaleString()} source rows. Select a smaller group or use a Power BI column filter for this interaction.`);
                return { sent: false, reason: "selection exceeds the Power BI identity budget" };
            }
        }
        if (!indices.size) {
            void this.context.selectionManager.clear();
            return { sent: false, reason: "no matching source rows" };
        }
        const identities: powerbi.visuals.ISelectionId[] = [];
        for (const index of indices) {
            const identity = this.context.selectionIdForRow(index);
            if (identity) identities.push(identity);
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
