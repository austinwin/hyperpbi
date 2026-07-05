import { calculateAggregates } from "../data/aggregations";
import { normalizeMapBindings } from "../data/normalizeMapBindings";
import { NormalizedData } from "../data/normalizeData";
import { CalculationSpecification } from "./calculationTypes";
import { validateCalculations } from "./calculationValidator";
import { applyDerivedFields } from "./derivedFields";
import { calculateDerivedMetrics } from "./derivedMetrics";

export function applyCalculations(data: NormalizedData, specification?: CalculationSpecification): { data: NormalizedData; errors: string[]; warnings: string[] } {
    const validation = validateCalculations(specification, Object.keys(data.fields)); const errors = validation.filter(item => item.level === "error").map(item => `${item.path}: ${item.message}`);
    if (errors.length || !specification) return { data, errors, warnings: [] };
    const derived = applyDerivedFields(data.rows, data.fields, specification.fields);
    return { data: { ...data, rows: derived.rows, fields: derived.fields, aggregates: calculateAggregates(derived.rows), calculatedMetrics: calculateDerivedMetrics(derived.rows, specification.metrics), map: normalizeMapBindings(derived.rows, derived.fields) }, errors: [], warnings: derived.warnings };
}
