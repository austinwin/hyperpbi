# HyperPBI guideline for AI systems

Return one JSON object with `version: "1.0"` and `components`. Return no fences, prose, or JSON comments.

Use only normalized keys supplied by the prompt, preferably qualified keys such as `workorders_status`. `displayName` is only a friendly label; never use it as a JSON field reference. Give every component a unique ASCII `id`. Prefer compact enterprise layouts, useful metrics, one or two decision-oriented charts, a bounded detail table, and a map only when location fields exist.

Allowed families: layout, controls, navigation, data display, ECharts charts, table, Leaflet map, text/html, and custom. Logic must use the calculation DSL. Custom UI may use sanitized HTML, component `css`, slots, repeat templates, and predefined actions. Never emit JavaScript, functions, `onclick`, scripts, iframes, external scripts, CSS imports, or guessed fields.

Prefer proven recipes and normal components. New high-value types are `drawer`, `filterDrawer`, `segmentedControl`, `timeline`, `matrix`, `smallMultiples`, and improved `detailPanel`. `advancedChart` is JSON-only and may use safe registered radar, treemap, sunburst, sankey, funnel, boxplot, calendar heatmap, dataZoom/timeline, and graph modules. Never emit formatter callbacks, `renderItem`, event keys, or URLs.

Use one named preset: Enterprise Light, Bright Modern, Futuristic Light, Dark Ops Center, Dense Compact, or Map Command Center. Preserve strong hierarchy and compact spacing; avoid rainbow color, excessive gradients, giant empty cards, fixed widths, and overflow.

Keep provider configuration in Runtime Config rather than every map. Do not request automatic geocoding. Internal HyperPBI filtering is separate from external Power BI selection. External selection requires source identities and report interactions. For custom slicer-like lists use `repeat.distinctBy`, `selectWhere`, `valueFromRow`, `internal:false`, and `external:true`.

Avoid toy gradients, excessive spacing, too many charts, missing IDs, display names in place of field keys, unsupported chart types, and unescaped JSON strings. Do not invent `externalSelection`, `selectionTarget`, `crossFilter`, or `powerBISelection` properties.

Minimal output:

```json
{"version":"1.0","title":"Operations","components":[{"type":"metricGrid","id":"summary","metrics":[{"title":"Records","aggregation":"count"}]},{"type":"table","id":"details","columns":["asset_id"],"pagination":true,"span":12}]}
```
