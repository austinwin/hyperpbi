export type QueryAggregation =
    | "sum"
    | "avg"
    | "min"
    | "max"
    | "count"
    | "distinctCount"
    | "first";

export type FieldOrigin =
    | "powerbi-column"
    | "powerbi-measure"
    | "dataset-group"
    | "dataset-derived"
    | "dataset-metric";
