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

Studio uses this setup to choose relevant prompt modules; it does not add unimplemented features.

### Field Manifest

Use the shown aliases in new 2.0 authoring. The manifest also explains canonical key, display/source names, data type, semantic role, true measure versus summarized model column, default aggregation, and external selection/filter eligibility.

If a latitude/longitude field is summarized in the Power BI query, change it to **Don't summarize**.

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

Select a rendered component to locate it by stable ID. The inspector edits canonical JSON for that component in the context of the whole specification. Validate the complete dashboard after every edit; preserve the ID when the component's role remains.

## Application shell

Configure the shell at root `app`, not `schema.app`. It can provide brand, navbar, sidebar, page header, footer, navigation, and actions. Use it for a sufficiently large app-style visual. Prefer offcanvas/modal/dropdown/popover components for narrow layouts.

## Components and catalogs

Use the generated [component catalog](hyperpbi-component-catalog-reference.md) for canonical types and properties. Prefer semantic charts, native table/matrix, first-class cards/lists/detail/overlays, `map`, and declarative `svg` before advanced/custom fallbacks.

## Interactions

Keep interface and data behavior separate:

- `uiAction` changes tabs, steps, shell/overlay/toast/scroll state
- `interaction` controls internal highlight/filter and external Power BI selection/filter
- `interactions` handles safe event-specific custom-content behavior

Power BI external filter mode requires a model-column target. Dataset metrics, derived fields, and true measures cannot directly filter the semantic model. Identity selection may work through source lineage.

## Maps

Bind Geometry or Latitude+Longitude (preferred), X+Y, or Address. Location precedence is Geometry → Lat/Lon → X/Y → Address. Address search is user-triggered and requires a Maps package, provider configuration, WebAccess, and privacy acknowledgment.

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
