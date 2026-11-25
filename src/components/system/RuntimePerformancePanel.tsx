import type { NormalizedData } from "../../data/normalizeData";
import type { DatasetDiagnostic } from "../../data/datasets";

export function RuntimePerformancePanel({ data, filteredCount, renderMs, datasets = [] }: {
    data: NormalizedData;
    filteredCount: number;
    renderMs: number;
    datasets?: DatasetDiagnostic[];
}) {
    const stats = data.performance?.snapshot();
    return <details class="hp-performance">
        <summary>Performance · {filteredCount.toLocaleString()} of {data.rows.length.toLocaleString()} rows</summary>
        <div>{Object.keys(data.fields).length} fields · {data.loadStatus?.completeness ?? "complete"}</div>
        {data.loadStatus?.segments !== undefined && <div>{data.loadStatus.loadedRowCount.toLocaleString()} received in {data.loadStatus.segments} segments</div>}
        <div>Host update preparation {renderMs.toFixed(1)} ms</div>
        {Object.entries(stats?.phases ?? {}).map(([phase, timing]) => <div key={phase}>
            {phase} · {timing.calls} calls · {timing.lastMs.toFixed(1)} ms last · {timing.maxMs.toFixed(1)} ms max
        </div>)}
        {stats?.jsHeapUsedBytes !== undefined && <div>WebView JavaScript heap {(stats.jsHeapUsedBytes / 2 ** 20).toFixed(1)} MiB · shared by the host context</div>}
        {datasets.map(item => <div key={item.name}>
            {item.name} · {item.inputRowCount.toLocaleString()} → {item.outputRowCount.toLocaleString()} rows · {item.evaluationMs.toFixed(1)} ms · cache {item.cacheStatus}
        </div>)}
    </details>;
}
