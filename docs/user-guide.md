# HyperPBI user guide

## Install and bind data

1. Choose a Core or Maps `.pbiviz` package.
2. In Power BI Desktop, use **Visualizations → … → Import a visual from a file**.
3. Add HyperPBI to the report canvas.
4. Bind every Power BI field the dashboard needs to the single **Values** field well. ArcGIS reference-only maps need no Values fields.
5. Resize the visual for the intended report layout.
6. Open the visual's **Edit** command to enter HyperPBI Edit Mode.

Core has no external provider access. Use a Maps package only when the report needs approved tiles, geocoding, or public ArcGIS services.

## Edit Mode workflow

The normal path is:

**Dashboard setup → Copy AI Prompt → external approved AI → Paste AI response → Validate & Preview → Save & return**

HyperPBI never sends the prompt itself. Review selected fields and privacy mode before copying.

### Guided mode and Advanced controls

Edit Mode opens in guided mode. It keeps **Guided Builder** and **How it works** prominent so a report author can complete the normal workflow without learning the expert tool layout. Dashboard setup asks for the goal, audience, supported decisions, primary entity, application type, layout, important KPIs, sections and filters, device priority, interaction expectations, and complexity. Choose whether maps, tables, charts, controls, calculations, or detail panels are required.

Select **Advanced controls** to expose every authoring workspace. Select **Guided mode** to return to the focused guided experience; at narrow widths those button labels shorten to **Advanced** and **Guided**. This changes navigation density only and does not discard the working specification, preview, selection, or validation history.

| Workspace | Tools | Use it for |
|---|---|---|
| **Create** | AI Builder, Visual Inspector, Map Studio | Create or revise the dashboard, select components, and configure maps |
| **Data & logic** | Field mapping, Calculations | Review aliases and add governed calculated values |
| **Test** | Interaction testing, Map services | Verify Power BI behavior and provider access |
| **Advanced** | Runtime settings, JSON editor | Change expert settings or edit the complete JSON directly |
| **Learn** | Documentation, AI skill guide | Review the human workflow or copy the full AI authoring reference |

On wide layouts, each workspace group opens a described menu. Arrow keys move through menu items, Home and End jump to the first or last item, and Escape closes the menu. On compact layouts the same workspaces appear in one labeled selector, avoiding a crowded toolbar without removing advanced access.

### Workbench views and responsive behavior

Use the explicit workbench view controls according to the task:

- **Split** keeps the active editor workspace and validated preview visible together.
- **Editor** gives the active workspace the available area for long forms, trees, or JSON.
- **Preview** gives the dashboard the available area for visual review and interaction testing.

Changing views never changes the active workspace or dashboard data. In a wide Split view, the separator between editor and preview supports pointer dragging and keyboard adjustment. The diagnostics drawer is also resizable. At narrow or mobile visual sizes, Edit Mode becomes a stable single-pane experience: the selected Editor or Preview surface fills the available area, workspace navigation becomes the compact selector, controls wrap instead of overflowing, and the current selection is retained when the user switches surfaces.

### Dashboard setup

Studio uses the setup choices to include only relevant prompt modules; it does not add unimplemented features. Optional advanced prompt controls expose privacy, sample, selected-field, application-pattern, and targeted-change settings without putting them in the normal path.

The permanent **Visual Inspector** works with saved, manually edited, imported, and AI-generated dashboards. Turn on **Inspect preview** to select nested or generated runtime components without firing runtime interactions; Escape exits inspection. Inspector edits are complete-dashboard validated transactions with bounded undo/redo and support add child, insert before/after, move up/down or to another compatible container, recursive duplicate, and reference-aware deletion.

Selected-section redesign and add-section jobs return a discriminated `hyperpbi-change` package. Studio validates the entire resulting dashboard first, shows a mutation summary, and promotes the same prepared result to the working JSON and preview together.

### Field Manifest

Use the shown aliases in new 2.0 authoring. The manifest also explains canonical key, display/source names, data type, semantic role, true measure versus summarized model column, default aggregation, and external selection/filter eligibility.

For maps, the manifest supplies fields to each layer's dataset-aware controls in Map Studio. Configure location and attributes through explicit `layer.source.bindings`; there are no fixed map field buckets. A coordinate's current visual-query aggregation is reported separately from its semantic-model default; change the field instance in the visual query to **Don't summarize** when row-level coordinates were summarized.

### Prompt jobs

