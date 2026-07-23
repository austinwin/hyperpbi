# HyperPBI

HyperPBI is an AI-native analytics runtime and portable dashboard specification. Declarative HyperPBI 2.0 JSON is prepared by one validation and dataset pipeline, then rendered by the same Studio and runtime in either the Power BI custom visual or the standalone web Playground. HyperPBI renders only implemented components and safe behaviors; it is not a general-purpose HTML or JavaScript application platform.

**Project:** [hyperpbi.com](https://hyperpbi.com) · **Source:** [austinwin/hyperpbi](https://github.com/austinwin/hyperpbi)

HyperPBI does not call an AI service. Edit Mode builds a prompt from the current Field Manifest and authoring settings; the user copies that prompt to an externally approved AI, then pastes one JSON response back into HyperPBI for extraction, validation, preview, and saving.

```text
AI / Visual Editor / JSON / Templates
                  ↓
         HyperPBI 2.0 Specification
                  ↓
        Shared HyperPBI Runtime
                  ↓
       Power BI Host | Web Host
```

## HyperPBI Playground

The Vite/Preact application in `apps/playground` is the reference web host for HyperPBI 2.0. It reuses `HyperPbiStudio`, `HyperPbiRoot`, schema preparation, runtime configuration, sanitizers, calculations, logical datasets, field handling, and component rendering from `src`; there is no web-only dashboard format or duplicate renderer.

The local workflow is:

1. Create or import a project.
2. Upload one or more CSV/XLSX files. A CSV creates one source and every workbook sheet creates one source.
3. Inspect fields and preview rows, name sources, and select the default source exposed to the specification as `powerbi`.
4. Author in the existing Studio, validate through the 2.0 preparation pipeline, and open full-viewport Play Mode.
5. Let IndexedDB save specification, Runtime Configuration, editor state, source manifests, normalized fields/rows, and deterministic row keys.
6. Copy/download portable specification and Runtime Configuration JSON, or export/import the complete `.hyperpbi` local project.

A `.hyperpbi` project is a Playground backup containing local normalized data and editor state. A portable Power BI specification contains the declarative dashboard only; Power BI must provide the required data to the visual. Before Power BI export, the Playground reports whether the project is compatible, safely compatible after rewriting the selected default source ID to `powerbi`, or not fully portable. It never collapses genuinely separate uploaded sources into one.

See [architecture](docs/architecture.md) for host contracts, persistence, portability, Vercel deployment, and future service boundaries.

## Current status and schema versions

- HyperPBI dashboard schema **2.0 is the only active authoring and rendering contract**: stable IDs, Field Manifest aliases, strict unknown-property diagnostics, named datasets, reusable definitions, application patterns, and structured repair.
- Dashboard schema 1.0 and missing versions are rejected by visual loading, Edit Mode, AI import, preview, save, and rendering. Legacy JSON can be converted explicitly with the development-only `npm run schema:migrate-v1 -- input.json output.json` utility; runtime migration is intentionally unsupported.
<!-- component-summary:start -->
- The canonical implementation defines **81 component types in 12 categories**. The count and catalog are generated from source metadata; see the [component catalog](docs/hyperpbi-component-catalog-reference.md).
<!-- component-summary:end -->
- Power BI visual package version `1.0.0.0` in `pbiviz.json` is a package version and is independent of the dashboard schema version.

## Power BI workflow

1. Import the appropriate PBIVIZ package and bind the required Power BI fields to **Values**.
2. Open the visual's **Edit** command. Edit Mode starts in a focused guided experience for creating or revising a dashboard without navigating expert tools.
3. Review the Field Manifest and dashboard setup, choose a prompt job, and copy the generated prompt to an approved external AI.
4. Paste one JSON response into the Guided Builder and select **Validate & Preview**.
5. Use **Split**, **Editor**, or **Preview** to compare the working dashboard with its validated result. A subsequent edit changes the status from **Preview current** to **Preview out of date** until **Preview changes** succeeds again.
6. Resolve blocking errors in the Errors group and review non-blocking Warnings separately. Invalid input never replaces the last valid preview.
7. Select **Save & return**. HyperPBI revalidates the current specification and runtime settings before it persists them and exits Edit Mode.

The default guided mode keeps the main workflow and help visible. Select **Advanced controls** when you need the complete workspace navigation: **Create** (AI Builder, Visual Inspector, Map Studio), **Data & logic** (Field mapping, Calculations), **Test** (Interaction testing, Map services), **Advanced** (Runtime settings, JSON editor), and **Learn** (Documentation, AI skill guide). Select **Guided mode** to return to the focused path. Narrow layouts shorten those two mode buttons to **Advanced** and **Guided**. Changing modes does not discard the dashboard or its validated preview.

The permanent Visual Inspector can select a rendered component, locate its canonical authoring JSON (including generated runtime ownership), edit that fragment, and preserve stable IDs. It provides searchable keyboard navigation, dataset-aware controls, descriptor-validated add/insert/move/duplicate/delete operations, responsive **Tree** and **Properties** panes, and bounded transaction undo/redo. Wide layouts support keyboard-accessible resizing. Compact layouts show one Inspector pane at a time, move a tree selection into Properties, and provide **Back to hierarchy**. Empty, no-match, and invalid-JSON states explain the next safe action. Every candidate is prepared and validated as a complete dashboard; invalid input remains a local draft and never replaces the last valid specification or preview.

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

Preparation follows the implementation pipeline: safe unambiguous authoring repairs; optional ID assignment; definition expansion; pattern expansion; design-system validation; dataset field resolution and static dataset schemas; component dataset validation; field-alias resolution; design-system expansion; strict schema 2.0 validation; then calculation/reference checks before render. Missing or non-2.0 versions are rejected before rendering.

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

Named datasets live at `data.datasets`. Every definition has a `source` of `powerbi`, another named dataset, or—in the Playground—an uploaded source ID. After source resolution, both runtime evaluation and static schema propagation use this order:

`filter → derive → rename → select → groupBy/metrics → distinct → sort → limit`

Components omit `dataset` to use the base `powerbi` data view or name one dataset to use only that output schema. Dataset chains are deterministic, cycle-checked, cached by canonical definition/input signatures, and retain source-row lineage through filtering, grouping, and deduplication. Static schemas keep generated fields available even when the runtime result has zero rows.

Logical datasets do not execute SQL, join arbitrary sources, call the network, or run JavaScript. See the [data model reference](docs/data-model.md).

## Components and application patterns

The generated catalog derives type, label, category, status, intended use, level, capabilities, required/allowed properties, interaction/UI-action support, accessibility guidance, related types, and valid examples from canonical TypeScript metadata.

Categories are Layout, Controls, Navigation, Display, Primitives, Feedback, Forms, Charts, Tables, Maps, Custom components, and Advanced components. The inventory includes `svg`, `svgMarkup`, `advancedChart`, and custom-content components.

Four 2.0 application patterns compile to existing runtime components with deterministic child IDs:

- `kpi-row`
- `trend-and-breakdown`
- `record-explorer`
- `map-and-details`

Reusable root `definitions` deep-merge objects, replace arrays, remove definition IDs, and require every `use` instance to provide its own stable ID. Patterns and definitions are authoring conveniences; they do not add renderer behavior.

### Application-style layout

Every component supports mobile-first `responsive` rules at `xs` (0), `sm` (480), `md` (768), `lg` (1024), and `xl` (1280) container breakpoints. Rules can change `span`, `order`, visibility, direction, stacking, and layout columns without viewport-global CSS. Grids and split panes stack by default on compact containers; authored desktop spans return at `lg` unless an explicit rule overrides them.

`heightMode: "fill"` propagates a bounded flex/grid height through nested grids, cards, tabs, charts, tables, maps, and split panes. `aspectRatio` creates a ratio-bound surface, and `minHeight` supplies a safe lower bound. A `split` becomes viewer-resizable with `resizable: true`; `sizes`, `minSizes`, and `maxSizes` are pane percentages, handles support pointer and keyboard input, and `persist: "none"|"session"|"local"` controls per-visual saved sizes. See the [flexible application dashboard example](examples/specs/v2-flexible-application-dashboard.json).

## Charts, tables, maps, and SVG

Semantic charts include bar, horizontal bar, line, area, pie, donut, scatter, gauge, heatmap, combo, waterfall, sankey, treemap, funnel, radar, and small multiples. Their ECharts `options` can alter safe presentation but cannot replace generated datasets, axes, series types/counts, links, nodes, encodings, or transforms. Declarative `events.zoom`, `events.rangeSelect`, and `events.brush` persist view state and can link filtered/highlighted source rows to named components. `drill.levels` navigates preloaded logical datasets with dataset-aware fields, parent-key filtering, source lineage, and breadcrumbs. `advancedChart` is the sanitized JSON-only escape hatch for implemented ECharts configurations that a semantic chart cannot express.

`table` is the supported native detail table. It measures its scroll viewport and virtualizes configured large datasets with bounded overscan; CSV/XLSX export can use filtered rows, selected rows, or selected rows with filtered fallback, and excludes hidden columns. `matrix` renders every declared value metric across optional column groups, with per-metric formatting, totals, heatmaps, accessible headers, source-row interactions, deterministic row limits, and a visible cell-budget warning. Its shared aggregation policy requires numeric fields for numeric operations while `count` may omit a field. `table.engine` is not part of schema 2.0.

`map` uses the same single **Values** field well as every other HyperPBI component for Power BI-backed fields; reference-only service and GeoJSON maps require no Values fields. HyperPBI 2.0 maps provide explicit Power BI, ArcGIS Feature/Tile/Dynamic, inline/remote GeoJSON, and generic XYZ layers; simple, unique, class-break, continuous, proportional, cluster, true canvas heatmap, density-grid, rich icon, line, and polygon renderers; interactive multi-layer legends; rectangle, lasso, and circle selection; quick filters; safe popups/labels; and compact operational tools. A shared controller synchronizes click, legend, spatial, external Power BI, and other HyperPBI component interactions across selected, hovered, externally highlighted, dimmed, and filtered states. Map Studio configures the major capabilities while retaining advanced JSON. See the [analytical map guide](docs/maps.md), [map services](docs/map-services.md), and the manifest-driven [map gallery](examples/map/README.md).

## Map demos

Five version 2 examples under [`examples/specs`](examples/specs) demonstrate the stabilized map runtime; Power BI-backed examples use compact CSV data under [`examples/data`](examples/data):

- **Map Feature Showcase** — a five-column Power BI coordinate map with unique status styling, stable one-click selection, tooltips, and responsive Preact feature details.
- **Multiple Geometry Layers** — five facilities, four lines, and two polygons in independently clickable logical layers, including duplicate raw ID `A-01` in the point and line sources.
- **Selection and Feature Details** — replace selection, Ctrl/Cmd multi-selection, explicit active-feature deselection, Escape/close behavior, background clearing, and narrow bottom-sheet layout.
- **ArcGIS Join Showcase** — a four-column fictional Power BI dataset joined to an existing public ArcGIS Feature layer, plus a deterministic CSV service fixture used by automated browser tests.
- **ArcGIS Dynamic Identify Showcase** — a server-rendered Dynamic MapServer layer with temporary read-only click details, multi-result choice, and returned-geometry highlight.

The separate **Flexible operations workspace** example combines fill sizing, a persisted split, breakpoint stacking, spatial selection, chart event linking, hierarchical dataset drill, virtualized detail, and CSV/XLSX export.

Power BI coordinate and geometry layers support feature clicks and native row selection. ArcGIS Feature layers support queries, details, selection, and joins. ArcGIS Dynamic layers support temporary click identify details but not joins or persistent selection. ArcGIS Tile layers remain display-only with no identify, popup, join, or selection.

Map Studio candidate edits are validated with the exact current Runtime Config. Feature click, legend, rectangle, lasso, circle, Select visible, Invert, quick-filter reconciliation, external Power BI state, and linked HyperPBI state use one analytical interaction pipeline. ArcGIS tile/dynamic definition changes rebuild only the affected mounted overlay while preserving the viewport; access denial removes already-loaded content. ArcGIS root inspection is one bounded summary request, with lazy selected-item metadata and separate spatial/group/table classification. Join cardinality and unmatched policies are enforced and diagnosed; blank/invalid numeric aggregation inputs never fabricate zero, and empty numeric groups return `null`. Computed class breaks reduce to the supported distinct/ramp count, and map diagnostics use canonical RFC 6901 pointers scoped to the exact selected layer.

`svg` is the preferred governed vector system for diagrams, schematics, pictorial marks, and custom gauges. It uses structured allowlisted elements, bindings, scales, conditions, state, bounded repeats, normal interactions, ID isolation, animation presets, and reduced-motion handling. `svgMarkup` is a strictly sanitized fallback for a single raw SVG document. See [SVG visuals](docs/svg-visuals.md).

For content, distinguish `text`, `markdown`, sanitized `html`, repeated/scoped `custom`, declarative `svg`, and sanitized `svgMarkup`. Prefer a first-class component when one fits.

## Interactions

HyperPBI has three separate declarative systems:

1. `uiAction` changes interface state: tabs, steps, sidebar, overlays, toasts, scrolling, filter clearing, and a safe refresh no-op.
2. Universal `interaction` controls internal `none|highlight|filter` behavior and external Power BI `none|auto|selection|filter` behavior.
3. `interactions` maps supported component events to allowlisted custom payload actions.

`externalMode: "auto"` resolves to filter for controls and selection for data-point/custom components. `target`/`targets` can restrict internal linked behavior to named component IDs. External filter mode requires a model-column target; true measures, dataset-derived fields, and dataset metrics cannot directly filter Power BI. Dataset lineage can map a derived/grouped row back to contributing source identities for selection. See [interactions](docs/interactions.md).

## Edit Mode, prompts, and repair

Prompt jobs are Create dashboard, Improve current dashboard, Add section, Redesign selected section, and Repair invalid JSON. Create/improve/repair normally return a complete specification. Add-section returns a strict change package for before, after, a descriptor-compatible nested `containerPath`, or a root `components|toolbar|leftPanel|rightPanel` destination; redesign returns one replacement using the selected stable ID. Edit Mode validates the complete result, then promotes that same prepared JSON to the working draft and preview in one transaction. Normal improvements and repairs return complete JSON, not JSON Patch.

**Preview current** means the visible preview was prepared from the exact working specification and Runtime settings. Any later change makes it **Preview out of date** while leaving the last valid result visible for comparison; **Not previewed** means no current candidate has completed preview preparation. Use **Preview changes** for normal edits; targeted AI packages use **Validate resulting dashboard & Preview** before promotion. Diagnostics are separated by severity: errors block preview and save, while warnings remain visible without being presented as equivalent failures. **Save & return** performs final validation and preview preparation against the current working values; it saves only when that validation succeeds.

Prompt composition includes only relevant component modules, Field Manifest data under the chosen privacy mode, recommended patterns, applicable datasets/maps/tables/charts/SVG guidance, current JSON for improvement, selected ID for redesign, and structured diagnostics for repair.

The importer accepts one JSON object directly or inside one Markdown fence and can extract one unambiguous object from surrounding text. Multiple candidate objects, comments, smart quotes, or truncated JSON produce diagnostics rather than speculative repair. AI import is strict: the response must declare version 2.0, every component must already have a stable ID, and unknown properties are rejected. It never substitutes fields, changes aggregations, deletes components, removes interactions, or rewrites business logic.

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

The packaging script labels outputs `*-core.pbiviz`, `*-maps-broad.pbiviz`, or `*-maps-restricted.pbiviz`; it also writes the convenience package filename `*-maps.pbiviz` for a Maps package. Exact base names derive from the PBIVIZ packager, so documentation should not invent a fixed artifact filename.

## Development commands

```powershell
npm install
npm run dev
npm run playground:typecheck
npm run playground:test
npm run playground:build
npm run playground:preview
npm run start
npm run typecheck
npm test
npm run test:browser
npm run lint
npm run docs:generate
npm run docs:check
npm run package:core
npm run package:maps
npm run package:verify
```

`npm run docs:generate` is documentation-only. It executes canonical TypeScript metadata without building the visual. It fully regenerates:

- `docs/hyperpbi-component-catalog-reference.md`
- `hyperpbi-component-catalog-reference.html`
- `docs/hyperpbi-ai-skill.md`

It also refreshes only the marked generated inventory regions in:

- `README.md` (`component-summary`)
- `index.html` (`hero-component-count`, `inventory-stats`, and `catalog-heading`)

Do not hand-edit the fully generated reference outputs or the marked regions. The rest of `README.md` and `index.html` remains hand-maintained.

## Documentation index

| Document | Purpose |
|---|---|
| [Architecture and Playground](docs/architecture.md) | Shared runtime, host bridges, projects, portability, Vercel, future services |
| [User guide](docs/user-guide.md) | Power BI and Edit Mode workflow |
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
| [Migration/versioning](docs/migration-versioning.md) | Schema 2.0 boundary and standalone legacy converter |
| [Security](docs/security.md) | Sanitizers, URL/provider policy, privacy boundaries |

## Documentation maintenance

Canonical component inventory lives in `src/catalog/componentDescriptors.ts`. Each explicit descriptor owns maturity, authoring complexity, schema properties, field traversal handlers, Inspector controls, documentation, renderer mode, child containers, and a valid example. Strict validator maps, prompts, and generated documentation derive from that registry. Update the descriptor and renderer together, then run `npm run docs:generate`; do not hand-edit generated catalogs.

HyperPBI 2.0 authoring uses Field Manifest aliases or canonical resolved field keys, including documented nested table, detail, template, SVG, interaction, dataset, and Power BI-backed map positions. Display names are not accepted as aliases. ArcGIS service fields and joined aliases are separate namespaces and are never treated as Power BI aliases.

Dataset contracts come from `src/data/datasets.ts` and `src/data/datasetSchema.ts`; SVG constants from `src/components/svg/svgTypes.ts`; AI contract composition from `src/ai/promptComposer.ts`; and the canonical embedded/check-in skill from `HYPERPBI_SKILL_MARKDOWN` in `src/docs/hyperpbiHelp.ts`.

## Known limitations

- Dashboard schema 2.0 is the only runtime contract. See [migration/versioning](docs/migration-versioning.md) for the isolated development converter and the removed aliases.
- Logical datasets are in-memory transformations of the current Power BI data view: no joins, SQL, arbitrary JavaScript, or network sources.
- The Playground accepts local CSV and XLSX only. It has no joins, relationships, DAX, Power Query, databases, scheduled refresh, authentication, collaboration, or cloud publishing.
- One Power BI visual receives one flattened data view. A Playground project that depends on multiple independent uploaded sources is intentionally reported as not fully portable.
- Browser-host selection and filtering stay inside HyperPBI unless they use an implemented declarative internal interaction. Power BI-only external selection/filter requests are reported as unsupported, never as successful.
- Power BI supplies one flattened visual data view. Logical datasets can create different layer views over it, but cannot independently query arbitrary semantic-model tables; visual-query grain and relationships still control received rows.
- Root calculated-field metadata is added before logical-dataset schema propagation, so calculated fields can drive components and dataset stages even with zero rows. Root scalar metrics remain a separate namespace consumed through metric-grid metric references/templates.
- External filter mode targets model columns only; model measures and dataset outputs are not direct Power BI filter targets.
- External identity selection depends on Power BI identities and retained lineage.
- Core has no external provider access. Maps access depends on WebAccess approval and host policy.
- ArcGIS support is public-service, 2D, REST-oriented scope; secured services, editing, relationships, tracing, and non-4326 output are not implemented.
- SVG is governed and bounded; it is not a browser SVG/JavaScript sandbox.
- Every maintained dashboard example declares and validates as schema 2.0. The only schema 1.0 fixture is isolated under migration-specific tests.
