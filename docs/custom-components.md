# Custom components and slots

`custom` renders sanitized `html` once plus optional row `repeat`. Each repeated item is rendered in an engine-owned `.hp-custom-repeat-row` wrapper, so the wrapper—not user HTML—owns click and keyboard handling. `props`, calculated metrics, rows, selected values, and state are accessible through safe template tokens. Supported slots are header, subheader, body, footer, actions, empty, item, row, cell, popup, tooltip, legend, and badge.

Each component renders under `[data-hp-id="component_id"]`. Its `css` is parsed and rewritten beneath that selector. Unsafe declarations are removed. Standard components can use slots and scoped CSS too.

For app-wide design standards, use `styles.globalCss` and `styles.components` at the specification root. Global CSS remains confined to the HyperPBI visual; component defaults remain confined to each matching component.

`repeat` supports `source: "rows"`, `as: "row"`, `limit`, `template`, `distinctBy`, `sortBy`, and `sortDirection`. Use normalized field keys for `distinctBy`, `sortBy`, template tokens, and interactions. `displayName` is only a friendly UI label.

Safe actions: `selectRow`, `selectWhere`, `clearSelection`, `setFilter`, `clearFilter`, `setState`, `toggleState`, `openTab`, `toggleCollapse`, `drillToDetail`, `highlight`, and `clearHighlight`. `valueFromRow` reads only a known normalized field from the clicked repeated row and returns null without a clicked row. Unsupported actions produce diagnostics; event-handler JavaScript is never interpreted.

`selectionMode` is `replace`, `add`, or `toggle` (default `replace`). Ctrl/Cmd-click changes `replace` to toggle behavior. `internal:false` prevents internal selected-row filtering, while the component still receives `.is-selected` and `.hp-row-selected` classes. `external:true` sends matching source row identities to Power BI.

```json
{"type":"custom","id":"risk_summary","html":"<div class='risk'><b>{{metric.high_risk_count}}</b></div>","css":".risk { padding: 12px; border: 1px solid var(--hp-border); }","interactions":{"onClick":{"action":"selectWhere","where":{"op":"=","left":{"field":"risk_band"},"right":{"value":"High"}}}}}
```

Complete slicer-style example:

```json
{
  "version": "1.0",
  "components": [
    {
      "type": "custom",
      "id": "leadby_toggle_filter",
      "span": 12,
      "repeat": {
        "source": "rows",
        "as": "row",
        "distinctBy": "leadby",
        "sortBy": "leadby",
        "sortDirection": "asc",
        "limit": 200,
        "template": "<div class='leadby-row'><span class='leadby-switch'><span class='leadby-knob'></span></span><span class='leadby-label'>{{row.leadby}}</span></div>"
      },
      "interactions": {
        "onClick": {
          "action": "selectWhere",
          "selectionMode": "replace",
          "external": true,
          "internal": false,
          "where": {
            "op": "=",
            "left": { "field": "leadby" },
            "right": { "valueFromRow": "leadby" }
          }
        }
      },
      "css": ".hp-custom-body{display:flex;flex-direction:column;gap:6px}.hp-custom-repeat-row{cursor:pointer}.leadby-row{display:flex;align-items:center;gap:10px;padding:7px 10px;border:1px solid #d9e2ec;border-radius:10px;background:#fff}.leadby-switch{width:34px;height:18px;border:1px solid #94a3b8;border-radius:999px;background:#cbd5e1;position:relative}.leadby-knob{position:absolute;top:2px;left:2px;width:12px;height:12px;border-radius:999px;background:#fff}.hp-custom-repeat-row.is-selected .leadby-row{background:#eef6ff;border-color:#1f4e79}.hp-custom-repeat-row.is-selected .leadby-switch{background:#1f4e79;border-color:#1f4e79}.hp-custom-repeat-row.is-selected .leadby-knob{left:18px}"
    }
  ]
}
```

No JavaScript, `eval`, functions, inline handlers, scripts, iframes, or unsafe URLs are accepted. HTML remains DOMPurify-sanitized and CSS remains parsed, allowlisted, and scoped.