- **Create dashboard:** complete new 2.0 object
- **Improve current dashboard:** complete updated object; preserve version, stable IDs, and unrelated behavior
- **Add section:** section package with insertion target
- **Redesign selected section:** replacement using the selected stable ID
- **Repair invalid JSON:** complete corrected object based on diagnostics

Do not accept JSON Patch for normal improve/repair responses.

## Validate, preview, and save

The importer extracts one JSON object, prepares aliases/definitions/patterns/datasets, and reports structured diagnostics. Version 2.0 is strict: unknown properties, invalid IDs, wrong enums, missing required properties, bad dataset stages, unknown fields/targets, and SVG limits are errors.

Before the first successful validation, the Preview surface presents an empty state with the next action. Use **Preview changes** for the current working dashboard. A targeted AI package uses **Validate resulting dashboard & Preview** before it is promoted. Both actions validate the exact current specification and Runtime settings and, when successful, prepare them through the same pipeline used by the saved visual.

- **Preview current** means the visible preview matches the exact working specification and Runtime settings.
- **Preview out of date** means the user changed something after the last successful preview. The previous valid preview remains visible for comparison, but it is not represented as the current candidate.
- **Not previewed** means no current candidate has completed preview preparation yet.

Diagnostics are grouped by severity. **Errors** block preview and save and should be resolved first. **Warnings** describe limitations or compatibility concerns without being styled as equivalent failures. Use the JSON path and component ID in each issue; applied automatic repairs remain listed separately. Loading states for bounded provider and map actions remain distinct from empty and error states, so an in-progress request does not look like missing data or failed validation.

**Save & return** is a guarded action, not a blind persistence shortcut. It validates and prepares the current working specification and Runtime settings again. HyperPBI saves and exits only if that current candidate succeeds; an error leaves Edit Mode open, keeps the last valid preview and saved dashboard intact, and opens actionable diagnostics. Warnings remain available for review but do not by themselves block saving.

## Visual Inspector

Open **Create → Visual Inspector**, or turn on **Inspect preview** and select a rendered component, to locate its stable authoring owner and exact JSON path. Field controls use the component's effective logical-dataset schema, dataset controls list valid datasets, component controls list compatible IDs, and structured fragments retain parse/validation errors inline. Preserve the ID when the component's role remains. A failed candidate keeps the current valid dashboard, the last valid preview, and the uncommitted local draft.

The searchable hierarchy supports keyboard navigation. Wide layouts show resizable **Tree** and **Properties** panes. At narrow widths those names become accessible pane tabs; selecting a tree item opens Properties and **Back to hierarchy** returns to the same tree context. A search with no result shows **No matching components** and a **Clear search** action. A valid dashboard with no components shows **No components yet**. Invalid root JSON shows an actionable **Inspector unavailable** state rather than an empty or broken tree.

## Application shell

Configure the shell at root `app`, not `schema.app`. It can provide brand, navbar, sidebar, page header, footer, navigation, and actions. Use it for a sufficiently large app-style visual. Prefer offcanvas/modal/dropdown/popover components for narrow layouts.

## Responsive application layouts

Every component accepts the shared `heightMode`, `minHeight`, `aspectRatio`, `order`, and mobile-first `responsive` contract. `heightMode: "fill"` propagates a bounded available height through nested grid/flex/split containers, cards, tabs, charts, maps, and virtual tables. Use `aspectRatio` for self-sized analytical panels and preserve existing component `height` properties for fixed-height compatibility.

Responsive rules are container-relative at `xs`, `sm`, `md`, `lg`, and `xl`. A rule can change `span`, `order`, `visible`/`hidden`, `direction`, `columns`, or `stack`. Author the narrow layout first; for example, stack a split at `xs` and restore its row direction at `md`. Hidden components do not retain layout space.

`split` is a first-class resizable container. Set `resizable: true`, aligned `sizes`, optional `minSizes`/`maxSizes`, and `persist: "none" | "session" | "local"`. Viewer sizes are normalized, constrained, scoped to the visual and stable component ID (or `storageKey`), restored only when compatible, and updated with pointer or keyboard handles. Nested charts and maps receive a real resize notification while dragging and after breakpoint changes.

## Components and catalogs

Use the generated [component catalog](hyperpbi-component-catalog-reference.md) for canonical types and properties. Prefer semantic charts, native table/matrix, first-class cards/lists/detail/overlays, `map`, and declarative `svg` before advanced/custom fallbacks.

