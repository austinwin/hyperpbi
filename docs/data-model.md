# HyperPBI data model

HyperPBI receives one normalized Power BI data view, augments its static schema with validated root calculated-field metadata, applies those fields to rows at runtime, and evaluates named in-memory logical datasets. Dataset schemas therefore expose calculated fields to chained select/derive/group/metrics operations even when the current data view has zero rows. Root scalar metrics remain separate from row fields. HyperPBI never queries SQL, joins arbitrary sources, downloads a dataset, or executes user code.

## Base `powerbi` dataset

The built-in dataset name is `powerbi`. It contains normalized rows, stable row keys, field metadata, Power BI selection identities when supplied, calculated aggregates, and normalized map bindings/warnings.

Normalized field metadata includes canonical key, display/query/qualified names, source table/column, type, kind, data type, format, Power BI roles, query aggregation, implicit-aggregation flag, origin, and selection/filter capability.

New 2.0 JSON uses Field Manifest aliases. Preparation resolves aliases in dataset definitions and component bindings to canonical keys before evaluation. A component without `dataset` uses `powerbi`.

## Named dataset definition

`data.datasets` maps a name to:

| Property | Type | Contract |
|---|---|---|
| `source` | string | Required: `powerbi` or another named dataset |
| `filter` | object or array | `{field, operator, value}`; all filters must pass |
| `derive` | expression record | Adds/replaces row fields using the safe calculation DSL |
| `rename` | record | Old field → nonblank new field |
| `select` | string array | Keeps only listed fields |
| `groupBy` | string array | Produces one output row per group |
| `metrics` | metric record | Named grouped aggregates |
| `distinct` | Boolean or string array | Deduplicates by all fields or selected fields |
| `sort` | array | `{field,direction}`; direction `ascending|descending|asc|desc` |
| `limit` | nonnegative integer | Keeps the first N rows after sorting |

Dataset metric operations are `sum`, `avg`, `min`, `max`, `count`, `distinctCount`, and `first`. Every operation except `count` requires a field. `sum` and `avg` require a numeric or statically unknown field.

Filter operators are `=`, `!=`, `>`, `>=`, `<`, `<=`, `contains`, `in`, and `between`.

## Exact operation order

The runtime evaluator and static schema propagation use the same field-stage order after the source is resolved:

1. `filter`
2. `derive`
3. `rename`
4. `select`
5. `groupBy` and `metrics`
6. `distinct`
7. `sort`
8. `limit`

This matters. A filter cannot reference a field first created by the same dataset's derive stage. A derive can use source/filter-stage fields. Rename changes keys before select/grouping. Grouping replaces the row schema with group fields plus metrics. Distinct and sort validate against that resulting schema.

Source chains apply a complete definition at each link. Thus a second dataset can filter or derive from fields produced by its source dataset.

## Static schemas and validation

`resolveDatasetSchemas` always registers `powerbi` first, then resolves named datasets in sorted name order while recursively resolving dependencies.

At every operation stage it validates field references against fields currently available:

- filter fields exist in the source schema
- each derive expression validates `field` and `valueFromRow` references before adding its output
- rename sources exist; targets are nonblank and may not collide with another output
- select fields exist, then all unselected fields disappear
- group-by fields and metric fields exist
- a metric name may not collide with a group field
- distinct and sort fields exist in the grouped/selected output

Generated field type inference is static:

- arithmetic, rounding, date-part, and date-difference operators → number
- comparisons, Boolean operators, string predicates, and null tests → Boolean
- string operators → text
- `today`, `now`, and `dateAdd` → datetime
- `coalesce`, `if`, and `case` retain a type only when their known branches agree
- `sum`, `avg`, `count`, and `distinctCount` metrics → number
- `min`, `max`, and `first` inherit their input type

Derived fields have origin `dataset-derived`; metrics `dataset-metric`; group fields `dataset-group`. Rename copies all other source metadata, so a renamed direct model column still has its model origin and target. Select also retains metadata.

## Sources, cycles, and unknown names

A source may be `powerbi` or another named dataset. Unknown source names produce `UNKNOWN_DATASET` diagnostics. Recursive resolution tracks the current chain; a repeated name produces `DATASET_CYCLE` with the cycle path. A failed/cyclic dataset is not made available to components, and a component selecting it receives an unknown-dataset diagnostic.

## Runtime evaluation details

Rows begin as shallow copies of source rows with lineage arrays:

- filter removes rows/lineage together
- derive evaluates fields in object-entry order against the progressively updated row
- rename moves values and deletes old keys
- select copies only selected entries
- grouping canonicalizes group values, calculates metrics, and unions sorted unique lineage from every member
- distinct canonicalizes selected/all values, keeps the first row, and unions lineage of duplicates
- sort compares string forms with locale numeric ordering and preserves earlier order when all sort keys compare equal
- limit floors the nonnegative value and slices the final array; zero returns zero rows

`count` counts group rows without a field. Other metric implementations use the shared aggregate functions.

## Zero-row behavior

