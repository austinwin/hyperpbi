import { componentDefinitions } from "../catalog/componentDefinitions";

const componentCount = componentDefinitions.length;
const categoryCount = new Set(componentDefinitions.map(component => component.category)).size;

export const HYPERPBI_HELP_MARKDOWN = `# HyperPBI authoring guide

HyperPBI compiles declarative JSON into a Power BI dashboard. Use **version 2.0 for new authoring**. Existing version 1.0 specifications remain supported as compatibility input.

Canonical component descriptors own schema, field traversal, Inspector controls/containers, maturity, documentation, and valid example metadata. Field Manifest aliases are recommended for nested 2.0 bindings; direct/row/item/datum templates resolve through the shared field engine while metric, state, selected, runtime, ArcGIS service, and joined namespaces remain separate. The permanent responsive Inspector validates transactions, supports preview selection and generated-owner mapping, and retains invalid complex drafts without replacing the last valid dashboard. AI section jobs use strict descriptor-compatible change packages and atomically promote the fully validated result to the working JSON and preview. Root calculated fields are first-class row fields but never direct Power BI model-filter targets. Tile, geocoder, and sanitized-origin ArcGIS service access are independent, and the geocoder defaults to none.

## Studio workflow

1. Review the Field Manifest and dashboard setup.
2. Copy the generated prompt to an externally approved AI. HyperPBI does not call an AI API and stores no AI key.
3. Paste one complete JSON response into Studio.
4. Validate and preview; use structured diagnostics or the repair prompt when necessary.
5. Save and return to the report.

## Version 2.0 contract

The root requires \`version: "2.0"\` and \`components: []\`. Optional roots are \`title\`, \`theme\`, \`layout\`, \`state\`, \`app\`, \`leftPanel\`, \`rightPanel\`, \`toolbar\`, \`css\`, \`styles\`, \`calculations\`, \`data.datasets\`, and \`definitions\`. Unknown root and component properties are errors. Every component requires a globally unique stable ID.

Use Field Manifest aliases in AI-authored JSON. Preparation resolves aliases to canonical runtime keys. A display name is not automatically an alias. A query wrapper such as \`Sum(Sales.Amount)\` is still a summarized model column, not a true model measure.

## Logical datasets, definitions, and patterns

Components without \`dataset\` use \`powerbi\`; a named dataset is local to components that select it. Dataset operations run as filter → derive → rename → select → groupBy/metrics → distinct → sort → limit after resolving \`source\`. Derived fields and metrics cannot directly filter the Power BI model; source-row lineage can preserve identity selection.

Reusable \`definitions\` deep-merge objects, replace arrays, and require a new ID at each \`use\` site. Patterns \`kpi-row\`, \`trend-and-breakdown\`, \`record-explorer\`, and \`map-and-details\` expand to normal components with deterministic child IDs.

## Components and behavior

The canonical catalog contains ${componentCount} types in ${categoryCount} categories: Layout, Controls, Navigation, Display, Primitives, Feedback, Forms, Charts, Tables, Maps, Custom components, and Advanced components. See the generated catalog for exact required and allowed properties.

- \`uiAction\`: safe interface state, tabs, steps, overlays, toasts, scrolling, and filter clearing.
- \`interaction\`: universal internal highlight/filter and external Power BI selection/filter policy.
- \`interactions\`: allowlisted event-specific payloads for custom content.

These systems are independent and optional. External filtering needs a real model-column target. True measures, derived fields, and dataset metrics are not model-filter targets.

## SVG and maps

Prefer declarative \`svg\` for governed diagrams, pictorial marks, schematics, and custom gauges. It supports bindings, scales, conditions, state, bounded repeats, allowlisted animations, normal interactions, ID isolation, and reduced motion. Use \`svgMarkup\` only when structured SVG cannot express the design; raw markup is strictly sanitized and cannot load resources or inject path data.

HyperPBI exposes one flexible Power BI **Values** field well. For new maps, declare explicit \`layers[]\`, select each layer's optional logical \`dataset\`, and bind geometry, coordinates, attributes, labels, popups, interactions, and joins through canonical layer JSON. A Power BI layer's \`source.bindings\` wins; otherwise conservative semantic-type and exact-name inference may resolve a field. Runtime Config map bindings are compatibility input only for a legacy map without explicit layers.

Map Studio edits that same canonical JSON and uses the preview's prepared calculations, Runtime Config transformations/aliases, logical datasets, field metadata, row keys, and source lineage. It provides a layer tree, metadata-driven service fields after an explicit fetch, renderers, labels, popup/tooltip configuration, an explicit bounded runtime-equivalent join preview, source-aware filters/visibility/interactions, transaction-based text editing, groups, and live-preview bookmarks. Logical datasets produce filtered, derived, selected, or grouped layer views over the one flattened Power BI data view received by the visual; they never issue independent semantic-model queries. Grouped features retain all contributing source identities where Power BI supplied them.

Map attributes use exact \`powerbi\`, \`service\`, or \`joined\` field sources. Stable point shapes are circle, square, diamond, and triangle; explicit clusters support count and numeric sum labels. Basemap and authored view edits update the mounted map; \`view.fitPadding\` is a ratio from 0 through 0.5 with default 0.08. Metadata and join requests are explicit, cancellable, policy-gated actions and never persist credentials. Unsupported analytical tools, secured services, feature editing, 3D, geoprocessing, and independent semantic-model queries remain unavailable. Geocoder behavior is unchanged.

Map Studio validates drafts against the exact current Runtime Config supplied by its owner; it never synthesizes a default. ArcGIS inspection makes one root request, classifies groups, spatial layers, and tables, and lazily fetches item metadata only after a selectable spatial layer is chosen. Map-layer interactions support \`click\` only. The shared runtime enforces join cardinality and unmatched-row policies, reports discarded aggregation values, bounds class breaks for small or repeated samples, reactively replaces changed external tile/dynamic definitions, and reports diagnostics at canonical JSON Pointer paths scoped to the selected layer.

Maps also support public HTTPS ArcGIS feature, tile, and basic dynamic sources. External services, tiles, and geocoding require a Maps package and its WebAccess host policy. Never place tokens or credentials in dashboard JSON. Coordinate diagnostics distinguish incomplete pairs, nonnumeric/out-of-range values, and current visual-query aggregation from the model default. One point uses a bounded detail zoom and multiple points fit bounds. Search remains user-triggered; public Nominatim requires deliberate expert configuration and is not a production-reliability guarantee.

The native matrix renders every declared value metric, including column-group × metric headers, per-metric formatting/totals/heatmaps, accessible labels, source-row interactions, deterministic row limits, and a visible 5,000-cell budget. Numeric aggregation requirements come from the same operation policy used by calculation, dataset, schema, Inspector, and field-reference validation.

## Security boundaries

No user JavaScript, functions, callbacks, inline handlers, scripts, iframes, SQL, network datasets, or credentials. HTML is sanitized; CSS is parsed, allowlisted, and scoped; ECharts options are recursively sanitized; SVG elements, attributes, references, depth, paths, repeats, and animations are bounded; URLs and ArcGIS hosts are policy-controlled.`;

