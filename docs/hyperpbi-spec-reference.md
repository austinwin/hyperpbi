# HyperPBI specification reference

HyperPBI 2.0 uses Field Manifest aliases as its recommended authoring contract; canonical runtime keys are internal compatibility inputs. Alias resolution covers descriptor-declared nested structures, while ArcGIS service fields and joined map aliases remain unchanged. Component maturity (`stable`, `beta`, `experimental`, `legacy`, `deprecated`) describes implementation governance and is separate from authoring complexity (`recommended`, `standard`, `advanced`).

This reference describes the implemented HyperPBI 2.0 authoring contract and the intentionally preserved HyperPBI 1.0 compatibility path. Runtime implementation and validators are authoritative.

## Root object and version behavior

```json
{
  "version": "2.0",
  "title": "Operations",
  "theme": { "mode": "light", "density": "compact" },
  "app": { "enabled": true },
  "data": { "datasets": {} },
  "definitions": {},
  "components": []
}
```

| Property | 2.0 type | Notes |
|---|---|---|
| `version` | literal `"2.0"` | Required for strict 2.0 validation |
| `components` | component array | Required; may be empty |
| `title` | string | Optional dashboard title |
| `theme` | object | Theme tokens below |
| `layout` | object | Root grid/flex/split hints |
| `state` | object | Initial `search`, `activeTab`, and `filters` compatibility state |
| `app` | object | Root application shell; never `schema.app` |
| `toolbar`, `leftPanel`, `rightPanel` | component arrays | Root regions; panels are also compatibility surfaces |
| `css` | string | Sanitized visual-wide CSS |
| `styles` | object | Global and type/ID component styles |
| `calculations` | object | Root calculated fields and metrics |
| `data` | object | Only `datasets` is allowed |
| `definitions` | named object | Reusable authoring fragments |

Version 2.0 rejects unknown root properties and unknown properties on a component. Unknown dataset-definition properties are also errors. Version 1.0 uses the legacy validator and intentionally remains more lenient; compatibility diagnostics may warn without making a previously valid dashboard unusable.

The package version in `pbiviz.json` is unrelated to this schema version.

## Theme and style system

`theme` accepts:

- `mode: light|dark|auto`
- `density: compact|normal|spacious`
- `fontFamily`
- `primaryColor`, `accentColor`, `surfaceColor`, `textColor`, `borderColor`
- `dangerColor`, `warningColor`, `successColor`
- numeric `radius`, `cardPadding`, `gap`

`styles.globalCss` is sanitized visual-wide CSS. `styles.components` is a record keyed by `*`, a component type, or `#component_id`; each entry may contain `className`, `style`, and `css`. Component-local style wins. CSS is parsed, allowlisted, and scoped; it is not an arbitrary browser stylesheet.

During authoring, `app.designSystem` may reference a registered design preset. Preparation merges its theme/style defaults, lets explicit authoring values win, and removes `designSystem` before strict runtime validation. Unknown presets are errors.

## Root layout, shell, and state

`layout.type` is `grid|flex|split`; optional `columns` and `gap` are numeric. `layout.leftPanel` can set `width`, `collapsible`, and `defaultCollapsed`; `layout.main` can set `type: grid|flex`, `columns`, and `gap`.

`app` supports:

- `enabled`
- `layout: vertical|horizontal`
- `container: fluid|boxed`
- `density: compact|normal`
- `stickyHeader`
- `contentPadding: none|compact|normal`
- `brand`: required `title`; optional `subtitle`, `icon`, `shortTitle`
- `navbar`: visibility, sidebar toggle, search, actions, user, notifications
- `sidebar`: visibility, width, collapsed width, collapse settings, mobile breakpoint, navigation, footer
- `pageHeader`: visibility, title/subtitle, breadcrumbs, actions, metadata
- `footer`: visibility and primary/secondary text

Navigation/action items use declarative `uiAction`; they never execute code or navigate arbitrary URLs. A permanent sidebar should be used only when the visual viewport can support it. Overlays/offcanvas are safer for narrow tiles.

