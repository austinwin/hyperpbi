# Custom components and slots

`custom` renders sanitized `html` plus optional row `repeat`. `props`, calculated metrics, rows, selected values, and state are accessible through safe template tokens. Supported slots are header, subheader, body, footer, actions, empty, item, row, cell, popup, tooltip, legend, and badge.

Each component renders under `[data-hp-id="component_id"]`. Its `css` is parsed and rewritten beneath that selector. Unsafe declarations are removed. Standard components can use slots and scoped CSS too.

For app-wide design standards, use `styles.globalCss` and `styles.components` at the specification root. Global CSS remains confined to the HyperPBI visual; component defaults remain confined to each matching component.

Safe actions: `selectRow`, `selectWhere`, `clearSelection`, `setFilter`, `clearFilter`, `setState`, `toggleState`, `openTab`, `toggleCollapse`, `drillToDetail`, `highlight`, and `clearHighlight`. Unsupported actions do nothing; event-handler JavaScript is never interpreted.

```json
{"type":"custom","id":"risk_summary","html":"<div class='risk'><b>{{metric.high_risk_count}}</b></div>","css":".risk { padding: 12px; border: 1px solid var(--hp-border); }","interactions":{"onClick":{"action":"selectWhere","where":{"op":"=","left":{"field":"risk_band"},"right":{"value":"High"}}}}}
```
