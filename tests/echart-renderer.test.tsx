import { h, render } from "preact";
import { act } from "preact/test-utils";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const runtime = vi.hoisted(() => {
    const charts: Array<{
        setOption: ReturnType<typeof vi.fn>;
        resize: ReturnType<typeof vi.fn>;
        dispose: ReturnType<typeof vi.fn>;
        dispatchAction: ReturnType<typeof vi.fn>;
        isDisposed: () => boolean;
        handlers: Record<string, (params: Record<string, unknown>) => void>;
    }> = [];
    const init = vi.fn(() => {
        let disposed = false;
        const handlers: Record<string, (params: Record<string, unknown>) => void> = {};
        const chart = {
            setOption: vi.fn(), resize: vi.fn(), dispatchAction: vi.fn(), handlers,
            dispose: vi.fn(() => { disposed = true; }),
            isDisposed: () => disposed,
            on: vi.fn((name: string, handler: (params: Record<string, unknown>) => void) => { handlers[name] = handler; }),
        };
        charts.push(chart);
        return chart;
    });
    return { charts, init, use: vi.fn(), getInstanceByDom: vi.fn(() => undefined) };
});

vi.mock("echarts/core", () => ({
    init: runtime.init,
    use: runtime.use,
    getInstanceByDom: runtime.getInstanceByDom,
}));

import { EChartRenderer } from "../src/components/charts/EChartRenderer";
import { normalizeEChartInitOptions, normalizeEChartSetOptionOptions } from "../src/components/charts/echartRuntimeOptions";

describe("Power BI ECharts runtime options", () => {
    it("forces safe init and synchronous update settings without mutating author JSON", () => {
        const init = { useDirtyRect: true, devicePixelRatio: 99 };
        const setOption = { notMerge: false, lazyUpdate: true };
        expect(normalizeEChartInitOptions(init)).toMatchObject({ renderer: "canvas", useDirtyRect: false, devicePixelRatio: 4 });
        expect(normalizeEChartSetOptionOptions(setOption, true)).toMatchObject({ notMerge: true, lazyUpdate: false });
        expect(normalizeEChartSetOptionOptions(setOption, false)).toMatchObject({ notMerge: false, lazyUpdate: false });
        expect(init).toEqual({ useDirtyRect: true, devicePixelRatio: 99 });
        expect(setOption).toEqual({ notMerge: false, lazyUpdate: true });
    });
});

