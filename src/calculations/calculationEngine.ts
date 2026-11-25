import { lazyAggregates } from "../data/aggregations";
import { lazyMapBindings } from "../data/normalizeMapBindings";
import { NormalizedData } from "../data/normalizeData";
import { CalculationSpecification } from "./calculationTypes";
import { validateCalculations } from "./calculationValidator";
import { applyDerivedFields } from "./derivedFields";
import { calculateDerivedMetrics } from "./derivedMetrics";

export function applyCalculations(data: NormalizedData, specification?: CalculationSpecification): { data: NormalizedData; errors: string[]; warnings: string[] } {
    const validation = validateCalculations(specification, Object.keys(data.fields)); const errors = validation.filter(item => item.level === "error").map(item => `${item.path}: ${item.message}`);
    if (errors.length || (!specification?.fields?.length && !specification?.metrics?.length)) return { data, errors, warnings: [] };
    const derived = applyDerivedFields(data.rows, data.fields, specification.fields);
    return {
        data: {
            ...data,
            rows: derived.rows,
            rowKeys: data.rowKeys,
            fields: derived.fields,
            aggregates: derived.rows === data.rows ? data.aggregates : lazyAggregates(derived.rows),
            calculatedMetrics: calculateDerivedMetrics(derived.rows, specification.metrics),
            map: derived.rows === data.rows ? data.map : lazyMapBindings(
                derived.rows,
                derived.fields,
                undefined,
                undefined,
                data.rowKeys
            )
        },
        errors: [],
        warnings: derived.warnings
    };
}
