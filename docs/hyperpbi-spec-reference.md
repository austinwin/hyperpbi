# HyperPBI specification reference

Root fields: `version`, `title`, `theme`, `layout`, `state`, `toolbar`, `leftPanel`, `rightPanel`, `components`, `calculations`, `styles`, and `css`.

`styles.globalCss` is application-wide CSS scoped to the visual. `styles.components` provides defaults using `*`, a type such as `kpi`, or an id such as `#critical_kpi`. Rules support `className`, sanitized `style`, and component-scoped `css`. Local component values win.

Shared component fields: `type`, `id`, `title`, `span` (1–12), `className`, `props`, `style`, `css`, `slots`, `data`, `visibility`, and `interactions`.

## Fields

JSON field references must use the normalized `key`, preferably a stable qualified key such as `workorders_status`. The field dictionary includes `key`, `displayName`, `queryName`, `sourceTable`, `sourceColumn`, `qualifiedName`, `type`, `format`, and `roles`. `displayName` is for visible labels only. Power BI `queryName` is parsed from forms including `Table.Column`, `'Table Name'.Column`, and `Table[Column]`; table and column are slugged separately. Numeric suffixes are only a final collision fallback.

## Selection

Selectable components support `internal` and `external` booleans where applicable. Tables support `selectionMode: "filter" | "highlight"`. Safe click interactions support `selectionMode: "replace" | "add" | "toggle"`. Custom row matching supports `{ "valueFromRow": "field_key" }`, which can only read a known normalized field from the clicked repeat row.

Custom `repeat` supports `source`, `as`, `limit`, `template`, `distinctBy`, `sortBy`, and `sortDirection`. Repeated content is sanitized HTML inside engine-owned accessible wrappers. Selected wrappers receive `is-selected` and `hp-row-selected`.

Internal HyperPBI filtering and external Power BI selection are separate. External selection also requires enabled formatting interactions, host permission, table identities, matching source rows, compatible model lineage/relationships, and Power BI Edit interactions.

Types: `grid`, `flex`, `split`, `leftPanel`, `rightPanel`, `toolbar`, `section`, `spacer`, `divider`, `searchBox`, `textInput`, `numberInput`, `slider`, `select`, `multiSelect`, `toggle`, `button`, `buttonGroup`, `filterChips`, `dateRange`, `tabs`, `collapsible`, `accordion`, `kpi`, `metricGrid`, `infoCard`, `statusBadge`, `progressBar`, `alert`, `statList`, `detailPanel`, `barChart`, `horizontalBarChart`, `lineChart`, `areaChart`, `pieChart`, `donutChart`, `scatterChart`, `gauge`, `heatmap`, `table`, `map`, `html`, `text`, `markdown`, and `custom`.

Template tokens: `count`, `title`, aggregate namespaces, `metric.key`, `selected.key`, `row.key`, `field.key.displayName`, `prop.name`, and `state.name`. Tokens are lookups, not expressions.

Tabs should use `tabs[].children`. AI output using `tabs[].components` or `tabs[].content` is migrated automatically.

Properties named `externalSelection`, `selectionTarget`, `crossFilter`, or `powerBISelection` in dashboard JSON are not implemented and produce non-blocking reference warnings. Use typed interactions or the implemented Runtime Config interaction switch.
