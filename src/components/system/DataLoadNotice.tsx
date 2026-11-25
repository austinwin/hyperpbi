import type { DataLoadStatus } from "../../data/normalizeData";

export function DataLoadNotice({ status, showProgress = true }: { status?: DataLoadStatus; showProgress?: boolean }) {
    if (!status || status.completeness === "complete" || !status.completeness) return null;
    const loaded = status.loadedRowCount.toLocaleString();
    if (status.completeness === "incomplete") {
        return <div class="hp-data-load-notice hp-data-load-warning" role="alert">
            <strong>Incomplete data · {loaded} rows received.</strong> {status.message}
        </div>;
    }
    if (!showProgress) return null;
    return <div class="hp-data-load-notice" role="status">
        <span class="hp-data-load-indicator" aria-hidden="true" />
        <span>Loading data from Power BI <span class="hp-data-load-count">· {loaded} rows received</span></span>
    </div>;
}
