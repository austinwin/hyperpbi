import type { ExternalFilterResult } from "../powerbi/externalFilters";
import type {
    ExternalSelectionResult,
    InteractionDetails
} from "../powerbi/interactionDiagnostics";
import type { FilterOperator } from "../schema/hyperpbiSchema";
import type {
    FilterRequest,
    HyperPbiHostBridge,
    InteractionResult,
    RuntimeDiagnostic,
    SelectionRequest
} from "./HyperPbiHostBridge";

const unsupportedSelection = (): ExternalSelectionResult => ({
    sent: false,
    reason: "unsupported by web host"
});

const unsupportedFilter = (): ExternalFilterResult => ({
    sent: false,
    reason: "unsupported by web host"
});

export class BrowserHostBridge implements HyperPbiHostBridge {
    readonly hostType = "web" as const;
    readonly diagnostics: RuntimeDiagnostic[] = [];

    constructor(private readonly onDiagnostic?: (diagnostic: RuntimeDiagnostic) => void) {}

    async requestSelection(request: SelectionRequest): Promise<InteractionResult> {
        const message = request.clear
            ? "Power BI selection clearing is unavailable in the browser host. Internal dashboard state was still updated."
            : "Power BI row selection is unavailable in the browser host. Internal dashboard state was still updated.";
        this.reportDiagnostic({
            code: "WEB_HOST_SELECTION_UNSUPPORTED",
            severity: "info",
            message,
            componentId: request.details?.componentId
        });
        return { supported: false, success: false, code: "WEB_HOST_SELECTION_UNSUPPORTED", message };
    }

    async requestExternalFilter(request: FilterRequest): Promise<InteractionResult> {
        const message = request.clear
            ? "Power BI external-filter clearing is unavailable in the browser host."
            : "Power BI external filtering is unavailable in the browser host; use declarative internal filtering in Play Mode.";
        this.reportDiagnostic({
            code: "WEB_HOST_EXTERNAL_FILTER_UNSUPPORTED",
            severity: "warning",
            message,
            componentId: request.details?.componentId
        });
        return { supported: false, success: false, code: "WEB_HOST_EXTERNAL_FILTER_UNSUPPORTED", message };
    }

    selectExternal(
        _rowIndices: number[],
        _multiSelect = false,
        details: InteractionDetails = {}
    ): ExternalSelectionResult {
        void this.requestSelection({ rowIndices: _rowIndices, multiSelect: _multiSelect, details });
        return unsupportedSelection();
    }

    clearExternal(details: InteractionDetails = {}): ExternalSelectionResult {
        void this.requestSelection({ rowIndices: [], clear: true, details });
        return unsupportedSelection();
    }

    applyExternalFilter(
        field: string,
        operator: FilterOperator,
        value: unknown,
        details: InteractionDetails = {}
    ): ExternalFilterResult {
        void this.requestExternalFilter({ field, operator, value, details });
        return unsupportedFilter();
    }

    clearExternalFilter(details: InteractionDetails = {}): ExternalFilterResult {
        void this.requestExternalFilter({ clear: true, details });
        return unsupportedFilter();
    }

    openUrl(url: string): void {
        try {
            const parsed = new URL(url, globalThis.location?.href);
            if (parsed.protocol !== "https:") {
                throw new Error("Only HTTPS URLs are allowed.");
            }
            globalThis.open?.(parsed.href, "_blank", "noopener,noreferrer");
        } catch (error) {
            this.reportDiagnostic({
                code: "WEB_HOST_URL_REJECTED",
                severity: "warning",
                message: error instanceof Error ? error.message : "The URL was rejected."
            });
        }
    }

    reportDiagnostic(diagnostic: RuntimeDiagnostic): void {
        this.diagnostics.push(diagnostic);
        this.onDiagnostic?.(diagnostic);
    }
}