Runtime state tracks tabs, steps, sidebar state, component values, overlays/toasts, selected source rows/keys, per-component selections, highlights, and interaction filters. Stable IDs are therefore part of the behavior contract.

## Field references and origin

New 2.0 authoring uses Field Manifest aliases. Preparation resolves them to canonical runtime keys. Aliases match `^[A-Za-z][A-Za-z0-9]*$`, are deterministically derived from display/source metadata, qualify collisions with the source table, and use a stable suffix only for remaining collisions.

Field metadata distinguishes:

- `key`: canonical runtime key
- `alias`: AI-facing key
- `displayName`
- `queryName`, `qualifiedName`
- `sourceTable`, `sourceColumn`
- `kind: column|measure|unknown`
- `queryAggregation`
- `isImplicitAggregation`
- `origin: powerbi-column|powerbi-measure|dataset-group|dataset-derived|dataset-metric`
- semantic role, data type, format, bound roles, and default aggregation
- identity-selection and external-filter support

A query wrapper such as `Sum(Sales.Amount)` has `queryAggregation: "sum"` and `isImplicitAggregation: true` when it wraps a model column. It is not a true model measure. External filters require a column plus `sourceTable` and `sourceColumn`. Identity selection instead uses Power BI selection identities/source-row lineage.

## Logical datasets

`data.datasets` is a named object. Every definition requires a nonblank `source` of `powerbi` or another named dataset. Allowed operations are `filter`, `derive`, `rename`, `select`, `groupBy`, `metrics`, `distinct`, `sort`, and `limit`.

After resolving the source chain, runtime and static-schema order is:

1. filter
2. derive
3. rename
4. select
5. groupBy and metrics
6. distinct
7. sort
8. limit

See [Data model](data-model.md) for exact contracts, lineage, caching, and zero-row behavior.

## Definitions

`definitions` maps a name to a component fragment. An instance supplies `use: "name"` and its own `id`.

- Object properties merge recursively.
- Instance values override definition values.
- Arrays are replaced, not concatenated.
- A definition may inherit another definition with `use`.
- Definition IDs are removed so an instance cannot inherit an identity.
- Unknown references and cycles are errors.

Expansion occurs before strict component validation. `use` is therefore an authoring property, not a runtime component property.

## Application patterns

Patterns have `type: "pattern"`, a `pattern` name, a stable `id`, and pattern-specific fields. They expand before strict component validation and derive child IDs from the pattern ID.

| Pattern | Required | Optional |
|---|---|---|
| `kpi-row` | `id`, `fields` | `title`, `dataset`, `variant`, `span` |
| `trend-and-breakdown` | `id`, `date`, `measure`, `breakdown` | `title`, `dataset`, `aggregation` |
| `record-explorer` | `id`, `columns`, `details` | `title`, `dataset`, `pageSize` |
| `map-and-details` | `id` | `title`, `dataset`, `height`, `details` |

Unknown patterns and missing required values produce structured diagnostics.

## Calculations

Root `calculations.fields` defines typed row-level outputs with `key`, optional `label`, `type: number|text|boolean|date`, and a safe expression. Root `calculations.metrics` defines dashboard aggregates using `count`, `countWhere`, `sum`, `sumWhere`, `avg`, `avgWhere`, `min`, `max`, `distinctCount`, `ratio`, or `percentOfTotal`.

Preparation validates root calculated fields and augments the static `powerbi` schema before logical-dataset propagation and component binding validation. At runtime those fields are evaluated before logical datasets, so they can drive dataset select/derive/group/metrics and components even when the current data view has zero rows. Root scalar metrics are recomputed over currently filtered rows and remain a separate namespace consumed through `metricGrid.metrics[].metric` or the `metric` template namespace. See [Calculations DSL](calculations-dsl.md).

## Shared component contract

Every 2.0 component requires:

- `type`: a canonical type
- `id`: globally unique; `^[A-Za-z][A-Za-z0-9_-]{0,99}$`

