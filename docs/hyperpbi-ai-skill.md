<!-- GENERATED FILE. Edit HYPERPBI_SKILL_MARKDOWN in src/docs/hyperpbiHelp.ts and run npm run docs:generate. -->
# HyperPBI dashboard authoring skill

Generate or repair declarative HyperPBI dashboard specifications for a Power BI custom visual. Version 2.0 is the default for every new specification. Preserve version 1.0 when improving an existing 1.0 dashboard unless the user explicitly requests migration.

## Output contract

Return exactly the output requested by the job and nothing else. Use valid JSON with no Markdown fence, prose, comment, trailing comma, JSON Patch, JavaScript, function, callback, event-handler string, credential, or invented field.

- Create and improve jobs return one complete specification object.
- Add-section jobs return the requested validated section package with its insertion target.
- Redesign-section jobs return one replacement component/section using the selected stable ID.
- Repair jobs return one complete corrected specification object.

For normal improvement and repair jobs, never return JSON Patch. Preserve stable component IDs, schema version, valid unrelated content, interactions, datasets, definitions, app state, and styling. Change only what the request or supplied diagnostics require.

## Strict 2.0 root

The minimal root is:

```json
{"version":"2.0","components":[]}
```

Allowed root properties are `version`, `title`, `theme`, `layout`, `state`, `app`, `leftPanel`, `rightPanel`, `toolbar`, `components`, `css`, `styles`, `calculations`, `data`, and `definitions`. Under `data`, only `datasets` is allowed. Version 2.0 rejects unknown root and component properties.

Every component requires `type` and a globally unique stable `id` matching `^[A-Za-z][A-Za-z0-9_-]{0,99}$`. IDs are behavior contracts: preserve them when the same component remains, and target only IDs that exist.

## Fields and the Field Manifest

Use only aliases supplied in the current Field Manifest. An alias is an AI-facing identifier; preparation resolves it to a canonical runtime key. Display names, source table/column names, and Power BI query names are metadata, not interchangeable authoring identifiers.

Respect field origin:

- A true model measure has model-measure origin and cannot be a basic model-column filter target.
- A query aggregation such as `Sum(Sales.Amount)` is an implicit aggregation over the model column `Sales.Amount`, not a model measure.
- Model columns with source table/column metadata can support external filters.
- Dataset-derived fields and dataset metrics are local results and cannot directly filter the semantic model.
- Renamed model columns and group-by fields retain source metadata when available.
- Exact external selection requires Power BI identities or source-row lineage; it is different from external filtering.

Never invent an alias, normalized key, model measure, aggregation, or business rule.

## Logical datasets

Declare named datasets at `data.datasets`. Each definition requires `source`, which is `powerbi` or another named dataset. Allowed properties are `source`, `filter`, `derive`, `rename`, `select`, `groupBy`, `metrics`, `distinct`, `sort`, and `limit`.

Runtime and static-schema order is: resolve source; filter; derive; rename; select; groupBy/metrics; distinct; sort; limit. Metric operations are `sum`, `avg`, `min`, `max`, `count`, `distinctCount`, and `first`. Derive expressions use the safe calculation DSL. No SQL, joins, arbitrary JavaScript, or network sources.

A component omitting `dataset` uses `powerbi`; otherwise it sees only the selected dataset's output fields. Validate references at the stage where they are used. Source cycles, unknown sources, collisions, and missing fields are errors. Lineage combines contributing source rows through grouping/distinct and enables identity selection when possible.

## Reusable definitions and application patterns

Root `definitions` are reusable component fragments. A component instance uses `use`; objects merge recursively, arrays are replaced, the definition's ID is removed, and every instance supplies its own stable ID. Cycles and unknown definitions are errors.

Available patterns are `kpi-row`, `trend-and-breakdown`, `record-explorer`, and `map-and-details`. A pattern is `{"type":"pattern","pattern":"...","id":"stable-id"}` plus the pattern's required fields. Patterns expand before validation; generated child IDs derive from the pattern ID. Use a pattern only when its structure matches the user's intent.

## Components

Use the canonical component catalog included with the prompt. It contains 84 types in 12 categories, including first-class semantic charts, native `table` and `matrix`, `map`, declarative `svg`, sanitized `svgMarkup`, and `advancedChart`. Use only properties listed for that type.

Prefer first-class components over custom markup: `card` over a simulated card, `listGroup` over a hand-built list, `dataGrid`/`detailPanel` over manual detail HTML, semantic charts over `advancedChart`, and `svg` over `svgMarkup`.

Shared 2.0 properties include `type`, `id`, `dataset`, `title`, `subtitle`, `span`, `className`, `hidden`, `props`, `style`, `css`, `slots`, `data`, `visibility`, `interactions`, `interaction`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, and `uiAction`. An interaction object is not required on every component.