export const HYPERPBI_SKILL_MARKDOWN = `# HyperPBI dashboard authoring skill

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

\`\`\`json
{"version":"2.0","components":[]}
\`\`\`

Allowed root properties are \`version\`, \`title\`, \`theme\`, \`layout\`, \`state\`, \`app\`, \`leftPanel\`, \`rightPanel\`, \`toolbar\`, \`components\`, \`css\`, \`styles\`, \`calculations\`, \`data\`, and \`definitions\`. Under \`data\`, only \`datasets\` is allowed. Version 2.0 rejects unknown root and component properties.

Every component requires \`type\` and a globally unique stable \`id\` matching \`^[A-Za-z][A-Za-z0-9_-]{0,99}$\`. IDs are behavior contracts: preserve them when the same component remains, and target only IDs that exist.

## Fields and the Field Manifest

Use only aliases supplied in the current Field Manifest. An alias is an AI-facing identifier; preparation resolves it to a canonical runtime key. Display names, source table/column names, and Power BI query names are metadata, not interchangeable authoring identifiers.

Respect field origin:

- A true model measure has model-measure origin and cannot be a basic model-column filter target.
- A query aggregation such as \`Sum(Sales.Amount)\` is an implicit aggregation over the model column \`Sales.Amount\`, not a model measure.
- Model columns with source table/column metadata can support external filters.
- Dataset-derived fields and dataset metrics are local results and cannot directly filter the semantic model.
- Renamed model columns and group-by fields retain source metadata when available.
- Exact external selection requires Power BI identities or source-row lineage; it is different from external filtering.

Never invent an alias, normalized key, model measure, aggregation, or business rule.

## Logical datasets

Declare named datasets at \`data.datasets\`. Each definition requires \`source\`, which is \`powerbi\` or another named dataset. Allowed properties are \`source\`, \`filter\`, \`derive\`, \`rename\`, \`select\`, \`groupBy\`, \`metrics\`, \`distinct\`, \`sort\`, and \`limit\`.

Runtime and static-schema order is: resolve source; filter; derive; rename; select; groupBy/metrics; distinct; sort; limit. Metric operations are \`sum\`, \`avg\`, \`min\`, \`max\`, \`count\`, \`distinctCount\`, and \`first\`. Derive expressions use the safe calculation DSL. No SQL, joins, arbitrary JavaScript, or network sources.

A component omitting \`dataset\` uses \`powerbi\`; otherwise it sees only the selected dataset's output fields. Validate references at the stage where they are used. Source cycles, unknown sources, collisions, and missing fields are errors. Lineage combines contributing source rows through grouping/distinct and enables identity selection when possible.

## Reusable definitions and application patterns

Root \`definitions\` are reusable component fragments. A component instance uses \`use\`; objects merge recursively, arrays are replaced, the definition's ID is removed, and every instance supplies its own stable ID. Cycles and unknown definitions are errors.

Available patterns are \`kpi-row\`, \`trend-and-breakdown\`, \`record-explorer\`, and \`map-and-details\`. A pattern is \`{"type":"pattern","pattern":"...","id":"stable-id"}\` plus the pattern's required fields. Patterns expand before validation; generated child IDs derive from the pattern ID. Use a pattern only when its structure matches the user's intent.

## Components

Use the canonical component catalog included with the prompt. It contains ${componentCount} types in ${categoryCount} categories, including first-class semantic charts, native \`table\` and \`matrix\`, \`map\`, declarative \`svg\`, sanitized \`svgMarkup\`, and \`advancedChart\`. Use only properties listed for that type.

Prefer first-class components over custom markup: \`card\` over a simulated card, \`listGroup\` over a hand-built list, \`dataGrid\`/\`detailPanel\` over manual detail HTML, semantic charts over \`advancedChart\`, and \`svg\` over \`svgMarkup\`.

For new authoring, exclude legacy and deprecated types. Include experimental types only when explicitly requested and beta types only when explicitly requested or advanced authoring is selected. Existing dashboards may continue loading non-stable types. Stable requires renderer, strict schema, applicable field metadata, Inspector metadata, valid example, responsive/empty-state behavior, accessibility guidance, focused tests, and documentation evidence.

Shared 2.0 properties include \`type\`, \`id\`, \`dataset\`, \`title\`, \`subtitle\`, \`span\`, \`className\`, \`hidden\`, \`props\`, \`style\`, \`css\`, \`slots\`, \`data\`, \`visibility\`, \`interactions\`, \`interaction\`, \`ariaLabel\`, \`icon\`, \`variant\`, \`size\`, \`disabled\`, \`tooltip\`, and \`uiAction\`. An interaction object is not required on every component.

## Application shell and overlays

Configure the application shell at root \`app\`, never \`schema.app\`. It can define brand, navbar, sidebar, page header, footer, density, container, and layout. Use a permanent shell only when the visual size supports it; prefer \`offcanvas\` for narrow layouts.

Overlay components require unique IDs. Target existing IDs with \`openOverlay\`, \`closeOverlay\`, or \`toggleOverlay\`. Use dropdown for commands, popover for contextual content, offcanvas for details/filters, and modal for focused blocking work.

## Targeted change packages

Use \`kind: "hyperpbi-change"\` and only the properties permitted by the operation. \`replace\` requires a matching \`targetId\` and \`component.id\`; \`insertBefore\` and \`insertAfter\` target a component in an ordered array; \`appendChild\` requires a descriptor-compatible relative \`containerPath\` such as \`children\`, \`footer\`, \`tabs/1/content\`, or \`items/0/children\`; \`appendRoot\` uses exactly \`components\`, \`toolbar\`, \`leftPanel\`, or \`rightPanel\`; \`remove\` carries only \`targetId\`. Never use absolute or parent paths. Validate the complete resulting dashboard; a successful result becomes the working JSON and preview together.

## Three interaction systems

1. \`uiAction\` changes interface state. Types: \`clearFilters\`, \`setTab\`, \`setState\`, \`toggleState\`, \`toggleSidebar\`, \`openOverlay\`, \`closeOverlay\`, \`toggleOverlay\`, \`setStep\`, \`nextStep\`, \`previousStep\`, \`showToast\`, \`dismissToast\`, \`scrollTo\`, and \`refresh\` (safe no-op).
2. Universal \`interaction\` controls data behavior: trigger \`auto|click|change\`; internal mode \`none|highlight|filter\`; scope \`self|others|all\`; external mode \`none|auto|selection|filter\`; operators \`=|!=|>|>=|<|<=|contains|in|between\`; selection mode \`replace|toggle|add\`.
3. \`interactions\` maps safe component events to allowlisted actions such as \`selectRow\`, \`selectWhere\`, \`clearSelection\`, \`setFilter\`, \`clearFilter\`, \`setState\`, \`toggleState\`, \`openTab\`, \`toggleCollapse\`, \`drillToDetail\`, \`highlight\`, and \`clearHighlight\`.

These systems are independent and can coexist. \`externalMode: "auto"\` resolves to filter for controls and selection for data points/custom content. External filter mode requires a supplied real model-column alias. Do not claim a dataset metric or derived field can directly filter Power BI.

The universal trigger vocabulary is component-wide, but map layers currently implement \`click\` only. A map layer using \`auto\` or \`change\` is invalid and must be repaired before rendering.

## SVG and svgMarkup

Use \`svg\` for governed diagrams, gauges, pictorial marks, process flows, and schematics—not standard analytical charts. Supported structured elements are \`g\`, \`path\`, \`rect\`, \`circle\`, \`ellipse\`, \`line\`, \`polyline\`, \`polygon\`, \`text\`, \`tspan\`, \`defs\`, \`linearGradient\`, \`radialGradient\`, \`stop\`, \`clipPath\`, \`mask\`, \`marker\`, \`title\`, and \`desc\`.

Values can be literal, bound, templated, scaled, mapped, conditional, or state-based. Data contexts are \`aggregate\`, \`selectedRow\`, and \`first\`. Repeats are bounded and may select a dataset. Animation presets are \`fade-in\`, \`slide-in\`, \`scale-in\`, \`pulse\`, \`float\`, \`swim\`, \`rotate\`, \`draw-path\`, \`progress-fill\`, \`follow-progress\`, \`flow-dash\`, \`blink-status\`, \`bounce\`, and \`shimmer\`; triggers are \`auto\`, \`hover\`, \`focus\`, \`selected\`, \`dataChange\`, \`state\`, and \`none\`. Include an accessible label and respect reduced motion.

Use \`svgMarkup\` only when structured SVG is insufficient. It is a sanitized single SVG document: no script, handlers, style element/attribute, external URL, \`foreignObject\`, image, use, link, animation element, or field-injected path data.

## Maps

All Power BI fields arrive through the single \`Values\` role. Prefer explicit \`layers[]\`; select a logical \`layer.dataset\` when needed; and configure each Power BI layer's \`source.bindings\` for geometry, latitude/longitude, X/Y, address, grouping, color, size, tooltip, and details. Never depend on a map-specific Power BI field bucket. A layer omitting \`dataset\` inherits the map dataset, then \`powerbi\`. Explicit layers never inherit global Runtime Config coordinates; those bindings exist only for legacy one-layer compatibility. Semantic types and conservative exact names are fallback discovery, not a multilayer contract. Map center order is \`[latitude, longitude]\`.

Power BI supplies one flattened visual data view. Fields may originate from related model tables, but row grain and combinations are determined by the visual query and semantic-model relationships. Logical datasets only transform that received data; they do not query model tables independently or create relationships. ArcGIS reference-only maps require no Values fields; never add unrelated model fields merely to activate an external layer. External sources are public HTTPS \`arcgisFeature\`, \`arcgisTile\`, or basic \`arcgisDynamic\` services subject to the installed Maps package and host allowlist. Geocoding defaults to none, is user-triggered, and is unchanged by layer authoring. Never invent a URL, layer ID, field, host, token, or credential. Do not promise secured services, feature editing, 3D, geoprocessing, relationships, tracing, or complete Esri builder parity. Treat heatmap, density grid, exact service-scale visibility, and mounted-view preservation according to their emitted experimental/partial diagnostics. Generalization and progressive-rendering properties are deprecated compatibility input and must not be authored.

Map Studio and the preview share prepared calculations/configuration/datasets/lineage. Map attributes use exact \`powerbi|service|joined\` sources, and service queries include only service fields. \`view.fitPadding\` is a ratio from 0 through 0.5, normally 0.08. Stable point symbols are circle, square, diamond, and triangle; explicit clusters support count and numeric sum labels. Metadata fetch, bounded join preview, interaction compatibility, and live-view bookmark capture are explicit Studio workflows rather than persisted service metadata. Do not promise unsupported analytical tools.

Map Studio validates every draft against the exact current Runtime Config supplied by its owner and never fabricates a default. Service inspection performs one root request, distinguishes groups, selectable spatial layers, and tables, and lazily fetches selected-layer metadata with successful-result caching. Join behavior is cardinality-aware: \`oneToOne\` rejects duplicates on either side, \`manyToOne\` permits repeated Power BI keys but requires unique service keys, and unmatched/aggregation diagnostics follow the declared policies. Numeric aggregations ignore blanks and non-finite or nonnumeric values; an empty valid set yields null. Class breaks cap the requested count to the color ramp and distinct sample values, collapse repeated quantile boundaries, and keep the final upper bound inclusive. External tile and dynamic layers are reused when their stable definition is unchanged and replaced or removed when meaningful definitions or access policy change. Diagnostics use canonical JSON Pointer paths and are scoped to the selected layer.

## Repair behavior

Use supplied structured diagnostics as the authority. HyperPBI's automatic preparation repairs only unambiguous cases: add version 2.0 when the shape is unmistakable, generate missing 2.0 component IDs on import, correct the known property typos \`meausre\`, \`catgory\`, \`componets\`, and \`aggregration\`, and convert numeric strings for bounded numeric properties. It does not repair comments, smart quotes, truncated JSON, unknown business fields, ambiguous aliases, unknown component types, unsafe content, or speculative intent.

## Security

Never emit user JavaScript, eval, functions, callbacks, inline handlers, scripts, iframes, arbitrary URLs, CSS imports, credentials, AI keys, SQL, joins, or network datasets. HTML is sanitized. CSS is parsed, allowlisted, and scoped. ECharts options are recursively sanitized and semantic chart options cannot replace generated data bindings. SVG is allowlisted, namespaced, sanitized, and limited. ArcGIS access is HTTPS and host-policy controlled.

## HyperPBI 1.0 compatibility

Existing 1.0 specifications and canonical normalized field keys remain supported. Legacy accordion children, drawer/filterDrawer, stepper, button \`action\`/\`actionValue\`, \`table.engine: "tabulator"\`, legacy map settings/style/popup, and deprecated \`internal\`, \`external\`, \`selectable\`, and table \`selectionMode\` are compatibility inputs. Do not use them as the primary 2.0 authoring contract. Do not silently migrate a 1.0 specification; preserve its version during normal improvements and migrate only on explicit request.`;
