# AI authoring

AI Prompt builds a self-contained compiler instruction from the current field dictionary, safe samples/summaries, visual dimensions, requested components, DSL operators, map policy, interaction behavior, and security constraints.

Privacy modes:

- Field dictionary only (default): normalized keys, display names, query names, source tables/columns, qualified names, types, formats, and roles.
- Samples: 1–50 selected rows.
- Masked: text/date values replaced and numeric values zeroed.
- Summary: numeric min/max/average, date range, and up to 20 categories.
- Types only: keys and inferred types.

Review every prompt before sending it externally. HyperPBI does not call an AI API itself. When validation fails, Copy repair prompt includes the original JSON, precise errors, field dictionary, and supported reference while instructing the AI not to rewrite working sections.

The generated prompt places a minimal dashboard object near the top and requires the AI to return that exact shape expanded, not Markdown. The response importer accepts surrounding prose, Markdown fences, safe smart-quote normalization, trailing commas, and export packages shaped as `{ "specification": {...}, "config": {...} }`. These repairs only address syntax: the extracted specification still must pass `validateSchema`, calculation validation, and field-reference checks. Invalid structure opens a repair panel with the detected reason, minimal template, and a copyable repair prompt.

The Skill tab is the densest reusable context document. Copy it at the start of an AI conversation when the model does not already know HyperPBI. It includes global styling, calculations, components, templates, maps, interactions, security restrictions, common mistakes, and the current normalized field dictionary.

The guided Builder adds goal, audience, layout pattern, selected components, and one of six professional presets. The generated prompt includes a categorized capability catalog and reusable recipes instead of only listing component names. It also describes drawers, segmented controls, timelines, matrices, small multiples, selected-row details, and sanitized JSON-only advanced ECharts.

Prefer normal components first. Use `advancedChart` only for justified radar, treemap, sankey, funnel, boxplot, calendar, network, combo, or waterfall patterns. Options cannot contain functions, formatter callbacks, event keys, URLs, or executable markup.

AI output must reference the normalized `key`, preferably a table-qualified key such as `workorders_status`. `displayName` is a UI label and must never be used as a field reference. For custom slicer-like lists, generate `repeat.distinctBy` plus `interactions.onClick` using `selectWhere` and `valueFromRow`; set `internal:false` and `external:true` so all choices remain visible while Power BI identities are selected.

Internal filtering changes HyperPBI data. External selection calls Power BI Selection Manager. Do not imply one automatically causes the other: external behavior also requires enabled formatting interactions, host permission, valid source-row identities, compatible semantic-model lineage/relationships, and report Edit-interactions configuration.

Never invent `externalSelection`, `selectionTarget`, `crossFilter`, or `powerBISelection` in dashboard JSON. Never emit JavaScript, `eval`, functions, inline handlers, scripts, iframes, or unsafe URLs.

Every catalog card includes a compact **Component JSON** example using placeholders such as `__field_key__`, plus a copy button. The catalog also provides one complete minimal dashboard JSON sample.
