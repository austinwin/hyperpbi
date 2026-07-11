# HyperPBI logical data model

HyperPBI receives one normalized Power BI data view. Schema 2.0 can derive named logical datasets from that view; it does not claim direct access to independent model tables.

`data.datasets` supports `source`, `select`, `rename`, `filter`, `sort`, `groupBy`, `metrics`, `derive`, `distinct`, and `limit`. Sources are `powerbi` or another named dataset. Cycles and unknown sources are errors. Each dataset is evaluated once per render and cached by a stable content/definition signature.

Every output row carries original source-row lineage. Filters and derives retain the row lineage; groups and distinct values union lineage from contributing rows. Components select a dataset with `dataset`; omitted components use the Power BI data view. This lets derived visuals resolve interactions back to Power BI identities.

No SQL, joins, network datasets, recursive functions, or user JavaScript are supported. `derive` reuses the safe calculation expression language.
