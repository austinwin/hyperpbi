# HyperPBI Calculation DSL

Derived fields and metrics using validated JSON expressions. No JavaScript, functions, or eval. Expressions are typed JSON objects.

## Field Definitions

```json
{
  "calculations": {
    "fields": [
      {
        "key": "profit_margin",
        "expression": {
          "op": "/",
          "left": { "field": "revenue" },
          "right": { "field": "cost" }
        }
      }
    ]
  }
}
```

## Metric Definitions

```json
{
  "metrics": [
    {
      "key": "total_revenue",
      "aggregation": "sum",
      "field": "revenue"
    },
    {
      "key": "open_count",
      "aggregation": "countWhere",
      "field": "status",
      "where": { "field": "status", "equals": "Open" }
    }
  ]
}
```

## Operators

### Arithmetic
`+`, `-`, `*`, `/`, `%`, `round`, `floor`, `ceil`, `abs`, `min`, `max`

### Comparison
`=`, `!=`, `>`, `>=`, `<`, `<=`

### Boolean
`and`, `or`, `not`

### Text
`concat`, `contains`, `startsWith`, `endsWith`, `lower`, `upper`, `trim`, `replace`

### Date
`dateDiff`, `dateAdd`, `year`, `quarter`, `month`, `week`, `day`, `today`, `now`

### Null
`coalesce`, `isNull`, `isNotNull`

### Conditional
`if`, `case`

## Aggregations

| Aggregation | Description |
|------------|-------------|
| `count` | Row count |
| `sum` | Sum of values |
| `avg` | Average of values |
| `min` | Minimum value |
| `max` | Maximum value |
| `distinctCount` | Count of distinct values |
| `countWhere` | Count rows matching condition |
| `sumWhere` | Sum where condition matches |
| `avgWhere` | Average where condition matches |
| `ratio` | Ratio of two aggregations |
| `percentOfTotal` | Percentage of total |
| `first` | First value |
| `last` | Last value |

## Where Calculated Values Can Be Used

- KPI cards
- Metric grids
- Charts (category, measure, value)
- Tables (columns)
- Matrix values
- Map renderer values
- Template tokens: `{{metric.key}}`

## Limitations

- Calculated fields are computed in the HyperPBI engine, not in Power BI
- They do not participate in Power BI external filters
- They can feed internal rendering (styling, labels, popups)
- Calculation keys must not collide with physical normalized field keys
- Expressions do not execute inside ArcGIS REST services
- Circular dependencies are detected and reported
