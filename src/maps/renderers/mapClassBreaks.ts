import type { MapSymbolDefinition } from "../../schema/mapSchema";
import type {
  ClassBreakResult,
  ResolvedClassBreak,
  ResolvedMapSymbol,
} from "../model/resolvedMapTypes";

export interface ClassBreakInput {
  method?: "equalInterval" | "quantile" | "manual";
  classes?: number;
  breaks?: Array<{
    min: number;
    max: number;
    label?: string;
    symbol: MapSymbolDefinition;
  }>;
  colorRamp?: string[];
  values: number[];
  resolveSymbol: (symbol: MapSymbolDefinition) => ResolvedMapSymbol;
}

export function generateClassBreaks(input: ClassBreakInput): ClassBreakResult {
  const finiteValues = input.values.filter(Number.isFinite).sort((a, b) => a - b);
  const distinctValues = Array.from(new Set(finiteValues));
  const requestedClassCount = Math.max(1, Math.floor(input.classes ?? input.colorRamp?.length ?? 5));
  const warnings: string[] = [];

  if (input.breaks?.length) {
    const breaks: ResolvedClassBreak[] = [];
    let previousMax = -Infinity;
    input.breaks.forEach((entry, index) => {
      if (!Number.isFinite(entry.min) || !Number.isFinite(entry.max) || entry.min > entry.max) {
        warnings.push(`Manual class ${index + 1} has invalid finite boundaries and was ignored.`);
        return;
      }
      if (entry.min < previousMax)
        warnings.push(`Manual class ${index + 1} overlaps the preceding class.`);
      previousMax = entry.max;
      breaks.push({
        min: entry.min,
        max: entry.max,
        maxInclusive: true,
        label: entry.label,
        symbol: input.resolveSymbol(entry.symbol),
      });
    });
    return {
      breaks,
      requestedClassCount: input.breaks.length,
      effectiveClassCount: breaks.length,
      validValueCount: finiteValues.length,
      distinctValueCount: distinctValues.length,
      warnings,
    };
  }

  if (!finiteValues.length || !input.colorRamp?.length) {
    if (!finiteValues.length) warnings.push("No finite numeric values were available.");
    if (!input.colorRamp?.length) warnings.push("No class-break color ramp was available.");
    return {
      breaks: [],
      requestedClassCount,
      effectiveClassCount: 0,
      validValueCount: finiteValues.length,
      distinctValueCount: distinctValues.length,
      warnings,
    };
  }

  const targetCount = Math.min(
    requestedClassCount,
    input.colorRamp.length,
    distinctValues.length,
  );
  if (targetCount < requestedClassCount)
    warnings.push(
      `Requested ${requestedClassCount} classes but only ${targetCount} were supported by the color ramp and ${distinctValues.length} distinct values.`,
    );

  let boundaries: number[];
  const minimum = finiteValues[0];
  const maximum = finiteValues.at(-1)!;
  if (targetCount === 1 || minimum === maximum) boundaries = [minimum, maximum];
  else if (input.method === "equalInterval") {
    const interval = (maximum - minimum) / targetCount;
    boundaries = Array.from(
      { length: targetCount + 1 },
      (_unused, index) => (index === targetCount ? maximum : minimum + interval * index),
    );
  } else {
    boundaries = [minimum];
    for (let index = 1; index < targetCount; index++) {
      const cut = Math.min(
        finiteValues.length - 1,
        Math.max(1, Math.ceil((index / targetCount) * finiteValues.length)),
      );
      const lower = finiteValues[cut - 1];
      const upper = finiteValues[cut];
      boundaries.push(
        lower === upper ? lower : lower + (upper - lower) / 2,
      );
    }
    boundaries.push(maximum);
    const collapsed = boundaries.filter(
      (boundary, index) => index === 0 || boundary !== boundaries[index - 1],
    );
    if (collapsed.length !== boundaries.length)
      warnings.push(
        `Repeated quantile boundaries reduced the result from ${targetCount} to ${Math.max(1, collapsed.length - 1)} classes.`,
      );
    boundaries = collapsed.length === 1 ? [collapsed[0], collapsed[0]] : collapsed;
  }

  const breaks: ResolvedClassBreak[] = [];
  for (let index = 0; index < boundaries.length - 1; index++) {
    const min = boundaries[index];
    const max = boundaries[index + 1];
    if (!Number.isFinite(min) || !Number.isFinite(max) || min > max) continue;
    const color = input.colorRamp[Math.min(index, input.colorRamp.length - 1)];
    breaks.push({
      min,
      max,
      maxInclusive: index === boundaries.length - 2,
      symbol: input.resolveSymbol({ color, fillColor: color }),
    });
  }
  return {
    breaks,
    requestedClassCount,
    effectiveClassCount: breaks.length,
    validValueCount: finiteValues.length,
    distinctValueCount: distinctValues.length,
    warnings,
  };
}
