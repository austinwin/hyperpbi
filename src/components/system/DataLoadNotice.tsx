import type { DataLoadStatus } from "../../data/normalizeData";

export function DataLoadNotice({ status, displayed }: { status?: DataLoadStatus; displayed: number }) {
    if (!status || status.completeness === "complete" || !status.completeness) return null;
    const loaded = status.loadedRowCount.toLocaleString();
    if (status.completeness === "incomplete") {
        return <div class="hp-data-load-notice" role="alert">
            <strong>Incomplete data · {loaded} rows received.</strong> {status.message}
        </div>;
    }
    return <div class="hp-data-load-notice" role="status">
        Loading data from Power BI · {loaded} rows received. Results currently use {displayed.toLocaleString()} rows.
    </div>;
}