Runtime type inference alone cannot describe an empty result, so each evaluated dataset receives the statically propagated schema. A filter or `limit: 0` can therefore return no rows while components still validate against known derived, renamed, grouped, and metric fields.

Fields with statically unknown types can be refined from nonempty runtime rows. An unknown field becomes a measure-like field when observed values are finite numbers.

## Row lineage and interactions

Every output row carries a sorted unique array of contributing base source-row indices. Runtime row keys use the corresponding source row keys joined with `|`. A row with no source lineage receives a deterministic dataset-local fallback key.

Lineage enables a chart point, table row, map feature, or grouped dataset row to select the contributing Power BI identities when those identities exist. It does not make a derived field or metric a semantic-model column.

External selection and external filtering are separate:

- **selection** uses source identities/lineage and can represent a grouped output by selecting its contributing base rows
- **filtering** constructs a Power BI JSON filter and requires a real model column with source table/column metadata

Dataset metrics and derived fields cannot directly filter Power BI. Renamed direct columns and group-by direct columns may retain a valid external-filter target. Identity selection remains unavailable when the Power BI host supplied no identities.

### Map layer dataset scope

Every map layer resolves a separate logical view using `layer.dataset`, then the map component dataset, then `powerbi`. Source bindings, renderer/label/popup/tooltip fields, visibility/filter fields, interaction fields, and the Power BI side of an ArcGIS join all use that view's rows and schema. A grouped map feature can therefore carry multiple contributing source row indices and row identities.

This does not create independent Power BI queries. The custom visual still receives one flattened data view; fields may originate from related model tables, but the visual query and semantic-model relationships determine row grain and combinations. Logical datasets only transform the received rows.

## Cache signatures

The evaluator builds canonical JSON-like signatures with object keys sorted. The base signature includes row keys, rows, field keys, and base lineage. A named dataset signature includes its definition, its input signature, and static fields.

The caller-provided cache is keyed by that signature. A hit reuses the result, reports `cacheStatus: "hit"`, and sets evaluation time to zero. A miss records input/output row count, elapsed time, unique lineage count, and schema/evaluation warnings.

## Complete 2.0 example

The example uses aliases from a hypothetical Field Manifest: `region`, `status`, `revenue`, and `cost`.

```json
{
  "version": "2.0",
  "title": "Regional revenue",
  "data": {
    "datasets": {
      "activeRows": {
        "source": "powerbi",
        "filter": {
          "field": "status",
          "operator": "!=",
          "value": "Cancelled"
        },
        "derive": {
          "margin": {
            "op": "-",
            "left": { "field": "revenue" },
            "right": { "field": "cost" }
          }
        },
        "rename": { "region": "area" },
        "select": ["area", "revenue", "margin"]
      },
      "areaSummary": {
        "source": "activeRows",
        "groupBy": ["area"],
        "metrics": {
          "totalRevenue": { "op": "sum", "field": "revenue" },
          "totalMargin": { "op": "sum", "field": "margin" },
          "recordCount": { "op": "count" }
        },
        "sort": [
          { "field": "totalRevenue", "direction": "descending" }
        ],
        "limit": 20
      }
    }
  },
  "components": [
    {
      "type": "barChart",
      "id": "revenue_by_area",
      "title": "Revenue by area",
      "dataset": "areaSummary",
      "category": "area",
      "measure": "totalRevenue",
      "aggregation": "sum",
      "interaction": {
        "enabled": true,
        "internalMode": "highlight",
        "externalMode": "selection",
        "selectionMode": "replace"
      }
    }
  ]
}
```

The component can identity-select contributing Power BI rows through lineage. It must not use `totalRevenue` as `interaction.field` with external filter mode because `totalRevenue` is a dataset metric.

## Preloaded multi-resolution chart drill

Hierarchical chart drill is a view switch across declared logical datasets, not an on-demand query. Define one bounded dataset per resolution, retain source lineage through every group, and reference them in the chart's ordered `drill.levels`. The first level has no `parentField`; each child level names the field in its own dataset that equals the selected parent category.

```json
{
  "type": "barChart",
  "id": "operational_drill",
  "drill": {
    "trigger": "doubleClick",
    "showBreadcrumbs": true,
    "levels": [
      {"id":"region","dataset":"byRegion","category":"region","measure":"amount"},
      {"id":"facility","dataset":"byFacility","category":"facility","measure":"amount","parentField":"region"}
    ]
  }
}
```

The runtime filters the already-prepared child view by the breadcrumb path and maps chart points back through dataset lineage. Missing datasets/fields, duplicate level IDs, an unknown initial level, or fewer than two levels fail strict validation. Because every resolution is prepared up front, navigation is deterministic, offline, and subject to the same dataset row and calculation limits as the rest of HyperPBI.

## Deliberately unsupported data features

- SQL or DAX text execution
- arbitrary joins/unions
- network/file data sources
- user JavaScript/functions
- mutation of the Power BI semantic model
- treating a dataset metric as a model measure
- direct Power BI filters on derived/metric outputs

These boundaries keep evaluation deterministic, inspectable, and safe inside the custom visual.
