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
    | "uploaded-column"
    | "calculated-field"
    | "dataset-group"
    | "dataset-derived"
    | "dataset-metric";
