# HyperPBI logical data model

HyperPBI receives one normalized Power BI data view. Schema 2.0 can derive named logical datasets from that view; it does not claim direct access to independent model tables.

`data.datasets` supports `source`, `select`, `rename`, `filter`, `sort`, `groupBy`, `metrics`, `derive`, `distinct`, and `limit`. Sources are `powerbi` or another named dataset. Cycles and unknown sources are errors. Each dataset is evaluated once per render and cached by a stable content/definition signature.

HyperPBI resolves every dataset's output schema statically in the same order used by row evaluation: `filter`, `derive`, `rename`, `select`, `groupBy`/`metrics`, `distinct`, `sort`, and `limit`. Field references are checked at each stage. Derived and metric outputs therefore remain typed and addressable even when the source or result has zero rows.

Components validate against `component.dataset`, or against the base `powerbi` schema when it is omitted. Generated output names remain exactly as authored; base Power BI aliases resolve to canonical model-field keys. A field exposed by one named dataset is not automatically available in another.

Every output row carries original source-row lineage. Filters and derives retain the row lineage; groups and distinct values union lineage from contributing rows. Components select a dataset with `dataset`; omitted components use the Power BI data view. This lets derived visuals resolve interactions back to Power BI identities.

Model origin and visual semantics are separate. A visual query such as `Sum(Sales.Amount)` remains a model column with `queryAggregation: "sum"` and an underlying `Sales.Amount` target; a true model measure remains a measure. Renamed direct columns and group-by columns retain their model target. Derived fields and dataset metrics have no direct model-column target, so use selection/highlight or filter through a retained source column instead of external filter mode.

No SQL, joins, network datasets, recursive functions, or user JavaScript are supported. `derive` reuses the safe calculation expression language.