Maturity is assigned explicitly in each canonical descriptor. **Stable** requires a renderer, strict schema, applicable field metadata, Inspector metadata, a valid example, responsive and empty-state behavior, accessibility guidance, and focused tests. **Beta** is implemented but is missing at least one stable requirement. **Experimental** is intentionally unstable and advanced. **Deprecated** is excluded from normal authoring guidance.

AI prompts exclude legacy and deprecated components. They include experimental components only when explicitly requested, and beta components only for explicit or advanced authoring. Existing dashboards may continue loading non-stable components.

## Interactions

Keep interface and data behavior separate:

- `uiAction` changes tabs, steps, shell/overlay/toast/scroll state
- `interaction` controls internal highlight/filter and external Power BI selection/filter
- `interactions` handles safe event-specific custom-content behavior

Power BI external filter mode requires a model-column target. Dataset metrics, derived fields, and true measures cannot directly filter the semantic model. Identity selection may work through source lineage.

Set `interaction.target` or `interaction.targets` to link only named components; omit both for the existing report-wide internal behavior. Charts add declarative `events.zoom`, `events.rangeSelect`, and `events.brush`. Each event can enable its own interaction, targets, and binding field. Zoom state survives rerenders, range and brush selections resolve back to original Power BI row lineage, and an empty brush clears stale state.

For hierarchical navigation, define `drill.levels` with at least two already-declared logical datasets. Each level supplies its dataset and chart bindings; child levels use `parentField` to match the selected parent value. `trigger` can be `click` or `doubleClick`, and breadcrumbs navigate back without querying or executing arbitrary data. Preload each resolution in `data.datasets`; drill state switches prepared views rather than mutating the semantic model.

## Tables and exports

Native tables virtualize large result sets by default once the threshold is reached. `virtualization` can explicitly set `enabled`, `threshold` (up to the 5,000-row non-virtual DOM guard), measured `rowHeight` (`22`–`80` pixels), and bounded `overscan`. Only the viewport window plus overscan is mounted, while search, sort, filters, row count, selection, pagination, and export continue to use the complete prepared result. Explicitly disabling virtualization keeps the existing 5,000-row DOM safety limit. The visual-format maximum-row setting remains the authoritative ingestion guard.

Enable `export` with one or both `formats: ["csv", "xlsx"]`, `scope: "filtered" | "selected" | "selectedOrFiltered"`, and an optional `fileName`. Exports use visible columns and the complete filtered/selected row set, not only mounted virtual rows. CSV is UTF-8 with a BOM; both formats neutralize spreadsheet-formula prefixes. XLSX output is generated locally without sending data to a provider.

## Maps

Use **Open in Map Studio** from a selected map in Visual Inspector, or open **Create → Map Studio**. It shares canonical JSON, selection, bounded history, prepared calculated/configured/logical data, and live preview with Visual Inspector. Create layers and groups; choose each layer's optional logical dataset; bind Geometry, Latitude+Longitude, X+Y, or Address; then configure renderer, labels, popup/tooltip, source-aware filters/visibility, interactions, limits, basemap, and bookmarks. Text drafts commit as one transaction on blur or Enter; Escape cancels, and invalid edits keep the last valid preview while marking the current candidate out of date.

Every Map Studio transaction uses the current Runtime Config owned by HyperPBI Edit Mode. Map-layer interactions author `trigger: "click"` only. The Basemap & view editor exposes rectangle and lasso spatial-selection tools; the same canonical `tools` properties drive Edit Mode preview and the viewer toolbar. ArcGIS service roots load as one bounded spatial/group/table summary; selecting a spatial layer lazily loads that item's fields, while tables remain nonspatial and groups remain navigation-only. Tile/dynamic source edits replace the mounted overlay without resetting the map view. Join preview and runtime share cardinality, unmatched-policy, blank/invalid aggregation, and bounded diagnostics semantics. Class breaks reduce their effective count for small or repeated data. Diagnostic paths are canonical JSON pointers and the selected-layer panel excludes siblings.

The effective dataset is `layer.dataset`, then the map's dataset, then `powerbi`. Logical datasets are views over the one flattened Power BI data view received by the custom visual; they do not query model tables independently. Explicit layers resolve independently and do not inherit global Runtime Config coordinates. Location precedence is Geometry → Lat/Lon → X/Y → Address. Diagnostics report exact layer dataset/bindings, invalid-location counts, mixed geometry, `layerValue`, lineage, requests, joins, limits, and timings.