Shared allowed properties are `type`, `id`, `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, and `uiAction`.

`span`, when supplied, is numeric from 1 through 12. `title`, `subtitle`, `dataset`, and `ariaLabel` must be strings; `hidden` must be Boolean. A component inherits its ancestor dataset unless it names another dataset. Unknown datasets and fields outside the selected dataset schema are errors.

Exact per-type required/allowed properties, status, capabilities, accessibility notes, compatibility, and examples are generated in the [component catalog](hyperpbi-component-catalog-reference.md). Do not maintain a second handwritten list.

## Interaction systems

### UI actions

`uiAction` is one action or an array. Types are:

- `clearFilters`
- `setTab` (`target`, `value`)
- `setState` (`target`, `value`)
- `toggleState` (`target`)
- `toggleSidebar`
- `openOverlay`, `closeOverlay`, `toggleOverlay` (`target`)
- `setStep` (`target`, `value`), `nextStep`, `previousStep` (`target`)
- `showToast` (`message`; optional `title`, `intent`, `durationMs`)
- `dismissToast` (`target`)
- `scrollTo` (`target`)
- `refresh` (successful safe no-op; Power BI owns refresh)

Toast duration is persistent when omitted/zero; otherwise runtime clamps it to 1,000–30,000 ms.

### Universal data interaction

`interaction` allows:

- `enabled`
- `trigger: auto|click|change`
- `internalMode: none|highlight|filter`
- `internalScope: self|others|all`
- `externalMode: none|auto|selection|filter`
- `field`, `value`
- `operator: =|!=|>|>=|<|<=|contains|in|between`
- `selectionMode: replace|toggle|add`
- `multiSelect`, `showSelector`, `clearOnSecondClick`

It is optional. `auto` trigger resolves to change for controls and click otherwise. `auto` external mode resolves to filter for controls and selection for data-point/custom components.

### Safe event-specific interactions

`interactions` maps a supported event such as custom-content `onClick` to an allowlisted action: `selectRow`, `selectWhere`, `clearSelection`, `setFilter`, `clearFilter`, `setState`, `toggleState`, `openTab`, `toggleCollapse`, `drillToDetail`, `highlight`, or `clearHighlight`. Conditions use safe expression objects; no handler code is accepted.

See [Interactions](interactions.md) for origin/lineage restrictions.

## Overlays

`dropdown`, `popover`, `modal`, `offcanvas`, and compatibility drawers render through the root overlay host. Each requires a stable ID. UI actions must target an existing overlay ID. Dropdown/popover positioning is viewport-aware; modal/offcanvas support focus and dismissal behavior. Do not simulate overlays with fixed-position custom HTML (fixed positioning is blocked by scoped CSS policy).

## Charts

Semantic chart bindings are schema properties: category/measure, x/y, series, source/target, path fields, group/indicators, or nested chart depending on the type. Aggregation enum is `sum|avg|min|max|count|distinctCount|countWhere|first` where component metadata allows it.

Safe ECharts `options` may adjust presentation. Functions, URL-bearing keys, executable strings, and unsupported series types are removed. On semantic charts, options cannot replace datasets/transforms, generated axis data/type, semantic series data/type/links/nodes/encode/transform/dimensions, radar indicators, or series counts. `advancedChart` permits broader sanitized JSON options but still no functions or unsafe URLs.

## Tables and matrix

`table` accepts native columns, pagination, page size, search, column resizing, maximum rows, sticky header, compact/normal density, stripes, hover, row count, page-size choices, row actions, and an empty state. Columns can specify field/title/width/format/alignment, conditions, sorting, resizing, visibility, wrapping, freezing, text/badge/progress cell type, and intent mapping.

`matrix` requires nonempty `rows` and `values` and renders every value descriptor. Each value may define `field`, `aggregation`, `where`, `title`, and `format`; metric titles fall back deterministically when omitted. `count`/`countWhere` can omit a field, while numeric aggregations require a numeric field and `countWhere`/`sumWhere`/`avgWhere` require `where`. With `columns`, output headers are column group × metric. Totals and heatmap normalization are per metric. `maxRows` is deterministic, and the runtime enforces a 5,000-cell budget with a visible truncation warning. Row/column headers use table scopes and data-cell labels include their row, column, and metric context. `engine: "tabulator"` is compatibility input normalized to native because Tabulator is not bundled.

## Maps

`map` uses Leaflet and accepts view, basemap, `layerGroups`, `bookmarks`, layers, search, legend, layer panel, toolbar, and height. Layer source types are `powerbi`, `arcgisFeature`, `arcgisTile`, and `arcgisDynamic`. Public ArcGIS requests require HTTPS, a permitted Maps package host, and no embedded credentials.

All Power BI fields arrive through Values. Each layer may set `dataset`; precedence is layer, map, then `powerbi`. Power BI location bindings belong in that layer's `source.bindings`. Explicit layers never inherit global Runtime Config coordinates. Geometry overrides coordinates; latitude/longitude are strict finite numbers in range; missing `layerValue` returns no unrelated data; mixed geometry is classified across all features. Renderer, label, popup/tooltip, visibility, filter, interaction, and join fields validate against the effective dataset/source. Grouped logical rows retain contributing source identity arrays.

Strict validation rejects unknown nested map properties and unimplemented `naturalBreaks`. Partial/experimental accepted properties emit capability limitations from the machine-readable registry. The complete contract, Map Studio behavior, capability table, performance bounds, and legacy one-layer compatibility are documented in [Map services](map-services.md). Legacy `settings`, `style`, and `popup` remain compatibility input.

## SVG

`svg` requires `viewBox` and `elements`; `svgMarkup` requires `svg`. Both accept size/aspect/role/description/dataContext/motion/performance. Structured SVG elements, binding forms, animation enums, repeat behavior, sanitizer rules, and exact limits are documented in [SVG visuals](svg-visuals.md).

## Security restrictions

HyperPBI JSON cannot provide JavaScript, functions, eval, event handlers, script/embed/iframe content, arbitrary network datasets, SQL, credentials, or AI keys. HTML, CSS, ECharts options, SVG, URLs, map hosts, and provider access each pass dedicated allowlists/policies. See [Security](security.md).

## Preparation and diagnostics

Preparation returns authoring JSON, a renderable schema only when no errors remain, structured diagnostics, text error/warning summaries, applied repair records, and resolved dataset schemas.

Common diagnostic families include invalid/unknown properties, unsupported version/type/enum, missing required properties, duplicate/invalid IDs, unknown/ambiguous fields, unknown dataset/source, dataset/definition cycles, invalid dataset operations/collisions, nonnumeric fields, invalid interactions/targets, reference errors, and SVG dashboard limits.

Automatic repairs are intentionally narrow:

- add 2.0 when `components` makes the missing version unambiguous
- generate missing 2.0 component IDs during import
- correct `meausre→measure`, `catgory→category`, `componets→components`, `aggregration→aggregation`
- convert numeric strings for `span`, `height`, `width`, `limit`, `pageSize`, `maxRows`, `columns`, and `gap`

Comments, smart quotes, truncation, unknown types/fields, unsafe content, and ambiguous intent are not automatically repaired.

## 1.0 compatibility and migrations

HyperPBI 1.0 is valid compatibility/history material. The migration layer:

- supplies version 1.0 when a legacy object omits a version
- resolves legacy field references against current normalized data
- normalizes tab `components`/`content` to `children`
- wraps legacy accordion children into one item
- preserves drawer/filterDrawer and stepper compatibility rendering
- maps legacy button `action`/`actionValue` to `uiAction` while retaining the legacy properties
- normalizes `table.engine: "tabulator"` to native
- recursively migrates component regions and footer children

Normal improvement jobs preserve the existing schema version. Migration to 2.0 must be intentional because strict properties, aliases, datasets, definitions, patterns, and stable-ID requirements can expose ambiguities that should not be guessed.
