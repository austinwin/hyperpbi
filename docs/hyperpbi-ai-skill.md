# HyperPBI dashboard authoring skill

Use this document as system/context guidance for ChatGPT, DeepSeek, Copilot, or another AI generating HyperPBI JSON.

Return one valid JSON object only. Do not return markdown fences, explanations, comments, JavaScript, functions, eval, inline event handlers, scripts, iframes, unsafe URLs, or invented fields. Use only normalized field keys supplied by the user, preferably table-qualified keys such as `workorders_status`. `displayName` is only a UI label. Every component needs a stable unique id.

Required root fields are `version: "1.0"` and `components`. Optional roots include `title`, `theme`, `layout`, `state`, `toolbar`, `leftPanel`, `rightPanel`, `calculations`, `styles`, and legacy/global `css`.

`styles.globalCss` defines visual-wide CSS and is always sanitized and scoped. `styles.components` supports `*`, component type names, and `#component_id`; each rule can define `className`, `style`, and component-scoped `css`.

Use safe calculation field/value/operator nodes for logic. Use safe template lookups such as `{{count}}`, `{{metric.key}}`, `{{row.field}}`, and `{{field.key.displayName}}`. Use `tabs[].children`; legacy `components` and `content` are migrated.

Prefer compact enterprise layouts, restrained colors, clear hierarchy, useful KPIs, practical controls, limited decision-oriented charts, a detail table, and maps only when location fields exist. Avoid fixed widths and overflow.

Provider settings belong in Runtime Config. Never request silent or automatic geocoding. Internal HyperPBI filters and external Power BI selections are distinct. External selection requires enabled formatting interactions, host permission, source table identities, matching source rows, compatible semantic-model lineage/relationships, and Power BI Edit interactions configured on target visuals.

For a custom slicer-like component, use `repeat.distinctBy`, optional `sortBy`/`sortDirection`, and `interactions.onClick` with `action:"selectWhere"`. Compare a normalized `{ "field": "field_key" }` with `{ "valueFromRow": "field_key" }`, and set `internal:false`, `external:true`, `externalMode:"filter"`. This keeps all values visible while applying a Power BI field filter. Use `externalMode:"selection"` only for explicit row/data-point selection. Selection modes are `replace`, `add`, and `toggle`; Ctrl/Cmd-click modifies replace into toggle behavior.

Do not invent `externalSelection`, `selectionTarget`, `crossFilter`, or `powerBISelection` in dashboard JSON.

## Professional generation standard

Shared properties are `id`, `span`, `className`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `internal`, and `external`. Use `styles.globalCss` for the visual design system and `styles.components` for reusable `*`, type, and `#id` rules.

Prefer the runtime component catalog: layout, controls, navigation/drawers, displays/timeline/detail, simple charts, table/matrix, map, safe custom HTML/CSS, small multiples, and JSON-only `advancedChart`. Use advanced ECharts only when a simple chart cannot communicate the decision. Never use functions, formatter callbacks, event keys, external URLs, or executable markup in chart options.

Use one of six preset contracts: Enterprise Light, Bright Modern, Futuristic Light, Dark Ops Center, Dense Compact, or Map Command Center. Follow a recipe appropriate to the goal: executive overview, operations, map-first, detail explorer, KPI monitoring, table-heavy reporting, custom slicer/list, bright enterprise, futuristic light, or dense 600×500.

Generated dashboards must be compact, responsive, and hierarchical. Avoid random bright colors, excessive gradients, giant empty cards, cluttered charts, fixed widths, and horizontal overflow.
