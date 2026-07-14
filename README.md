# HyperPBI

HyperPBI is a schema-driven Power BI custom visual that turns declarative JSON into interactive dashboards and application-style report experiences. It binds to the current Power BI data view, validates authoring input, prepares logical datasets and reusable structures, and renders only implemented components and safe behaviors.

HyperPBI does not call an AI service. Studio builds a prompt from the current Field Manifest and authoring settings; the user copies that prompt to an externally approved AI, then pastes one JSON response back into HyperPBI for extraction, validation, preview, and saving.

## Current status and schema versions

- HyperPBI **2.0** is the default contract for new authoring: stable IDs, Field Manifest aliases, strict unknown-property diagnostics, named datasets, reusable definitions, application patterns, and structured repair.
- HyperPBI **1.0** remains supported for existing dashboards. Normalized runtime keys and legacy component forms are compatibility inputs, not the recommended 2.0 authoring style.
<!-- component-summary:start -->
- The canonical implementation defines **84 component types in 12 categories**. The count and catalog are generated from source metadata; see the [component catalog](docs/hyperpbi-component-catalog-reference.md).
<!-- component-summary:end -->
- Power BI visual package version `1.0.0.0` in `pbiviz.json` is a package version and is independent of the dashboard schema version.

## Core workflow

1. Import the appropriate PBIVIZ package and bind the required Power BI fields to **Values**.
2. Open HyperPBI Studio and review the field list/Field Manifest.
3. Choose a prompt job and authoring settings.
4. Copy the generated prompt to an approved external AI.
5. Paste one JSON response into Studio.
6. Validate and preview. If invalid, use the structured diagnostics and repair prompt.
7. Save and return to the report.

The permanent Visual Inspector can select a rendered component, locate its canonical authoring JSON (including generated runtime ownership), edit that fragment, and preserve stable IDs. It provides searchable keyboard navigation, dataset-aware controls, descriptor-validated add/insert/move/duplicate/delete operations, responsive Tree/Properties panes, and bounded transaction undo/redo. Every candidate is prepared and validated as a complete dashboard; invalid input remains a local draft and never replaces the last valid specification.

## HyperPBI 2.0 authoring model

The minimal contract is:

```json
{
  "version": "2.0",
  "components": []
}
```

Allowed root properties are `version`, `title`, `theme`, `layout`, `state`, `app`, `leftPanel`, `rightPanel`, `toolbar`, `components`, `css`, `styles`, `calculations`, `data`, and `definitions`. Under `data`, only `datasets` is accepted. Version 2.0 rejects unknown root and component properties.

Every component needs a globally unique stable `id` that starts with a letter and contains only letters, digits, `_`, or `-` (maximum 100 characters). IDs connect inspector edits, UI-action targets, overlay state, interaction state, and pattern expansion, so improvements should preserve them whenever the same component remains.

Preparation follows the implementation pipeline: safe unambiguous import repairs; 1.0 compatibility migrations; optional ID assignment; definition expansion; pattern expansion; design-system validation; dataset field resolution and static dataset schemas; component dataset validation; field-alias resolution; design-system expansion; strict schema validation; then calculation/reference checks before render.

## Field aliases and Power BI metadata

The Field Manifest separates concepts that older documentation often conflated:

| Concept | Meaning |
|---|---|
| AI alias | Stable camel-case identifier used in new 2.0 authoring |
| Canonical runtime key | Internal normalized key used after preparation |
| Display name | Power BI label shown to a person; not necessarily a valid reference |
| Source table/column | Semantic-model origin used to construct external filter targets |
| True model measure | Power BI measure (`kind: "measure"`); not a basic column-filter target |
| Query aggregation wrapper | Query expression such as `Sum(Sales.Amount)` around a model column |
| Implicit aggregation | `isImplicitAggregation: true`; the underlying item is still a model column |
| Dataset-derived field | Row expression output local to a logical dataset |
| Dataset metric | Grouped aggregate output local to a logical dataset |
| Dataset group field | Group-by output; retains model-column origin metadata when available |

