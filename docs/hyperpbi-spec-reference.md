# HyperPBI specification reference

Root fields: `version`, `title`, `theme`, `layout`, `state`, `toolbar`, `leftPanel`, `rightPanel`, `components`, `calculations`, `styles`, and `css`.

`styles.globalCss` is application-wide CSS scoped to the visual. `styles.components` provides defaults using `*`, a type such as `kpi`, or an id such as `#critical_kpi`. Rules support `className`, sanitized `style`, and component-scoped `css`. Local component values win.

Shared component fields: `type`, `id`, `title`, `span` (1–12), `className`, `props`, `style`, `css`, `slots`, `data`, `visibility`, and `interactions`.

Types: `grid`, `flex`, `split`, `leftPanel`, `rightPanel`, `toolbar`, `section`, `spacer`, `divider`, `searchBox`, `textInput`, `numberInput`, `slider`, `select`, `multiSelect`, `toggle`, `button`, `buttonGroup`, `filterChips`, `dateRange`, `tabs`, `collapsible`, `accordion`, `kpi`, `metricGrid`, `infoCard`, `statusBadge`, `progressBar`, `alert`, `statList`, `detailPanel`, `barChart`, `horizontalBarChart`, `lineChart`, `areaChart`, `pieChart`, `donutChart`, `scatterChart`, `gauge`, `heatmap`, `table`, `map`, `html`, `text`, `markdown`, and `custom`.

Template tokens: `count`, `title`, aggregate namespaces, `metric.key`, `selected.key`, `row.key`, `field.key.displayName`, `prop.name`, and `state.name`. Tokens are lookups, not expressions.

Tabs should use `tabs[].children`. AI output using `tabs[].components` or `tabs[].content` is migrated automatically.
