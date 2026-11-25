import type { EChartsCoreOption } from "echarts/core";

type RecordValue = Record<string, unknown>;
const record = (value: unknown): value is RecordValue => !!value && typeof value === "object" && !Array.isArray(value);

function same(left: unknown, right: unknown): boolean {
    if (Object.is(left, right)) return true;
    if (Array.isArray(left) && Array.isArray(right)) {
        return left.length === right.length && left.every((value, index) => same(value, right[index]));
    }
    if (!record(left) || !record(right)) return false;
    const keys = Object.keys(left);
    return keys.length === Object.keys(right).length && keys.every(key => Object.hasOwn(right, key) && same(left[key], right[key]));
}

function withoutData(section: RecordValue): RecordValue {
    const { data, ...style } = section;
    void data;
    return style;
}

/** Patch the data of one plain, still-compatible Cartesian series. An
 * undefined result requires the usual full replacement; an empty patch
 * means the plotted data and presentation are already current. */
export function cartesianDataPatch(previous: EChartsCoreOption, next: EChartsCoreOption): EChartsCoreOption | undefined {
    const { xAxis: previousX, yAxis: previousY, series: previousSeries, ...previousStyle } = previous as RecordValue;
    const { xAxis: nextX, yAxis: nextY, series: nextSeries, ...nextStyle } = next as RecordValue;
    if (!record(previousX) || !record(previousY) || !record(nextX) || !record(nextY) ||
        !Array.isArray(previousSeries) || previousSeries.length !== 1 || !record(previousSeries[0]) ||
        !Array.isArray(nextSeries) || nextSeries.length !== 1 || !record(nextSeries[0]) ||
        !["bar", "line"].includes(String(nextSeries[0].type)) ||
        !same(previousStyle, nextStyle) ||
        !same(withoutData(previousX), withoutData(nextX)) ||
        !same(withoutData(previousY), withoutData(nextY)) ||
        !same(withoutData(previousSeries[0]), withoutData(nextSeries[0]))) return undefined;
    const patch: RecordValue = {};
    if (!same(previousX.data, nextX.data)) {
        if (!Array.isArray(nextX.data)) return undefined;
        patch.xAxis = { data: nextX.data };
    }
    if (!same(previousY.data, nextY.data)) {
        if (!Array.isArray(nextY.data)) return undefined;
        patch.yAxis = { data: nextY.data };
    }
    if (!same(previousSeries[0].data, nextSeries[0].data)) {
        if (!Array.isArray(nextSeries[0].data)) return undefined;
        patch.series = [{ type: nextSeries[0].type, data: nextSeries[0].data }];
    }
    return patch;
}