Put fields used by Power BI-backed layers and joins in Values. ArcGIS reference-only maps need no Values fields and continue to run with an empty data view. Fields from different tables must have an unambiguous semantic-model relationship or bridge; Power BI rejects unrelated combinations before the visual runs. ArcGIS authoring fetches metadata only when you click **Fetch service metadata**; choose a root sublayer to populate service field controls. Click **Run join preview** for a bounded runtime-equivalent preview. `fieldSource` distinguishes `powerbi`, `service`, and `joined` attributes. Stable point shapes are circle, square, diamond, and triangle; cluster labels support count and numeric sum. Rectangle/lasso selections intersect point, multipoint, line, and polygon geometry, update canonical feature selection, target linked components, and send only real contributing Power BI identities externally. Basemap/view changes are reactive, `view.fitPadding` is a `0`–`0.5` ratio (default `0.08`), and **Add current view** captures the latest live preview center/zoom. Address search remains user-triggered and requires a Maps package, provider configuration, WebAccess, and privacy acknowledgment. Geocoding behavior is unchanged by this work.

Public ArcGIS feature/tile/basic dynamic services must be HTTPS and allowed by the installed package. Do not store tokens in the dashboard.

The current Map Studio also exposes inline/remote GeoJSON and generic XYZ sources; rich safe icon,
line, polygon, and true heatmap renderers; interactive legend behavior; selected/hover symbol
states; rectangle/lasso/circle selection and limits; quick filters; external interaction;
scale/coordinate tools; and compact toolbar placement. Advanced JSON remains available without
overloading the default layer form.

Feature click, legend click/hover, spatial tools, Select visible, Invert, quick filters, Power BI
state, and linked HyperPBI state remain synchronized. Shift adds, Ctrl/Cmd toggles, and Alt
subtracts. The selected indicator reports feature and contributing-row counts. The Playground route
`/components/map` loads focused examples from `examples/map/manifest.json`, runs each one, shows the
exact JSON, and provides **Copy spec**. See [Analytical maps](maps.md).

## Troubleshooting

| Symptom | Check |
|---|---|
| Unknown field | Use the current Field Manifest alias; check the component's dataset |
| Non-numeric measure | Bind/select a numeric field at that dataset stage |
| Unknown property | Use only the generated catalog's properties for that type |
| Duplicate/invalid ID | Start with a letter; use letters/digits/`_`/`-`; keep IDs global and unique |
| External filter unavailable | Field must be a model column with source table/column |
| External selection unavailable | Power BI identities/lineage may be absent |
| Component sees no field | Its named dataset may have renamed/selected/grouped the field away |
| Map has no locations | Bind geometry or a complete valid coordinate/address pair |
| Coordinates collapse | Set latitude/longitude to Don't summarize |
| Fill panel stays short | Give its bounded ancestor `heightMode: "fill"`; use a fixed or report-canvas height at the outer boundary |
| Split size does not restore | Keep a stable component `id`/`storageKey`; persisted sizes are ignored when pane count or constraints change |
| External map/provider disabled | Use Maps package; verify WebAccess, HTTPS host, runtime config |
| Raw SVG disappears | Review sanitizer warnings, exact limits, forbidden resource/element use |
| AI response rejected | Return one complete JSON object; remove comments/fences/prose/multiple objects |
| Preview says out of date | Select **Preview changes** to prepare the current specification and Runtime settings |
| Save & return stays in Edit Mode | Resolve blocking Errors; the current candidate is revalidated before saving |
| Workspace controls feel crowded | Use the compact workspace selector or choose **Editor** / **Preview** single-pane view |
| Inspector search is empty | Select **Clear search**; **No components yet** means the valid dashboard has no component nodes |

## Package commands for maintainers

```powershell
npm run package:core
npm run package:maps
npm run package:verify
```

Maps defaults to broad HTTPS. Set `HYPERPBI_ALLOW_ALL_MAP_HOSTS=false` and `HYPERPBI_MAP_HOSTS` for restricted packaging. See [Map services](map-services.md) and [Security](security.md).

## Dashboard schema versions

Dashboard schema 2.0 is the only version accepted by HyperPBI authoring and rendering. A missing version or schema 1.0 produces a blocking diagnostic; the visual never migrates it during loading, Edit Mode, AI import, preview, save, or rendering.

Developers can convert a supported legacy JSON file outside the visual with `npm run schema:migrate-v1 -- input.json output.json`. Review and validate the converted fields, interactions, and map bindings before use. The PBIVIZ package version and Runtime Config version are separate version numbers.