## Application shell and overlays

Configure the application shell at root `app`, never `schema.app`. It can define brand, navbar, sidebar, page header, footer, density, container, and layout. Use a permanent shell only when the visual size supports it; prefer `offcanvas` for narrow layouts.

Overlay components require unique IDs. Target existing IDs with `openOverlay`, `closeOverlay`, or `toggleOverlay`. Use dropdown for commands, popover for contextual content, offcanvas for details/filters, and modal for focused blocking work.

## Three interaction systems

1. `uiAction` changes interface state. Types: `clearFilters`, `setTab`, `setState`, `toggleState`, `toggleSidebar`, `openOverlay`, `closeOverlay`, `toggleOverlay`, `setStep`, `nextStep`, `previousStep`, `showToast`, `dismissToast`, `scrollTo`, and `refresh` (safe no-op).
2. Universal `interaction` controls data behavior: trigger `auto|click|change`; internal mode `none|highlight|filter`; scope `self|others|all`; external mode `none|auto|selection|filter`; operators `=|!=|>|>=|<|<=|contains|in|between`; selection mode `replace|toggle|add`.
3. `interactions` maps safe component events to allowlisted actions such as `selectRow`, `selectWhere`, `clearSelection`, `setFilter`, `clearFilter`, `setState`, `toggleState`, `openTab`, `toggleCollapse`, `drillToDetail`, `highlight`, and `clearHighlight`.

These systems are independent and can coexist. `externalMode: "auto"` resolves to filter for controls and selection for data points/custom content. External filter mode requires a supplied real model-column alias. Do not claim a dataset metric or derived field can directly filter Power BI.

## SVG and svgMarkup

Use `svg` for governed diagrams, gauges, pictorial marks, process flows, and schematics—not standard analytical charts. Supported structured elements are `g`, `path`, `rect`, `circle`, `ellipse`, `line`, `polyline`, `polygon`, `text`, `tspan`, `defs`, `linearGradient`, `radialGradient`, `stop`, `clipPath`, `mask`, `marker`, `title`, and `desc`.

Values can be literal, bound, templated, scaled, mapped, conditional, or state-based. Data contexts are `aggregate`, `selectedRow`, and `first`. Repeats are bounded and may select a dataset. Animation presets are `fade-in`, `slide-in`, `scale-in`, `pulse`, `float`, `swim`, `rotate`, `draw-path`, `progress-fill`, `follow-progress`, `flow-dash`, `blink-status`, `bounce`, and `shimmer`; triggers are `auto`, `hover`, `focus`, `selected`, `dataChange`, `state`, and `none`. Include an accessible label and respect reduced motion.

Use `svgMarkup` only when structured SVG is insufficient. It is a sanitized single SVG document: no script, handlers, style element/attribute, external URL, `foreignObject`, image, use, link, animation element, or field-injected path data.

## Maps

Prefer Power BI geometry, latitude/longitude, X/Y, or address bindings. Map center order is `[latitude, longitude]`. External sources are public HTTPS `arcgisFeature`, `arcgisTile`, or basic `arcgisDynamic` services subject to the installed Maps package and host allowlist. Never invent a URL, layer ID, field, host, token, or credential. Do not promise secured services, editing, 3D, relationships, tracing, or non-4326 output.

## Repair behavior

Use supplied structured diagnostics as the authority. HyperPBI's automatic preparation repairs only unambiguous cases: add version 2.0 when the shape is unmistakable, generate missing 2.0 component IDs on import, correct the known property typos `meausre`, `catgory`, `componets`, and `aggregration`, and convert numeric strings for bounded numeric properties. It does not repair comments, smart quotes, truncated JSON, unknown business fields, ambiguous aliases, unknown component types, unsafe content, or speculative intent.

## Security

Never emit user JavaScript, eval, functions, callbacks, inline handlers, scripts, iframes, arbitrary URLs, CSS imports, credentials, AI keys, SQL, joins, or network datasets. HTML is sanitized. CSS is parsed, allowlisted, and scoped. ECharts options are recursively sanitized and semantic chart options cannot replace generated data bindings. SVG is allowlisted, namespaced, sanitized, and limited. ArcGIS access is HTTPS and host-policy controlled.

## HyperPBI 1.0 compatibility

Existing 1.0 specifications and canonical normalized field keys remain supported. Legacy accordion children, drawer/filterDrawer, stepper, button `action`/`actionValue`, `table.engine: "tabulator"`, legacy map settings/style/popup, and deprecated `internal`, `external`, `selectable`, and table `selectionMode` are compatibility inputs. Do not use them as the primary 2.0 authoring contract. Do not silently migrate a 1.0 specification; preserve its version during normal improvements and migrate only on explicit request.
