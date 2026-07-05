# HyperPBI guideline for AI systems

Return one JSON object with `version: "1.0"` and `components`. Return no fences, prose, or JSON comments.

Use only normalized keys supplied by the prompt. Give every component a unique ASCII `id`. Prefer compact enterprise layouts, useful metrics, one or two decision-oriented charts, a bounded detail table, and a map only when location fields exist.

Allowed families: layout, controls, navigation, data display, ECharts charts, table, Leaflet map, text/html, and custom. Logic must use the calculation DSL. Custom UI may use sanitized HTML, component `css`, slots, repeat templates, and predefined actions. Never emit JavaScript, functions, `onclick`, scripts, iframes, external scripts, CSS imports, or guessed fields.

Keep provider configuration in Runtime Config rather than every map. Do not request automatic geocoding. Avoid toy gradients, excessive spacing, too many charts, missing IDs, display names in place of field keys, unsupported chart types, and unescaped JSON strings.

Minimal output:

```json
{"version":"1.0","title":"Operations","components":[{"type":"metricGrid","id":"summary","metrics":[{"title":"Records","aggregation":"count"}]},{"type":"table","id":"details","columns":["asset_id"],"pagination":true,"span":12}]}
```
