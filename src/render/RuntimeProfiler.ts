type Timing = { count: number; lastMs: number; maxMs: number };
type ComponentTiming = Timing & { type: string; visible: boolean; cause: string };

export class RuntimeProfiler {
    private readonly components = new Map<string, ComponentTiming>();
    private readonly elements = new Map<Element, string>();
    private readonly timings = new Map<string, Timing>();
    private visibility?: IntersectionObserver;
    private longTasks?: PerformanceObserver;

    start(): void {
        if (typeof IntersectionObserver !== "undefined") {
            this.visibility = new IntersectionObserver(entries => {
                for (const entry of entries) {
                    const id = this.elements.get(entry.target);
                    const timing = id === undefined ? undefined : this.components.get(id);
                    if (timing) timing.visible = entry.isIntersecting;
                }
            });
            for (const element of this.elements.keys()) this.visibility.observe(element);
        }
        if (typeof PerformanceObserver !== "undefined" && PerformanceObserver.supportedEntryTypes?.includes("longtask")) {
            this.longTasks = new PerformanceObserver(entries => {
                for (const entry of entries.getEntries()) this.recordDuration("Long tasks", entry.duration);
            });
            this.longTasks.observe({ type: "longtask" });
        }
    }

    attach(id: string, type: string, element: Element): void {
        this.elements.set(element, id);
        this.components.set(id, { type, count: 0, lastMs: 0, maxMs: 0, visible: false, cause: "Mount" });
        this.visibility?.observe(element);
    }

    detach(element: Element): void {
        const id = this.elements.get(element);
        if (id !== undefined) this.components.delete(id);
        this.elements.delete(element);
        this.visibility?.unobserve(element);
    }

    component(id: string, started: number, cause: string): void {
        const timing = this.components.get(id);
        if (!timing) return;
        timing.cause = cause;
        this.measure(timing, performance.now() - started);
    }

    record(phase: string, started: number): void {
        this.recordDuration(phase, performance.now() - started);
    }

    private recordDuration(phase: string, elapsed: number): void {
        const timing = this.timings.get(phase) ?? { count: 0, lastMs: 0, maxMs: 0 };
        this.measure(timing, elapsed);
        this.timings.set(phase, timing);
    }

    private measure(timing: Timing, elapsed: number): void {
        timing.count++;
        timing.lastMs = elapsed;
        timing.maxMs = Math.max(timing.maxMs, elapsed);
    }

    snapshot() {
        const active = [...this.components].map(([id, timing]) => ({ id, ...timing }));
        return {
            active: active.length,
            visible: this.visibility ? active.filter(item => item.visible).length : undefined,
            timings: Array.from(this.timings, ([phase, timing]) => ({ phase, ...timing })),
            slowest: active.sort((left, right) => right.maxMs - left.maxMs).slice(0, 15),
        };
    }

    dispose(): void {
        this.visibility?.disconnect();
        this.longTasks?.disconnect();
        this.elements.clear();
        this.components.clear();
        this.timings.clear();
    }
}
