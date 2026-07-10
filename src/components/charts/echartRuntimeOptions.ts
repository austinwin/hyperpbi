import type { EChartsInitOpts, SetOptionOpts } from "echarts/core";

const MIN_DEVICE_PIXEL_RATIO = 0.5;
const MAX_DEVICE_PIXEL_RATIO = 4;

export function normalizeEChartInitOptions(input?: EChartsInitOpts): EChartsInitOpts {
    const renderer = input?.renderer === "svg" ? "svg" : "canvas";
    const requestedRatio = Number(input?.devicePixelRatio);
    const devicePixelRatio = Number.isFinite(requestedRatio) && requestedRatio > 0
        ? Math.min(MAX_DEVICE_PIXEL_RATIO, Math.max(MIN_DEVICE_PIXEL_RATIO, requestedRatio))
        : undefined;

    return {
        ...input,
        renderer,
        ...(devicePixelRatio === undefined ? { devicePixelRatio: undefined } : { devicePixelRatio }),
        // Dirty-rectangle repainting corrupts ECharts canvases in the Power BI host.
        useDirtyRect: false,
    };
}

export function normalizeEChartSetOptionOptions(
    input?: SetOptionOpts,
    completeOption = true
): SetOptionOpts {
    return {
        ...input,
        ...(completeOption ? { notMerge: true } : {}),
        // Power BI updates and selection changes must be applied synchronously.
        lazyUpdate: false,
    };
}
