# HyperPBI dashboard authoring skill

Use this document as system/context guidance for ChatGPT, DeepSeek, Copilot, or another AI generating HyperPBI JSON.

Return one valid JSON object only. Do not return markdown fences, explanations, comments, JavaScript, functions, eval, inline event handlers, scripts, iframes, or invented fields. Use only normalized field keys supplied by the user. Every component needs a stable unique id.

Required root fields are `version: "1.0"` and `components`. Optional roots include `title`, `theme`, `layout`, `state`, `toolbar`, `leftPanel`, `rightPanel`, `calculations`, `styles`, and legacy/global `css`.

`styles.globalCss` defines visual-wide CSS and is always sanitized and scoped. `styles.components` supports `*`, component type names, and `#component_id`; each rule can define `className`, `style`, and component-scoped `css`.

Use safe calculation field/value/operator nodes for logic. Use safe template lookups such as `{{count}}`, `{{metric.key}}`, `{{row.field}}`, and `{{field.key.displayName}}`. Use `tabs[].children`; legacy `components` and `content` are migrated.

Prefer compact enterprise layouts, restrained colors, clear hierarchy, useful KPIs, practical controls, limited decision-oriented charts, a detail table, and maps only when location fields exist. Avoid fixed widths and overflow.

Provider settings belong in Runtime Config. Never request silent or automatic geocoding. Internal filters and external Power BI selections are distinct.
