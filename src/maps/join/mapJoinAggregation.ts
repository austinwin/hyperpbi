import type { MapJoinAggregation } from "../../schema/mapSchema";
import type { MapJoinAggregationDiagnostic } from "../model/resolvedMapTypes";

export interface NumericAggregationInput {
  valid: number[];
  discardedCount: number;
  blankCount: number;
}

export function isBlankAggregationValue(value: unknown): boolean {
  return (
    value === null ||
    value === undefined ||
    (typeof value === "string" && value.trim() === "")
  );
}

/** Numeric strings remain supported for compatibility, but blanks and non-finite values never coerce to zero. */
export function numericAggregationValues(
  values: readonly unknown[],
): NumericAggregationInput {
  const valid: number[] = [];
  let discardedCount = 0;
  let blankCount = 0;
  for (const value of values) {
    if (isBlankAggregationValue(value)) {
      blankCount++;
      continue;
    }
    if (typeof value === "number") {
      if (Number.isFinite(value)) valid.push(value);
      else discardedCount++;
      continue;
    }
    if (typeof value === "string") {
      const numeric = Number(value);
      if (Number.isFinite(numeric)) valid.push(numeric);
      else discardedCount++;
      continue;
    }
    discardedCount++;
  }
  return { valid, discardedCount, blankCount };
}

function stableValue(value: unknown): string {
  if (value instanceof Date) return `date:${value.toISOString()}`;
  if (Array.isArray(value)) return `[${value.map(stableValue).join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.entries(value as Record<string, unknown>)
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, child]) => `${JSON.stringify(key)}:${stableValue(child)}`)
      .join(",")}}`;
  return `${typeof value}:${String(value)}`;
}

export function aggregateMapJoinValues(
  aggregation: MapJoinAggregation,
  rawValues: readonly unknown[],
): { value: unknown; diagnostic: MapJoinAggregationDiagnostic } {
  const nonblank = rawValues.filter((value) => !isBlankAggregationValue(value));
  const numeric = numericAggregationValues(rawValues);
  let value: unknown = null;
  switch (aggregation.aggregation) {
    case "count":
      value = nonblank.length;
      break;
    case "distinctCount":
      value = new Set(nonblank.map(stableValue)).size;
      break;
    case "sum":
      value = numeric.valid.length
        ? numeric.valid.reduce((sum, item) => sum + item, 0)
        : null;
      break;
    case "avg":
      value = numeric.valid.length
        ? numeric.valid.reduce((sum, item) => sum + item, 0) / numeric.valid.length
        : null;
      break;
    case "min":
      value = numeric.valid.length ? Math.min(...numeric.valid) : null;
      break;
    case "max":
      value = numeric.valid.length ? Math.max(...numeric.valid) : null;
      break;
    case "first":
      value = nonblank[0] ?? null;
      break;
    case "last":
      value = nonblank.at(-1) ?? null;
      break;
  }
  const numericAggregation = ["sum", "avg", "min", "max"].includes(
    aggregation.aggregation,
  );
  return {
    value,
    diagnostic: {
      alias: aggregation.as,
      field: aggregation.field,
      aggregation: aggregation.aggregation,
      inputCount: rawValues.length,
      validCount: numericAggregation ? numeric.valid.length : nonblank.length,
      blankCount: numeric.blankCount,
      discardedCount: numericAggregation ? numeric.discardedCount : 0,
    },
  };
}
