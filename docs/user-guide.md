# HyperPBI user guide

## Install and bind data

1. Choose a Core or Maps `.pbiviz` package.
2. In Power BI Desktop, use **Visualizations → … → Import a visual from a file**.
3. Add HyperPBI to the report canvas.
4. Bind every field the dashboard needs to **Values**, including explicit map roles when applicable.
5. Resize the visual for the intended report layout.
6. Open the visual's **Edit** command to enter HyperPBI Studio.

Core has no external provider access. Use a Maps package only when the report needs approved tiles, geocoding, or public ArcGIS services.

## Studio workflow

The normal path is:

**Dashboard setup → Copy AI Prompt → external approved AI → Paste AI response → Validate & Preview → Save & return**

HyperPBI never sends the prompt itself. Review selected fields and privacy mode before copying.

### Dashboard setup

Describe the goal, audience, supported decisions, primary entity, application type, layout, important KPIs, sections/filters, device priority, interaction expectations, and complexity. Choose whether maps, tables, charts, controls, calculations, or detail panels are required.

The permanent **Inspector** tab works with saved, manually edited, imported, and AI-generated dashboards. Turn on **Inspect preview** to select nested or generated runtime components without firing runtime interactions; Escape exits inspection. The searchable hierarchy supports keyboard navigation. Wide layouts show resizable Tree and Properties panes; narrow layouts expose accessible Tree/Properties pane tabs while retaining selection. Inspector edits are complete-dashboard validated transactions with bounded undo/redo and support add child, insert before/after, move up/down/to another compatible container, recursive duplicate, and reference-aware deletion.

Selected-section redesign and add-section jobs return a discriminated `hyperpbi-change` package. Studio validates and previews the entire resulting dashboard first, shows a mutation summary, and requires an explicit **Apply change** action.

Studio uses this setup to choose relevant prompt modules; it does not add unimplemented features.

### Field Manifest

Use the shown aliases in new 2.0 authoring. The manifest also explains canonical key, display/source names, data type, semantic role, true measure versus summarized model column, default aggregation, and external selection/filter eligibility.

Prefer the dedicated **Map Latitude**, **Map Longitude**, **Map Geometry**, and **Map Address** roles. A coordinate's current visual-query aggregation is reported separately from its semantic-model default; change the visual query to **Don't summarize** when row-level coordinates were summarized.

### Prompt jobs

- **Create dashboard:** complete new 2.0 object
- **Improve current dashboard:** complete updated object; preserve version, stable IDs, and unrelated behavior
- **Add section:** section package with insertion target
- **Redesign selected section:** replacement using the selected stable ID
- **Repair invalid JSON:** complete corrected object based on diagnostics

Do not accept JSON Patch for normal improve/repair responses.

## Validate and preview

The importer extracts one JSON object, prepares aliases/definitions/patterns/datasets, and reports structured diagnostics. Version 2.0 is strict: unknown properties, invalid IDs, wrong enums, missing required properties, bad dataset stages, unknown fields/targets, and SVG limits are errors.

Use the JSON path and component ID in each diagnostic. Applied automatic repairs are listed separately. HyperPBI will not overwrite the last valid saved dashboard when validation fails.

## Visual Inspector

Select a rendered component to locate its stable authoring owner and exact JSON path. Field controls use the component's effective logical-dataset schema, dataset controls list valid datasets, component controls list compatible IDs, and structured fragments retain parse/validation errors inline. Preserve the ID when the component's role remains. A failed candidate keeps the current valid dashboard and the uncommitted local draft.

## Application shell

Configure the shell at root `app`, not `schema.app`. It can provide brand, navbar, sidebar, page header, footer, navigation, and actions. Use it for a sufficiently large app-style visual. Prefer offcanvas/modal/dropdown/popover components for narrow layouts.

## Components and catalogs

Use the generated [component catalog](hyperpbi-component-catalog-reference.md) for canonical types and properties. Prefer semantic charts, native table/matrix, first-class cards/lists/detail/overlays, `map`, and declarative `svg` before advanced/custom fallbacks.

Maturity is assigned explicitly in each canonical descriptor. **Stable** requires a renderer, strict schema, applicable field metadata, Inspector metadata, a valid example, responsive and empty-state behavior, accessibility guidance, and focused tests. **Beta** is implemented but is missing at least one stable requirement. **Experimental** is intentionally unstable and advanced. **Legacy** remains loadable for compatibility but is not recommended for new authoring. **Deprecated** is accepted only through documented migration or warning.

AI prompts exclude legacy and deprecated components. They include experimental components only when explicitly requested, and beta components only for explicit or advanced authoring. Existing dashboards may continue loading non-stable components.

## Interactions

Keep interface and data behavior separate:

- `uiAction` changes tabs, steps, shell/overlay/toast/scroll state
- `interaction` controls internal highlight/filter and external Power BI selection/filter
- `interactions` handles safe event-specific custom-content behavior

Power BI external filter mode requires a model-column target. Dataset metrics, derived fields, and true measures cannot directly filter the semantic model. Identity selection may work through source lineage.

## Maps

Bind Geometry or Latitude+Longitude (preferred), X+Y, or Address. Location precedence is Geometry → Lat/Lon → X/Y → Address, with valid explicit layer overrides ahead of roles and conservative fallback. Diagnostics report incomplete pairs, nonnumeric values, out-of-range values, valid locations, and query aggregation. One valid point centers at a bounded detail zoom; multiple points fit their bounds. Address search is user-triggered and requires a Maps package, provider configuration, WebAccess, and privacy acknowledgment.

Public ArcGIS feature/tile/basic dynamic services must be HTTPS and allowed by the installed package. Do not store tokens in the dashboard.

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
| External map/provider disabled | Use Maps package; verify WebAccess, HTTPS host, runtime config |
| Raw SVG disappears | Review sanitizer warnings, exact limits, forbidden resource/element use |
| AI response rejected | Return one complete JSON object; remove comments/fences/prose/multiple objects |

## Package commands for maintainers

```powershell
npm run package:core
npm run package:maps
npm run package:verify
```

Maps defaults to broad HTTPS. Set `HYPERPBI_ALLOW_ALL_MAP_HOSTS=false` and `HYPERPBI_MAP_HOSTS` for restricted packaging. See [Map services](map-services.md) and [Security](security.md).

## Version 1.0 dashboards

Existing 1.0 dashboards remain supported. Improve/repair them without changing version unless an explicit migration is requested. Legacy normalized keys, accordion/drawer/stepper forms, Tabulator input, map settings, and deprecated interaction flags are compatibility behavior—not recommended new-authoring examples.