`Sum(Sales.Amount)` must not be described as a model measure merely because the visual query summarizes it. A real model column with `sourceTable` and `sourceColumn` can support external filtering. Exact identity selection is separate: it requires Power BI identities or dataset source-row lineage.

Alias privacy modes range from sample-bearing profiles to masked, summary, fields-only, and types-only manifests. Do not place confidential sample values, credentials, AI keys, ArcGIS tokens, or private service URLs in prompts or dashboard JSON.

## Logical datasets

Named datasets live at `data.datasets`. Every definition has a `source` of `powerbi` or another named dataset. After source resolution, both runtime evaluation and static schema propagation use this order:

`filter → derive → rename → select → groupBy/metrics → distinct → sort → limit`

Components omit `dataset` to use the base `powerbi` data view or name one dataset to use only that output schema. Dataset chains are deterministic, cycle-checked, cached by canonical definition/input signatures, and retain source-row lineage through filtering, grouping, and deduplication. Static schemas keep generated fields available even when the runtime result has zero rows.

Logical datasets do not execute SQL, join arbitrary sources, call the network, or run JavaScript. See the [data model reference](docs/data-model.md).

## Components and application patterns

The generated catalog derives type, label, category, status, intended use, level, capabilities, required/allowed properties, interaction/UI-action support, accessibility guidance, compatibility notes, related types, and valid examples from canonical TypeScript metadata.

Categories are Layout, Controls, Navigation, Display, Primitives, Feedback, Forms, Charts, Tables, Maps, Custom components, and Advanced components. The inventory includes `svg`, `svgMarkup`, `advancedChart`, custom-content components, and compatibility-only forms.

Four 2.0 application patterns compile to existing runtime components with deterministic child IDs:

- `kpi-row`
- `trend-and-breakdown`
- `record-explorer`
- `map-and-details`

Reusable root `definitions` deep-merge objects, replace arrays, remove definition IDs, and require every `use` instance to provide its own stable ID. Patterns and definitions are authoring conveniences; they do not add renderer behavior.

## Charts, tables, maps, and SVG

Semantic charts include bar, horizontal bar, line, area, pie, donut, scatter, gauge, heatmap, combo, waterfall, sankey, treemap, funnel, radar, and small multiples. Their ECharts `options` can alter safe presentation but cannot replace generated datasets, axes, series types/counts, links, nodes, encodings, or transforms. `advancedChart` is the sanitized JSON-only escape hatch for implemented ECharts configurations that a semantic chart cannot express.

`table` is the supported native detail table. `matrix` renders every declared value metric across optional column groups, with per-metric formatting, totals, heatmaps, accessible headers, source-row interactions, deterministic row limits, and a visible cell-budget warning. Its shared aggregation policy requires numeric fields for numeric operations while `count` may omit a field. Tabulator is not bundled; `engine: "tabulator"` is normalized only for compatibility.

`map` uses the same single **Values** field well as every other HyperPBI component. New 2.0 maps declare explicit layers, optional per-layer logical datasets, and per-layer `source.bindings`; explicit layers never inherit global Runtime Config coordinates. Map Studio edits canonical JSON for layer groups, bookmarks, renderers, labels, safe popups/tooltips, joins, structured filters, performance limits, and diagnostics. Conservative semantic/exact-name discovery remains a fallback, and legacy Runtime Config bindings remain one-layer compatibility input. Public ArcGIS feature, tile, and dynamic sources require a Maps package and an approved HTTPS host. See [map services](docs/map-services.md).

`svg` is the preferred governed vector system for diagrams, schematics, pictorial marks, and custom gauges. It uses structured allowlisted elements, bindings, scales, conditions, state, bounded repeats, normal interactions, ID isolation, animation presets, and reduced-motion handling. `svgMarkup` is a strictly sanitized fallback for a single raw SVG document. See [SVG visuals](docs/svg-visuals.md).

For content, distinguish `text`, `markdown`, sanitized `html`, repeated/scoped `custom`, declarative `svg`, and sanitized `svgMarkup`. Prefer a first-class component when one fits.

## Interactions

