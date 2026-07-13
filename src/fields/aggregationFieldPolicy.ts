import type { MetricDefinition } from "../schema/hyperpbiSchema";

export type Aggregation = NonNullable<MetricDefinition["aggregation"]>;
export type AggregationFieldPresence = "none" | "optional" | "required";

export interface AggregationFieldPolicy {
    aggregation: Aggregation;
    field: AggregationFieldPresence;
    fieldType: "any" | "numeric";
    whereField: AggregationFieldPresence;
    whereFieldType: "any";
}

const policies: Record<Aggregation, AggregationFieldPolicy> = {
    count: { aggregation: "count", field: "optional", fieldType: "any", whereField: "none", whereFieldType: "any" },
    distinctCount: { aggregation: "distinctCount", field: "required", fieldType: "any", whereField: "none", whereFieldType: "any" },
    first: { aggregation: "first", field: "required", fieldType: "any", whereField: "none", whereFieldType: "any" },
    countWhere: { aggregation: "countWhere", field: "optional", fieldType: "any", whereField: "required", whereFieldType: "any" },
    sum: { aggregation: "sum", field: "required", fieldType: "numeric", whereField: "none", whereFieldType: "any" },
    avg: { aggregation: "avg", field: "required", fieldType: "numeric", whereField: "none", whereFieldType: "any" },
    min: { aggregation: "min", field: "required", fieldType: "numeric", whereField: "none", whereFieldType: "any" },
    max: { aggregation: "max", field: "required", fieldType: "numeric", whereField: "none", whereFieldType: "any" },
};

export const supportedAggregations = Object.freeze(Object.keys(policies) as Aggregation[]);

export interface AggregationFieldRequirement {
    fieldRequired: boolean;
    requirement: "any" | "numeric";
}

/** Shared authoring requirement, including calculated-metric variants whose
 * runtime reduces to one of the primitive aggregateValue operations. */
export function aggregationFieldRequirement(aggregation: string | undefined, defaultAggregation: string): AggregationFieldRequirement {
    const effective = aggregation ?? defaultAggregation;
    if (["count", "countWhere", "ratio"].includes(effective)) return { fieldRequired: false, requirement: "any" };
    if (["sum", "avg", "min", "max", "sumWhere", "avgWhere", "percentOfTotal"].includes(effective)) return { fieldRequired: true, requirement: "numeric" };
    return { fieldRequired: true, requirement: "any" };
}

export function aggregationFieldPolicy(value: unknown, fallback: Aggregation = "sum"): AggregationFieldPolicy {
    const aggregation = typeof value === "string" && value in policies ? value as Aggregation : fallback;
    return policies[aggregation];
}
