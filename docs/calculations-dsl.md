# Calculations DSL

HyperPBI evaluates typed JSON expression objects. It never evaluates JavaScript or formula text.

## Three calculation scopes

1. **Root calculated fields** (`calculations.fields`) are validated and added to runtime rows before render/dataset evaluation.
2. **Root calculated metrics** (`calculations.metrics`) produce dashboard-wide scalar values in `calculatedMetrics`; metric grids can reference them with `metric`, and templates can use the `metric` namespace.
3. **Logical dataset operations** use the same expression evaluator for `derive` and a smaller metric set for grouped `metrics`. They run inside one named dataset and have dataset-local fields/lineage.

Do not describe a dataset metric as a root metric or a Power BI model measure.

## Expression leaves

```json
[
  { "field": "amount" },
  { "value": 100 },
  { "valueFromRow": "status" }
]
```

`valueFromRow` reads a known field from the clicked-row context and otherwise returns null. It is intended for safe event conditions, not arbitrary object access.

Operators accept `args` or conventional properties such as `left`/`right`, `condition`/`then`/`else`, `cases`, `date`, `amount`, and `unit`.

## Exact operators

| Group | Operators |
|---|---|
| Arithmetic | `+`, `-`, `*`, `/`, `%`, `round`, `floor`, `ceil`, `abs`, `min`, `max` |
| Comparison/Boolean | `=`, `!=`, `>`, `>=`, `<`, `<=`, `and`, `or`, `not` |
| Text | `concat`, `contains`, `startsWith`, `endsWith`, `lower`, `upper`, `trim`, `replace` |
| Date/time | `dateDiff`, `dateAdd`, `year`, `quarter`, `month`, `week`, `day`, `today`, `now` |
| Null/branching | `coalesce`, `isNull`, `isNotNull`, `if`, `case` |

Division by zero returns null and records a warning. Modulo by zero returns null. Invalid date differences return null with a warning. String predicates are case-insensitive; `replace` replaces all exact occurrences. `dateAdd` implements year, month, and otherwise day units. `dateDiff` implements hour, month (30.4375-day approximation), year (365.25-day approximation), and otherwise days.

## Root calculated fields

```json
{
  "calculations": {
    "fields": [
      {
        "key": "margin",
        "label": "Margin",
        "type": "number",
        "expression": {
          "op": "-",
          "left": { "field": "revenue" },
          "right": { "field": "cost" }
        }
      }
    ]
  }
}
```

Keys are required, use lowercase letters/numbers/underscore, start with a letter, and cannot collide with base fields or another calculated field. References may target base or calculated fields. Dependency cycles and unknown references are errors. Declared types are `number`, `text`, `boolean`, and `date`.

Current 2.0 preparation resolves component and logical-dataset fields against the bound/static dataset schemas before root calculated fields are applied at render time. A root calculated-field key is therefore not a Field Manifest alias and is not added to the preparation-time `powerbi` dataset schema. Do not use root calculated fields as new 2.0 component/dataset bindings; use dataset `derive` for that authoring contract. Root calculated fields remain an implemented runtime/compatibility surface.

## Root calculated metrics

Aggregations are:

- `count`, `countWhere`
- `sum`, `sumWhere`
- `avg`, `avgWhere`
- `min`, `max`, `distinctCount`
- `ratio`
- `percentOfTotal`

`where` filters rows using the same safe expression evaluator. `count`/`countWhere` return filtered row count. `*Where` removes the suffix and aggregates filtered rows. `ratio` recursively evaluates `numerator` and `denominator`, returning null for a zero denominator. `percentOfTotal` divides the sum of the filtered part by the sum across all rows.

Metric keys must be unique. Field/condition references are validated against base plus calculated fields.

Root metrics are consumed explicitly: `metricGrid.metrics[].metric` reads a calculated metric, and templates can use `{{metric.metricKey}}`. A KPI's normal `field` property does not automatically look up a root metric.

## Dataset derive and metrics

Dataset `derive` evaluates row expressions at the derive stage and creates origin `dataset-derived`. Dataset grouped metric operations are only `sum`, `avg`, `min`, `max`, `count`, `distinctCount`, and `first`; outputs have origin `dataset-metric`.

Dataset order is filter → derive → rename → select → groupBy/metrics → distinct → sort → limit. A dataset derive cannot use a field removed/renamed later as though the later stage ran first.

## Security and behavior

Expressions have no property traversal, assignment, loops, dynamic import, network access, DOM access, or function execution. Unknown operators return validation errors (and evaluate to null if reached). Calculation output never becomes a Power BI semantic-model field or automatic external-filter target.