HyperPBI has three separate declarative systems:

1. `uiAction` changes interface state: tabs, steps, sidebar, overlays, toasts, scrolling, filter clearing, and a safe refresh no-op.
2. Universal `interaction` controls internal `none|highlight|filter` behavior and external Power BI `none|auto|selection|filter` behavior.
3. `interactions` maps supported component events to allowlisted custom payload actions.

`externalMode: "auto"` resolves to filter for controls and selection for data-point/custom components. External filter mode requires a model-column target; true measures, dataset-derived fields, and dataset metrics cannot directly filter Power BI. Dataset lineage can map a derived/grouped row back to contributing source identities for selection. See [interactions](docs/interactions.md).

## Studio, prompts, and repair

Prompt jobs are Create dashboard, Improve current dashboard, Add section, Redesign selected section, and Repair invalid JSON. Create/improve/repair normally return a complete specification. Add-section returns a strict change package for before, after, a descriptor-compatible nested `containerPath`, or a root `components|toolbar|leftPanel|rightPanel` destination; redesign returns one replacement using the selected stable ID. Studio validates and previews the complete resulting dashboard, shows the mutation summary and warnings, and waits for explicit Apply. Normal improvements and repairs return complete JSON, not JSON Patch.

Prompt composition includes only relevant component modules, Field Manifest data under the chosen privacy mode, recommended patterns, applicable datasets/maps/tables/charts/SVG guidance, current JSON for improvement, selected ID for redesign, and structured diagnostics for repair.

The importer accepts one JSON object directly or inside one Markdown fence and can extract one unambiguous object from surrounding text. Multiple candidate objects, comments, smart quotes, or truncated JSON produce diagnostics rather than speculative repair. Automatic preparation repairs only known property typos, unambiguous numeric strings, an unmistakably missing 2.0 version, and missing 2.0 import IDs. It never substitutes fields, changes aggregations, deletes components, removes interactions, or rewrites business logic.

## Security

- No user JavaScript, `eval`, `new Function`, callbacks, inline handlers, scripts, iframes, arbitrary SQL, or network datasets.
- HTML is sanitized; forms and executable/embed elements are removed in normal mode.
- CSS is parsed, property-allowlisted, scoped, and stripped of imports, external URLs, fixed positioning, abusive z-index, and unsafe animation forms.
- ECharts options are recursively sanitized; functions, URL-bearing keys, executable strings, and unsafe semantic data overrides are removed.
- SVG elements/attributes/references are allowlisted, IDs are namespaced, external resources are blocked, and exact element/path/depth/repeat/animation limits are enforced.
- ArcGIS and provider URLs require HTTPS, no embedded credentials, an allowed host, and the appropriate package privilege.
- Prompt data stays local until the user copies it. HyperPBI has no AI API key and should never receive credentials in dashboard JSON.

See the full [security model](docs/security.md).

## Package profiles

```powershell
npm run package:core
npm run package:maps
```

- **Core** removes WebAccess privileges. Bound Power BI geometry remains available; external tiles, ArcGIS services, and geocoders are unavailable.
- **Maps broad** is the default Maps packaging mode and uses `https://*` WebAccess (`HYPERPBI_ALLOW_ALL_MAP_HOSTS` not set to `false`).
- **Maps restricted** uses built-in approved hosts plus comma-separated `HYPERPBI_MAP_HOSTS` when `HYPERPBI_ALLOW_ALL_MAP_HOSTS=false`.

The packaging script labels outputs `*-core.pbiviz`, `*-maps-broad.pbiviz`, or `*-maps-restricted.pbiviz`; it also writes the compatibility alias `*-maps.pbiviz` for a Maps package. Exact base names derive from the PBIVIZ packager, so documentation should not invent a fixed artifact filename.

## Development commands

```powershell
npm install
npm run start
npm run typecheck
npm test
npm run lint
npm run docs:generate
npm run docs:check
npm run package:core
npm run package:maps
npm run package:verify
```

`npm run docs:generate` is documentation-only. It executes canonical TypeScript metadata without building the visual and regenerates:

