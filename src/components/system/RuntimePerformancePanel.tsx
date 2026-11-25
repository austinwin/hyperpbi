import { useState } from "preact/hooks";
import type { RuntimeProfiler } from "../../render/RuntimeProfiler";
import type { NormalizedData } from "../../data/normalizeData";
import type { DatasetDiagnostic } from "../../data/datasets";

export function RuntimePerformancePanel({ data, filteredCount, renderMs, datasets = [], profiler, totalComponents }: {
    data: NormalizedData;
    filteredCount: number;
    renderMs: number;
    datasets?: DatasetDiagnostic[];
    profiler?: RuntimeProfiler;
    totalComponents?: number;
}) {
    const stats = data.performance?.snapshot();
    const [sample, setSample] = useState<ReturnType<RuntimeProfiler["snapshot"]>>();
    const profile = sample ?? profiler?.snapshot();
    return <details class="hp-performance">
        <summary>Performance · {filteredCount.toLocaleString()} of {data.rows.length.toLocaleString()} rows</summary>
        <div>{Object.keys(data.fields).length} fields · {data.loadStatus?.completeness ?? "complete"}</div>
        {data.loadStatus?.segments !== undefined && <div>{data.loadStatus.loadedRowCount.toLocaleString()} received in {data.loadStatus.segments} segments</div>}
        <div>Host update preparation {renderMs.toFixed(1)} ms</div>
        {Object.entries(stats?.phases ?? {}).map(([phase, timing]) => <div key={phase}>
            {phase} · {timing.calls} calls · {timing.lastMs.toFixed(1)} ms last · {timing.maxMs.toFixed(1)} ms max
        </div>)}
        {stats?.jsHeapUsedBytes !== undefined && <div>WebView JavaScript heap {(stats.jsHeapUsedBytes / 2 ** 20).toFixed(1)} MiB · shared by the host context</div>}
        {profiler && profile && <>
            <div>{totalComponents} authored components · {profile.active} mounted{profile.visible !== undefined ? ` · ${profile.visible} visible` : ""}</div>
            <button type="button" onClick={() => setSample(profiler.snapshot())}>Refresh diagnostics</button>
            {profile.timings.map(item => <div key={item.phase}>{item.phase} · {item.count} events · {item.maxMs.toFixed(1)} ms max</div>)}
            {profile.slowest.map(item => <div key={item.id}>{item.id} ({item.type}) · {item.count} updates · {item.maxMs.toFixed(1)} ms max · {item.cause}</div>)}
        </>}
        {datasets.map(item => <div key={item.name}>
            {item.name} · {item.inputRowCount.toLocaleString()} → {item.outputRowCount.toLocaleString()} rows · {item.evaluationMs.toFixed(1)} ms · cache {item.cacheStatus}
        </div>)}
    </details>;
}