describe("EChartRenderer lifecycle", () => {
    let resizeCallbacks: Array<() => void>;
    let animationFrames: Map<number, FrameRequestCallback>;
    let nextFrame: number;

    beforeEach(() => {
        runtime.charts.length = 0;
        runtime.init.mockClear();
        runtime.getInstanceByDom.mockReset();
        runtime.getInstanceByDom.mockReturnValue(undefined);
        resizeCallbacks = [];
        animationFrames = new Map();
        nextFrame = 1;
        vi.stubGlobal("ResizeObserver", class {
            constructor(callback: () => void) { resizeCallbacks.push(callback); }
            observe() {}
            disconnect() {}
        });
        vi.stubGlobal("requestAnimationFrame", (callback: FrameRequestCallback) => {
            const id = nextFrame++;
            animationFrames.set(id, callback);
            return id;
        });
        vi.stubGlobal("cancelAnimationFrame", (id: number) => animationFrames.delete(id));
    });

    afterEach(() => {
        vi.unstubAllGlobals();
        document.body.replaceChildren();
    });

    const flushFrames = () => {
        const pending = [...animationFrames.entries()];
        animationFrames.clear();
        for (const [id, callback] of pending) callback(id);
    };

    it("keeps one instance for ordinary option changes and applies complete replacement", () => {
        const host = document.createElement("div");
        act(() => render(h(EChartRenderer, { option: { series: [{ type: "bar", data: [1] }] }, initOptions: { useDirtyRect: true } }), host));
        expect(runtime.init).toHaveBeenCalledWith(expect.any(HTMLElement), undefined, expect.objectContaining({ renderer: "canvas", useDirtyRect: false }));
        expect(runtime.charts[0].setOption).toHaveBeenCalledWith(expect.anything(), expect.objectContaining({ notMerge: true, lazyUpdate: false }));
        act(() => render(h(EChartRenderer, { option: { series: [{ type: "line", data: [2] }] }, initOptions: { useDirtyRect: true } }), host));
        expect(runtime.init).toHaveBeenCalledTimes(1);
        expect(runtime.charts[0].setOption).toHaveBeenCalledTimes(2);
    });

    it("coalesces observer updates, cancels pending work, and disposes once", () => {
        const host = document.createElement("div");
        act(() => render(h(EChartRenderer, { option: {} }), host));
        flushFrames();
        resizeCallbacks[0](); resizeCallbacks[0](); resizeCallbacks[0]();
        expect(animationFrames.size).toBe(1);
        flushFrames();
        expect(runtime.charts[0].resize).toHaveBeenCalledTimes(2);
        resizeCallbacks[0]();
        act(() => render(null, host));
        expect(animationFrames.size).toBe(0);
        expect(runtime.charts[0].dispose).toHaveBeenCalledTimes(1);
    });

    it("disposes an unexpected existing instance before initializing", () => {
        const unexpected = { dispose: vi.fn(), isDisposed: () => false };
        runtime.getInstanceByDom.mockReturnValue(unexpected as never);
        const host = document.createElement("div");
        act(() => render(h(EChartRenderer, { option: {} }), host));
        expect(unexpected.dispose).toHaveBeenCalledTimes(1);
        act(() => render(null, host));
    });

    it("keeps click multi-select and persistent selection independent of hover", () => {
        const host = document.createElement("div");
        const onDataIndex = vi.fn();
        act(() => render(h(EChartRenderer, { option: {}, selectedDataIndices: [2], selectionSeriesIndex: 0, onDataIndex }), host));
        expect(runtime.charts[0].dispatchAction).toHaveBeenCalledWith({ type: "select", seriesIndex: 0, dataIndex: 2 });
        expect(runtime.charts[0].dispatchAction).not.toHaveBeenCalledWith(expect.objectContaining({ type: "highlight" }));
        runtime.charts[0].handlers.click({ dataIndex: 3, event: { event: { ctrlKey: true } } });
        expect(onDataIndex).toHaveBeenCalledWith(3, expect.objectContaining({ multiSelect: true }));
        act(() => render(h(EChartRenderer, { option: {}, selectedDataIndices: [4], selectionSeriesIndex: 0, onDataIndex }), host));
        expect(runtime.charts[0].dispatchAction).toHaveBeenCalledWith({ type: "unselect", seriesIndex: 0, dataIndex: 2 });
        expect(runtime.charts[0].dispatchAction).toHaveBeenCalledWith({ type: "select", seriesIndex: 0, dataIndex: 4 });
    });

    it("does not guess a series for advanced multi-series selection", () => {
        const host = document.createElement("div");
        act(() => render(h(EChartRenderer, { option: {}, completeOption: false, setOptionOptions: { notMerge: false, lazyUpdate: true }, selectedDataIndices: [1] }), host));
        expect(runtime.charts[0].setOption).toHaveBeenCalledWith({}, expect.objectContaining({ notMerge: false, lazyUpdate: false }));
        expect(runtime.charts[0].dispatchAction).not.toHaveBeenCalled();
    });

    it("emits full ECharts data context and highlights exact series/data types", () => {
        const host = document.createElement("div"); const onDataPoint = vi.fn();
        act(() => render(h(EChartRenderer, { option: {}, selectedDataPoints: [{ seriesIndex: 2, dataIndex: 4, dataType: "edge" }], onDataPoint }), host));
        expect(runtime.charts[0].dispatchAction).toHaveBeenCalledWith({ type: "highlight", seriesIndex: 2, dataIndex: 4, dataType: "edge" });
        runtime.charts[0].handlers.click({ seriesIndex: 2, dataIndex: 4, seriesType: "sankey", seriesName: "Flow", dataType: "edge", name: "A", value: 12, event: { event: { metaKey: true } } });
        expect(onDataPoint).toHaveBeenCalledWith(expect.objectContaining({ seriesIndex: 2, dataIndex: 4, seriesType: "sankey", dataType: "edge", multiSelect: true }));
        act(() => render(h(EChartRenderer, { option: {}, selectedDataPoints: [], onDataPoint }), host));
        expect(runtime.charts[0].dispatchAction).toHaveBeenCalledWith({ type: "downplay", seriesIndex: 2, dataIndex: 4, dataType: "edge" });
    });
});
