import { describe, expect, it } from "vitest";
import { generateClassBreaks } from "../src/maps/renderers/mapClassBreaks";
import { featureStyle } from "../src/maps/renderers/mapFeatureSymbol";

const resolveSymbol = (symbol: Record<string, unknown>) => symbol;
const generate = (values: number[], classes = 5, colorRamp = ["#1", "#2", "#3", "#4", "#5"]) =>
  generateClassBreaks({ method: "quantile", values, classes, colorRamp, resolveSymbol: resolveSymbol as never });

describe("small-sample map class breaks", () => {
  it("reduces requested classes to distinct values and ramp length", () => {
    const result = generate([1, 2], 5);
    expect(result.requestedClassCount).toBe(5);
    expect(result.effectiveClassCount).toBe(2);
    expect(result.breaks.every(item => Number.isFinite(item.min) && Number.isFinite(item.max))).toBe(true);
    expect(result.warnings.join(" ")).toContain("only 2");
    expect(generate([1, 2, 3], 5, ["#1", "#2"]).effectiveClassCount).toBe(2);
  });

  it("handles one repeated value and no finite values", () => {
    expect(generate([7, 7, 7]).breaks).toMatchObject([{ min: 7, max: 7 }]);
    const empty = generate([NaN, Infinity]);
    expect(empty.breaks).toEqual([]);
    expect(empty.effectiveClassCount).toBe(0);
  });

  it("collapses repeated quantile boundaries deterministically", () => {
    const result = generate([1, 1, 1, 1, 2, 3], 3);
    expect(result.effectiveClassCount).toBeLessThanOrEqual(3);
    expect(result.breaks.every((item, index) => index === 0 || item.min >= result.breaks[index - 1].max)).toBe(true);
  });

  it("uses finite equal intervals and includes the maximum without epsilon mutation", () => {
    const result = generateClassBreaks({
      method: "equalInterval",
      values: [0, 10],
      classes: 2,
      colorRamp: ["red", "blue"],
      resolveSymbol: resolveSymbol as never,
    });
    expect(result.breaks.at(-1)?.max).toBe(10);
    const style = featureStyle(
      {
        id: "max", layerId: "layer", geometryType: "point", geometry: null,
        lat: 0, lon: 0, serviceAttributes: {}, powerBiAttributes: { value: 10 },
        powerBiRowIndices: [], powerBiRowKeys: [], joinedAttributes: {}, selected: false,
      },
      { type: "classBreaks", field: "value", fieldSource: "powerbi", breaks: result.breaks },
    );
    expect(style.fillColor).toBe("blue");
  });
});
