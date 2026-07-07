# HyperPBI specification reference

Root fields: `version`, `title`, `theme`, `layout`, `state`, `toolbar`, `leftPanel`, `rightPanel`, `components`, `calculations`, `styles`, and `css`.

Runtime Config owns renderer and security behavior. Defaults are `renderer: { "showHeader": false, "showRowCount": false, "showStudioButton": true }` and `security: { "cssMode": "scoped", "htmlMode": "sanitized", "showSanitizerWarnings": false }`. A schema `title` is metadata unless `showHeader` is explicitly true.

`styles.globalCss` is application-wide CSS scoped to the visual. `styles.components` provides defaults using `*`, a type such as `kpi`, or an id such as `#critical_kpi`. Rules support `className`, sanitized `style`, and component-scoped `css`. Local component values win.

Shared component fields: `type`, `id`, `title`, `span` (1–12), `className`, `props`, `style`, `css`, `slots`, `data`, `visibility`, and `interactions`.

## Fields

JSON field references must use the normalized `key`, preferably a stable qualified key such as `workorders_status`. The field dictionary includes `key`, `displayName`, `queryName`, `sourceTable`, `sourceColumn`, `qualifiedName`, `type`, `format`, and `roles`. `displayName` is for visible labels only. Power BI `queryName` is parsed from forms including `Table.Column`, `'Table Name'.Column`, and `Table[Column]`; table and column are slugged separately. Numeric suffixes are only a final collision fallback.

## Selection

Selectable components support `internal` and `external` booleans where applicable. Tables support `selectionMode: "filter" | "highlight"`. Safe click interactions support `selectionMode: "replace" | "add" | "toggle"`. Custom row matching supports `{ "valueFromRow": "field_key" }`, which can only read a known normalized field from the clicked repeat row.

Custom `repeat` supports `source`, `as`, `limit`, `template`, `distinctBy`, `sortBy`, and `sortDirection`. Repeated content is sanitized HTML inside engine-owned accessible wrappers. Selected wrappers receive `is-selected` and `hp-row-selected`.

Internal HyperPBI filtering and external Power BI selection are separate. External selection also requires enabled formatting interactions, host permission, table identities, matching source rows, compatible model lineage/relationships, and Power BI Edit interactions.

Types: `grid`, `flex`, `split`, `leftPanel`, `rightPanel`, `toolbar`, `section`, `spacer`, `divider`, `searchBox`, `textInput`, `numberInput`, `slider`, `select`, `multiSelect`, `toggle`, `button`, `buttonGroup`, `filterChips`, `dateRange`, `tabs`, `collapsible`, `accordion`, `kpi`, `metricGrid`, `infoCard`, `statusBadge`, `progressBar`, `alert`, `statList`, `detailPanel`, `barChart`, `horizontalBarChart`, `lineChart`, `areaChart`, `pieChart`, `donutChart`, `scatterChart`, `gauge`, `heatmap`, `table`, `map`, `html`, `text`, `markdown`, and `custom`.

Additional types: `drawer`, `filterDrawer`, `segmentedControl`, `timeline`, `matrix`, `smallMultiples`, and `advancedChart`.

## Advanced ECharts

`advancedChart.options` is JSON-only ECharts configuration. Safe modules include dataset/transform, title, toolbox, dataZoom, timeline, radar, treemap, sunburst, sankey, funnel, boxplot, graph/network, and calendar heatmap. Existing simple charts remain backward compatible and safely merge optional component `options`.

The sanitizer removes functions, `formatter`, `renderItem`, event-handler keys, URL-bearing keys, external/data/javascript URLs, executable markup, and unsupported series types.

## Safe and trusted author modes

`cssMode: "scoped"` and `htmlMode: "sanitized"` are the certification-oriented defaults. Scoped CSS supports common dashboard layout, grid/flex, table, typography, pseudo-content, filter, and responsive properties while blocking imports, URLs, expressions, fixed positioning, and abusive z-index. Sanitized HTML removes active controls and executable/embed surfaces.

`cssMode: "trusted"` accepts broader parsed CSS declarations for local/internal trusted-author dashboards while retaining visual scoping and the executable/escape checks. `htmlMode: "trusted"` permits a broader HTML/SVG vocabulary, but scripts, inline event handlers, iframes, object/embed, unsafe links, and executable JavaScript remain prohibited. Sanitizer warnings are collected in Studio Issues; rendered dashboards show them only when `showSanitizerWarnings` is explicitly true.

## Power BI data limits

The data-reduction window requests up to 30,000 rows per segment, the Power BI window maximum. When `metadata.segment` is present, HyperPBI calls `fetchMoreData(true)` sequentially, preserves accumulated rows and selection identities, and reports whether more rows remain. Power BI still imposes an overall data-view row maximum of 1,048,576 and a 100 MB aggregation memory limit. Loaded rows are separate from displayed rows: tables remain paginated and cap rendered rows to avoid DOM expansion.

## High-value components

- `drawer`: `position`, `width`, `openWhen`, `stateKey`, `defaultOpen`, and `children`.
- `filterDrawer`: drawer behavior plus applied-filter count and clear filters.
- `segmentedControl`: `field` or static `options`, internal filtering, optional `external:true`, and selected pills.
- `timeline`: `dateField`, `titleField`, optional category/status/description fields, sort direction, and limit.
- `matrix`: `rows`, optional `columns`, `values`, totals, heatmap, and row limit.
- `smallMultiples`: `splitField`, child `chart`, max panels, shared-scale intent, and height.
- `detailPanel`: `selectedRow`, grouped fields, badges, copyable values, formats, and empty text.

Template tokens: `count`, `title`, aggregate namespaces, `metric.key`, `selected.key`, `row.key`, `field.key.displayName`, `prop.name`, and `state.name`. Tokens are lookups, not expressions.

Tabs should use `tabs[].children`. AI output using `tabs[].components` or `tabs[].content` is migrated automatically.

Properties named `externalSelection`, `selectionTarget`, `crossFilter`, or `powerBISelection` in dashboard JSON are not implemented and produce non-blocking reference warnings. Use typed interactions or the implemented Runtime Config interaction switch.
