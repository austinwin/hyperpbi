# Interactions

Root calculated fields can participate in internal filtering/highlighting and retain contributing source-row lineage for identity selection. They cannot directly become Power BI model filters; the exact runtime reason is `calculated field has no direct Power BI model filter target`.

HyperPBI has three independent declarative systems. A component may use none, one, or more of them; an interaction object is not required on every component.

## 1. UI actions

`uiAction` changes interface state and never directly sends a Power BI selection/filter:

| Type | Required/important values |
|---|---|
| `clearFilters` | none |
| `setTab` | `target`, `value` |
| `setState` | `target`, `value` |
| `toggleState` | `target` |
| `toggleSidebar` | none |
| `openOverlay`, `closeOverlay`, `toggleOverlay` | existing overlay `target` |
| `setStep` | `target`, `value` |
| `nextStep`, `previousStep` | `target` |
| `showToast` | `message`; optional title/intent/duration |
| `dismissToast` | toast `target` |
| `scrollTo` | component `target` |
| `refresh` | safe successful no-op; Power BI owns refresh |

Toast duration is persistent when omitted/zero, otherwise clamped to 1–30 seconds. UI actions are executed as data, never code. Overlay targets must exist.

## 2. Universal interaction

```json
{
  "interaction": {
    "enabled": true,
    "trigger": "auto",
    "internalMode": "highlight",
    "internalScope": "self",
    "externalMode": "auto",
    "field": "status",
    "operator": "=",
    "selectionMode": "replace",
    "multiSelect": true,
    "showSelector": false,
    "clearOnSecondClick": true
  }
}
```

Exact enums:

- `trigger`: `auto|click|change`
- `internalMode`: `none|highlight|filter`
- `internalScope`: `self|others|all`
- `externalMode`: `none|auto|selection|filter`
- `operator`: `=|!=|>|>=|<|<=|contains|in|between`
- `selectionMode`: `replace|toggle|add`

`auto` trigger resolves to change for controls and click otherwise. `auto` external mode resolves to filter for controls and selection for data-point/custom components.

### Internal modes

- `none`: no HyperPBI highlight/filter
- `highlight`: records selected source rows/keys; scope decides whether self, others, or all components consume the highlight
- `filter`: adds a scoped internal field/value filter, or a source-row-key filter when no field payload exists

`selectionMode` replaces, toggles, or adds matching row keys. With replace mode, a modifier gesture can toggle. `clearOnSecondClick` compares a stable signature of component, field, operator, value, and sorted row keys.

`showSelector` only controls table selector UI; row clicks still work whenever interaction is enabled.

### External selection

Selection uses exact Power BI identities for source row indices. For a logical dataset, each output row carries source lineage; selecting a grouped/distinct row can select every contributing base identity. Selection is unavailable when the host/data view supplied no identities.

### External filtering

Filtering constructs a Power BI basic or advanced JSON filter:

- `=`, `in`, `!=` use `In`/`NotIn`
- `contains`, comparisons, and `between` use advanced conditions
- an empty value clears the filter

The field must resolve to a model column with `sourceTable` and `sourceColumn`. A true model measure has no basic filter target. A query wrapper such as `Sum(Sales.Amount)` may still target `Sales.Amount` because it is an implicitly aggregated column.

Dataset-derived fields and dataset metrics cannot directly filter Power BI. Renamed direct columns and dataset group fields can retain their original target metadata. Use identity selection for grouped metrics rather than pretending a metric is a model column.

Runtime Config `crossFilter: false` is a global gate; it does not redefine component semantics.

## 3. Safe event-specific interactions

`interactions` is primarily used by custom content to map a supported event to one allowlisted payload or an allowed action array:

- `selectRow`, `selectWhere`, `clearSelection`
- `setFilter`, `clearFilter`
- `setState`, `toggleState`
- `openTab`, `toggleCollapse`
- `drillToDetail`, `highlight`, `clearHighlight`

Nested declarative action payloads, `where` expressions, and `valueFromRow` occurrences use the same canonical field traversal as preparation, validation, Inspector controls, repair diagnostics, and dependency reporting. `selectWhere` uses safe expression objects and may read a known clicked-row field via `valueFromRow`. The resolver converts supported data actions into the universal engine, so internal/external policies and diagnostics remain consistent.

No JavaScript callback, handler string, arbitrary dispatch name, URL navigation, or DOM script is accepted.

## Dataset scope

Components validate fields against their selected logical dataset. Internal row behavior maps through source keys/lineage. An interaction field is not automatically remapped to a Power BI filter target: the selected field's retained origin metadata decides eligibility.

Map layers refine this rule: `layer.dataset` overrides the map dataset, and each layer carries its own rows, schema, row keys, and arrays of contributing Power BI identities. A grouped feature may select several source rows. ArcGIS joins preserve the same lineage on the Power BI side. External filter mode still requires an actual model-column target; service/joined attributes and dataset metrics cannot directly filter the semantic model.

Map Studio's layer **Interaction** tab edits the existing universal interaction contract rather than a map-only engine. Its field selector follows `fieldSource`. Power BI and joined features may use retained Power BI identities for external selection; an external filter is enabled only for a direct model column with source table/column metadata. ArcGIS reference-only features can use local highlight/filter behavior, but the editor reports external Power BI selection/filter as unavailable when no genuine model target or lineage exists. Multi-select and clear-on-second-click continue through the shared interaction runtime.

Map feature events have one stable trigger contract: `map.layers[].interaction.trigger` must be `"click"`. Leaflet runs the interaction from the feature click handler, Map Studio exposes a fixed click value, and strict 2.0 validation emits `MAP_INTERACTION_TRIGGER_UNSUPPORTED` for map-layer `change` or `auto`. This restriction does not remove those trigger values from non-map components.

## Compatibility

Version 1.0 may use `internal`, `external`, table `selectable`, table `selectionMode`, and legacy custom interaction flags. Preparation/runtime policy still supports those inputs. Obsolete `selectionTarget` is ignored with one documented migration warning; it does not select nodes or edges. New 2.0 authoring uses `interaction`, and does not invent properties such as `externalSelection`, `selectionTarget`, `crossFilter`, or `powerBISelection` in dashboard JSON.
