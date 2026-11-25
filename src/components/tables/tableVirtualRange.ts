export const TABLE_ROW_HEIGHT = 31;
export const TABLE_OVERSCAN_ROWS = 8;
// Keep virtual spacers below browser layout limits, including tall rows.
const MAX_SCROLL_TRACK_HEIGHT = 16_000_000;

export interface TableVirtualRange {
    start: number;
    end: number;
    topSpacer: number;
    bottomSpacer: number;
}

export function tableVirtualRange(
    rowCount: number,
    scrollTop: number,
    viewportHeight: number,
    rowHeight = TABLE_ROW_HEIGHT,
    overscan = TABLE_OVERSCAN_ROWS,
): TableVirtualRange {
    if (rowCount <= 0) return { start: 0, end: 0, topSpacer: 0, bottomSpacer: 0 };
    const safeHeight = Math.max(rowHeight, viewportHeight);
    const visibleCount = Math.ceil(safeHeight / rowHeight);
    const logicalHeight = rowCount * rowHeight;
    const trackHeight = Math.min(logicalHeight, MAX_SCROLL_TRACK_HEIGHT);
    const physicalTop = Math.min(Math.max(0, scrollTop), Math.max(0, trackHeight - safeHeight));
    const compressed = trackHeight < logicalHeight;
    const logicalTop = compressed ? physicalTop * (logicalHeight - safeHeight) / (trackHeight - safeHeight) : physicalTop;
    const rawStart = Math.min(Math.max(0, rowCount - visibleCount), Math.floor(logicalTop / rowHeight));
    const start = Math.max(0, Math.min(rowCount, rawStart - overscan));
    const end = Math.max(start, Math.min(rowCount, rawStart + visibleCount + overscan));
    const topSpacer = compressed ? Math.max(0, Math.round(physicalTop - (rawStart - start) * rowHeight)) : start * rowHeight;
    return {
        start,
        end,
        topSpacer,
        bottomSpacer: Math.max(0, trackHeight - topSpacer - (end - start) * rowHeight),
    };
}
