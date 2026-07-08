# Universal interactions

Every component uses the same `interaction` policy and execution engine. Component adapters only provide a normalized payload (`componentId`, `componentType`, source `rowIndices`, `field`, `value`, and `operator`). The engine owns internal state, scoped filtering, Power BI selection/filter dispatch, clearing, and diagnostics.

```json
{
  "interaction": {
    "enabled": true,
    "trigger": "auto",
    "internalMode": "highlight",
    "internalScope": "self",
    "externalMode": "auto",
    "field": "__field_key__",
    "operator": "=",
    "value": "Open",
    "selectionMode": "replace",
    "multiSelect": true,
    "showSelector": false,
    "clearOnSecondClick": true
  }
}
```

`enabled` gates the component interaction. `trigger:"auto"` means change for controls and click for rows, points, features, items, navigation, content, and explicitly enabled layout/static components. `showSelector` only controls visible checkbox/radio UI; a table row remains clickable when it is false. Layout/background adapters support click and keyboard Enter/Space, and handled-event protection prevents a child action from triggering its parent.

## Internal behavior

Internal behavior affects HyperPBI only:

- `none`: no source highlight or internal filtering.
- `highlight`: retains data and displays selected styling.
- `filter`: creates an engine-owned interaction filter.

`internalScope:"self"` applies the filter only to the source component; `"others"` applies it to every component except the source; `"all"` applies it everywhere. Each component requests its applicable rows independently. Report/dashboard filters are applied first. External Power BI re-queries replace the source data and clear stale local interaction state.

If a source must remain visually unchanged, use `internalMode:"none"`. For Power BI data-point highlighting without a re-query, prefer `externalMode:"selection"`; an external JSON filter can cause Power BI to re-query HyperPBI, so local source preservation cannot be guaranteed.

## External behavior

External behavior affects Power BI only and is independent of internal behavior:

- `none`: do not propagate.
- `auto`: controls/slicers use JSON filters; table rows, matrix cells, chart points, map features, timelines, and other data items use exact selection identities.
- `selection`: call Selection Manager with exact source-row identities.
- `filter`: call `applyJsonFilter` with an explicit model-column field/value.

Basic `In` filters implement `=` and `in`; Advanced filters implement `contains`, comparisons, and `between`. Empty/All removes the filter. Calculated, measure-only, display-only, or fields lacking `sourceTable`/`sourceColumn` cannot externally filter. Tables never guess the first visible column; matrix/map/scatter/advanced-chart filter mode also requires an explicit unambiguous `interaction.field`.

Runtime Config defaults to `externalMode:"auto"`. Resolution priority is component `interaction.externalMode`, Runtime Config fallback, then the family auto default. `interactions.crossFilter:false` blocks external propagation only; internal behavior continues.

## Family examples

Control/slicer (Power BI filter, no local reaction):

```json
{"type":"select","id":"status","field":"__field_key__","interaction":{"enabled":true,"trigger":"auto","internalMode":"none","internalScope":"all","externalMode":"auto","operator":"=","selectionMode":"replace","multiSelect":false,"showSelector":false,"clearOnSecondClick":false}}
```

Table/data point (exact Power BI selection and local highlight):

```json
{"type":"table","id":"details","columns":["__field_key__"],"interaction":{"enabled":true,"trigger":"auto","internalMode":"highlight","internalScope":"self","externalMode":"auto","selectionMode":"replace","multiSelect":true,"showSelector":true,"clearOnSecondClick":true}}
```

Chart, matrix, map, and timeline use the same data-point policy. Static display/content/layout components use `{ "enabled": false, "internalMode": "none", "externalMode": "none" }` unless deliberately enabled with a usable field/value. Navigation retains its native action and optionally runs the universal interaction in addition.

Additional family patterns:

```json
{"type":"grid","id":"layout","interaction":{"enabled":true,"trigger":"click","internalMode":"none","internalScope":"self","externalMode":"none","selectionMode":"replace","multiSelect":false,"showSelector":false,"clearOnSecondClick":false},"children":[]}
{"type":"tabs","id":"views","interaction":{"enabled":true,"trigger":"click","internalMode":"none","internalScope":"self","externalMode":"none","selectionMode":"replace","multiSelect":false,"showSelector":false,"clearOnSecondClick":false},"tabs":[{"id":"overview","title":"Overview","children":[]}]}
{"type":"kpi","id":"metric","field":"__field_key__","aggregation":"first","interaction":{"enabled":false,"internalMode":"none","externalMode":"none"}}
{"type":"barChart","id":"chart","category":"__field_key__","measure":"__measure_field_key__","interaction":{"enabled":true,"trigger":"auto","internalMode":"highlight","internalScope":"self","externalMode":"auto","selectionMode":"replace","multiSelect":true,"showSelector":false,"clearOnSecondClick":true}}
{"type":"map","id":"locations","interaction":{"enabled":true,"trigger":"auto","internalMode":"highlight","internalScope":"self","externalMode":"auto","selectionMode":"replace","multiSelect":true,"showSelector":false,"clearOnSecondClick":true}}
{"type":"text","id":"note","text":"Context","interaction":{"enabled":false,"internalMode":"none","externalMode":"none"}}
```

Custom components retain safe `interactions.onClick` actions such as `selectWhere`. The resolver converts matches to the universal payload and then invokes the same engine. Put internal/external policy in the component-level `interaction` object.

## Legacy migration

Existing dashboards remain supported. When `interaction` is absent, HyperPBI normalizes legacy `external`, `internal`, table `selectable`, and table `selectionMode`. New specifications must use `interaction`; those legacy component properties are deprecated. Runtime Config is a global gate/fallback, not a component policy.
