export type RuntimePhase = "ingestion" | "validation" | "calculations" | "datasets" | "filtering" | "render";

export class RuntimePerformance {
    private readonly phases: Partial<Record<RuntimePhase, { calls: number; totalMs: number; lastMs: number; maxMs: number }>> = {};

    record(phase: RuntimePhase, started: number): void {
        const lastMs = performance.now() - started;
        const stats = this.phases[phase] ?? { calls: 0, totalMs: 0, lastMs: 0, maxMs: 0 };
        stats.calls++;
        stats.totalMs += lastMs;
        stats.lastMs = lastMs;
        stats.maxMs = Math.max(stats.maxMs, lastMs);
        this.phases[phase] = stats;
    }

    snapshot() {
        const memory = (performance as Performance & { memory?: { usedJSHeapSize: number; jsHeapSizeLimit: number } }).memory;
        return {
            phases: this.phases,
            jsHeapUsedBytes: memory?.usedJSHeapSize,
            jsHeapLimitBytes: memory?.jsHeapSizeLimit,
        };
    }
}
