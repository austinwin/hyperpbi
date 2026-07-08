# HyperPBI specification reference

Root fields: `version`, `title`, `theme`, `layout`, `state`, `toolbar`, `leftPanel`, `rightPanel`, `components`, `calculations`, `styles`, and `css`.

Runtime Config owns renderer and security behavior. Defaults are `renderer: { "showHeader": false, "showRowCount": false, "showStudioButton": true }` and `security: { "cssMode": "scoped", "htmlMode": "sanitized", "showSanitizerWarnings": false }`. A schema `title` is metadata unless `showHeader` is explicitly true.

`styles.globalCss` is application-wide CSS scoped to the visual. `styles.components` provides defaults using `*`, a type such as `kpi`, or an id such as `#critical_kpi`. Rules support `className`, sanitized `style`, and component-scoped `css`. Local component values win.

Shared component fields: `type`, `id`, `title`, `span` (1–12), `className`, `props`, `style`, `css`, `slots`, `data`, `visibility`, safe custom `interactions`, and universal `interaction`.

## Fields

JSON field references must use the normalized `key`, preferably a stable qualified key such as `workorders_status`. The field dictionary includes `key`, `displayName`, `queryName`, `sourceTable`, `sourceColumn`, `qualifiedName`, `type`, `format`, and `roles`. `displayName` is for visible labels only. Power BI `queryName` is parsed from forms including `Table.Column`, `'Table Name'.Column`, and `Table[Column]`; table and column are slugged separately. Numeric suffixes are only a final collision fallback.

## Universal interaction

`interaction` supports `enabled`, `trigger`, `internalMode`, `internalScope`, `externalMode`, `field`, `operator`, `value`, `selectionMode`, `multiSelect`, `showSelector`, and `clearOnSecondClick`. Internal and external behavior are independent. Internal modes are `none`, `highlight`, and `filter`; scope is `self`, `others`, or `all`. External modes are `none`, `auto`, `selection`, and `filter`. Auto means change/filter for controls and click/selection for data points. See [interactions](interactions.md) for family examples and migration rules.

Custom `repeat` supports `source`, `as`, `limit`, `template`, `distinctBy`, `sortBy`, and `sortDirection`. Repeated content is sanitized HTML inside engine-owned accessible wrappers. Selected wrappers receive `is-selected` and `hp-row-selected`.

Custom `repeat` actions resolve matches and pass a universal payload to the shared engine. A field without `sourceTable` and `sourceColumn` cannot be an external filter target. Table, matrix, map, scatter, and advanced-chart filters require explicit unambiguous fields; identity selection does not.

## Runtime Config GUI and JSON

The Runtime Config tab provides GUI sections for renderer, interactions, security, providers, geocoder, and map bindings. GUI changes immediately normalize and update saved JSON. Advanced JSON is a separate draft: edit it, validate or format it, then select **Apply JSON** to update the GUI. Invalid JSON never mutates the applied form.

```json
{"version":"1.0","renderer":{"showHeader":false,"showRowCount":false,"showStudioButton":true},"interactions":{"crossFilter":true,"multiSelect":true,"externalMode":"auto"},"security":{"cssMode":"scoped","htmlMode":"sanitized","showSanitizerWarnings":false}}
```

Types: `grid`, `flex`, `split`, `leftPanel`, `rightPanel`, `toolbar`, `section`, `spacer`, `divider`, `searchBox`, `textInput`, `numberInput`, `slider`, `select`, `multiSelect`, `toggle`, `button`, `buttonGroup`, `filterChips`, `dateRange`, `tabs`, `collapsible`, `accordion`, `kpi`, `metricGrid`, `infoCard`, `statusBadge`, `progressBar`, `alert`, `statList`, `detailPanel`, `barChart`, `horizontalBarChart`, `lineChart`, `areaChart`, `pieChart`, `donutChart`, `scatterChart`, `gauge`, `heatmap`, `table`, `map`, `html`, `text`, `markdown`, and `custom`.

Additional types: `drawer`, `filterDrawer`, `segmentedControl`, `timeline`, `matrix`, `smallMultiples`, and `advancedChart`.

## Advanced ECharts

`advancedChart.options` is JSON-only ECharts 6 configuration. Every bundled declarative chart and component module is registered: bar, boxplot, candlestick, chord, custom, effectScatter, funnel, gauge, graph, heatmap, line/lines, map, parallel, pictorialBar, pie, radar, sankey, scatter, sunburst, themeRiver, tree, treemap, coordinate systems, dataset/transform, dataZoom/brush, visualMap, marks, toolbox, timeline, graphic, aria, Canvas, and SVG. Safe formatter strings are allowed; functions (including custom `renderItem`) and executable/remote content are removed. `initOptions`, `setOption`, and `maxDataRows` expose ECharts initialization, update, and dataset limits. Existing simple charts remain backward compatible and safely merge optional `options`.

The sanitizer removes functions, `formatter`, `renderItem`, event-handler keys, URL-bearing keys, external/data/javascript URLs, executable markup, and unsupported series types.

## Safe and trusted author modes

`cssMode: "scoped"` and `htmlMode: "sanitized"` are the certification-oriented defaults. Scoped CSS supports common dashboard layout, grid/flex, table, typography, pseudo-content, filter, and responsive properties while blocking imports, URLs, expressions, fixed positioning, and abusive z-index. Sanitized HTML removes active controls and executable/embed surfaces.

`cssMode: "trusted"` accepts broader parsed CSS declarations for local/internal trusted-author dashboards while retaining visual scoping and the executable/escape checks. `htmlMode: "trusted"` permits a broader HTML/SVG vocabulary, but scripts, inline event handlers, iframes, object/embed, unsafe links, and executable JavaScript remain prohibited. Sanitizer warnings are collected in Studio Issues; rendered dashboards show them only when `showSanitizerWarnings` is explicitly true.

## Power BI data limits

The data-reduction window requests up to 30,000 rows per segment, the Power BI window maximum. When `metadata.segment` is present, HyperPBI calls `fetchMoreData(true)` sequentially, preserves accumulated rows and selection identities, and reports whether more rows remain. Power BI still imposes an overall data-view row maximum of 1,048,576 and a 100 MB aggregation memory limit. Loaded rows are separate from displayed rows: tables remain paginated and cap rendered rows to avoid DOM expansion.

## High-value components

- `drawer`: `position`, `width`, `openWhen`, `stateKey`, `defaultOpen`, and `children`.
- `filterDrawer`: drawer behavior plus applied-filter count and clear filters.
- `segmentedControl`: `field` or static `options`, universal change payloads, optional internal filtering, and selected pills.
- `timeline`: `dateField`, `titleField`, optional category/status/description fields, sort direction, and limit.
- `matrix`: `rows`, optional `columns`, `values`, totals, heatmap, and row limit.
- `smallMultiples`: `splitField`, child `chart`, max panels, shared-scale intent, and height.
- `detailPanel`: `selectedRow`, grouped fields, badges, copyable values, formats, and empty text.

Template tokens: `count`, `title`, aggregate namespaces, `metric.key`, `selected.key`, `row.key`, `field.key.displayName`, `prop.name`, and `state.name`. Tokens are lookups, not expressions.

Tabs should use `tabs[].children`. AI output using `tabs[].components` or `tabs[].content` is migrated automatically.

Properties named `externalSelection`, `selectionTarget`, `crossFilter`, or `powerBISelection` in dashboard JSON are not implemented and produce non-blocking reference warnings. Use typed interactions or the implemented Runtime Config interaction switch.