- `docs/hyperpbi-component-catalog-reference.md`
- `hyperpbi-component-catalog-reference.html`
- `docs/hyperpbi-ai-skill.md`

## Documentation index

| Document | Purpose |
|---|---|
| [User guide](docs/user-guide.md) | Power BI and Studio workflow |
| [2.0 specification](docs/hyperpbi-spec-reference.md) | Root, components, app, styles, behavior, diagnostics |
| [Generated component catalog](docs/hyperpbi-component-catalog-reference.md) | Canonical component inventory and examples |
| [AI authoring](docs/ai-authoring.md) | Prompt jobs, modules, privacy, and output contracts |
| [ChatGPT guideline](docs/chatgpt-guideline.md) | Concise external-AI response rules |
| [AI skill](docs/hyperpbi-ai-skill.md) | Generated checked-in authoring skill |
| [Data model](docs/data-model.md) | Fields, datasets, lineage, caching, zero rows |
| [Calculations](docs/calculations-dsl.md) | Root calculations and expression DSL |
| [Interactions](docs/interactions.md) | UI actions, universal behavior, custom events |
| [Custom content](docs/custom-components.md) | Text, Markdown, HTML, custom, SVG variants |
| [SVG visuals](docs/svg-visuals.md) | Structured SVG, markup fallback, limits, motion |
| [Map services](docs/map-services.md) | Power BI geometry, ArcGIS, providers, packaging |
| [Repair workflow](docs/repair-workflow.md) | Extraction, diagnostics, and bounded repairs |
| [Migration/versioning](docs/migration-versioning.md) | Intentional 1.0 compatibility and migration |
| [Security](docs/security.md) | Sanitizers, URL/provider policy, privacy boundaries |

## Documentation maintenance

Canonical component inventory lives in `src/catalog/componentDescriptors.ts`. Each explicit descriptor owns maturity, authoring complexity, schema properties, field traversal handlers, Inspector controls, documentation, renderer mode, child containers, and a valid example. Compatibility catalogs, strict validator maps, prompts, and generated documentation derive from that registry. Update the descriptor and renderer together, then run `npm run docs:generate`; do not hand-edit generated catalogs.

HyperPBI 2.0 authoring should use Field Manifest aliases, including documented nested table, detail, template, SVG, interaction, dataset, and Power BI-backed map positions. Runtime keys remain compatibility inputs. ArcGIS service fields and joined aliases are separate namespaces and are never treated as Power BI aliases.

Dataset contracts come from `src/data/datasets.ts` and `src/data/datasetSchema.ts`; SVG constants from `src/components/svg/svgTypes.ts`; AI contract composition from `src/ai/promptComposer.ts`; and the canonical embedded/check-in skill from `HYPERPBI_SKILL_MARKDOWN` in `src/docs/hyperpbiHelp.ts`.

## Compatibility and known limitations

- Version 1.0 remains intentionally lenient and supports legacy normalized keys and migrations documented in [migration/versioning](docs/migration-versioning.md).
- Logical datasets are in-memory transformations of the current Power BI data view: no joins, SQL, arbitrary JavaScript, or network sources.
- Power BI supplies one flattened visual data view. Logical datasets can create different layer views over it, but cannot independently query arbitrary semantic-model tables; visual-query grain and relationships still control received rows.
- Root calculated-field metadata is added before logical-dataset schema propagation, so calculated fields can drive components and dataset stages even with zero rows. Root scalar metrics remain a separate namespace consumed through metric-grid metric references/templates.
- External filter mode targets model columns only; model measures and dataset outputs are not direct Power BI filter targets.
- External identity selection depends on Power BI identities and retained lineage.
- Core has no external provider access. Maps access depends on WebAccess approval and host policy.
- ArcGIS support is public-service, 2D, REST-oriented scope; secured services, editing, relationships, tracing, and non-4326 output are not implemented.
- SVG is governed and bounded; it is not a browser SVG/JavaScript sandbox.
- Example JSON files that still declare `version: "1.0"` are retained as compatibility examples unless their accompanying text explicitly promotes 2.0 authoring.
