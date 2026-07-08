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

The Component Catalog includes a complete, copyable JSON configuration for every component type. These examples cover the meaningful renderer properties, nested options, styling, and interaction flags; replace `__...field_key__` placeholders with normalized keys from the field dictionary.

Prefer normal components first. Use `advancedChart` for ECharts 6 declarative configuration. All bundled series and components are registered, including candlestick, chord, custom, effectScatter, lines, map, parallel, pictorialBar, themeRiver, tree, dataset/transforms, coordinate systems, brush/dataZoom, marks, toolbox, graphic, aria, Canvas, and SVG. Safe string formatter templates are supported; functions such as `renderItem`, event keys, URLs, and executable markup are not.

AI output must reference the normalized `key`, preferably a table-qualified key such as `workorders_status`. `displayName` is a UI label and must never be used as a field reference. Every new component must contain `interaction`. For custom slicers, keep `repeat.distinctBy` plus `interactions.onClick` using `selectWhere`/`valueFromRow`, and put policy in `interaction` with `internalMode:"none"`, `externalMode:"filter"`, and an explicit field.

Internal `none`/`highlight`/`filter` and external `none`/`auto`/`selection`/`filter` are independent. Auto filters controls/slicers and selects exact identities for rows, points, features, and items. Scope internal filters with `self`, `others`, or `all`. Use `internalMode:"none"` when the source must remain unchanged. Never guess an ambiguous external filter field. Runtime Config is only the external gate/fallback.

For custom slicer/list templates, use component `interaction.externalMode:"filter"`; for explicit custom row identity, use `"selection"`. Never generate deprecated component `internal`, `external`, `selectable`, or table `selectionMode`.

Never invent `externalSelection`, `selectionTarget`, `crossFilter`, or `powerBISelection` in dashboard JSON. Never emit JavaScript, `eval`, functions, inline handlers, scripts, iframes, or unsafe URLs.

Every catalog card includes a compact **Component JSON** example using placeholders such as `__field_key__`, plus a copy button. The catalog also provides one complete minimal dashboard JSON sample.
