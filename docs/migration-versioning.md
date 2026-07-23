# Migration and versioning

HyperPBI dashboard schema 2.0 is the only active authoring and rendering contract. Production code rejects dashboard schema 1.0 and missing versions; it never silently infers or migrates a dashboard version.

The dashboard schema version is separate from:

- the PBIVIZ/package version in `pbiviz.json` and `package.json`
- the Runtime Config protocol version used by the visual settings JSON
- the `hyperpbi-change` envelope protocol version used for bounded AI edit operations

Those independent protocols may have their own version numbers without changing the dashboard schema contract.

## Canonical dashboard schema 2.0

Every dashboard starts with an explicit root:

```json
{
  "version": "2.0",
  "components": []
}
```

Schema 2.0 requires globally unique stable component IDs, rejects unknown properties, resolves Field Manifest aliases or canonical field keys, and supports named datasets, definitions, application patterns, responsive rules, calculations, maps, tables, charts, SVG, interactions, UI actions, and security sanitization.

## Removed production compatibility paths

The visual, editor, preparation pipeline, renderer, AI importer, preview/save flow, and shared playground-facing runtime do not import or call a schema 1.0 migrator. The production field resolver does not translate display names or old normalized field keys.

The following schema 1.0-only forms were removed from the active contract:

- component type aliases `drawer` and `filterDrawer`; use `offcanvas`
- component type alias `stepper`; use `steps` for workflow progress or `collapsible` for collapsible content
- `tabs[].components` and `tabs[].content`; use `tabs[].children`
- top-level accordion `children`; use `items[].children`
- component flags `internal`, `external`, and table `selectable`; use `interaction`
- table top-level `selectionMode`; use `interaction.internalMode`, `interaction.selectionMode`, and `interaction.internalScope`
- button/button-group `action` and `actionValue`; use `uiAction`
- table `engine`, including `"tabulator"`; the canonical table is native
- implicit map `settings`, map-specific legacy `style`, top-level `popup`, and maps without explicit `layers`
- map feature-details mode `legacyPopup`
- map performance properties `generalizeByZoom`, `minimumGeneralization`, `maximumGeneralization`, and `progressiveRendering`
- map binding compatibility fields `legacyCompatibility`, `runtimeBindings`, `__color__`, and `__size__`
- obsolete interaction-looking inputs such as `selectionTarget`, `externalSelection`, `crossFilter`, and `powerBISelection` in dashboard JSON
- display-name and legacy normalized-key field-reference migration

Canonical schema 2.0 components that also existed historically remain supported under their documented 2.0 properties.

## Standalone development converter

Use the temporary converter only during development:

```powershell
npm run schema:migrate-v1 -- old-dashboard.json converted-dashboard.json
```

The converter:

- requires an input and output JSON path
- accepts a supported dashboard schema 1.0 file
- creates stable IDs and converts known compatibility forms
- validates the result with the strict schema 2.0 validator
- exits nonzero with actionable diagnostics when conversion is ambiguous or invalid
- refuses to overwrite the input unless `--overwrite-input` is explicitly passed to the underlying Node script

The converter lives at `scripts/migrate-schema-v1-to-v2.mjs`. It is not imported by production source, included in the `src/visual.ts` dependency graph, or packaged in PBIVIZ archives.

Field mappings and business aggregations are never guessed merely to satisfy validation. Review converted interactions, fields, map bindings, and output before replacing a production dashboard.

## Map compatibility after the analytical expansion

Existing 2.0 Power BI and ArcGIS map layers, popup/tooltip/label definitions, joins, clusters,
rectangle/lasso tools, and interaction policies remain supported. Legacy
`toolbar.rectangleSelection`/`toolbar.lassoSelection` still enable the corresponding tool; new
specifications should author structured `tools` definitions.

Existing `renderer.type: "heatmap"` specifications now render real weighted canvas intensity
instead of bounded point-symbol fallback. Set `interactivePoints: true` when selection of heat source
records is required. Heat pixels themselves are not selectable. New fields and runtime behavior are
listed in the [July 2026 map release note](releases/2026-07-analytical-maps.md).

## Package commands for maintainers

```powershell
npm run package:core
npm run package:maps
npm run package:verify
```

Maps defaults to broad HTTPS. Set `HYPERPBI_ALLOW_ALL_MAP_HOSTS=false` and `HYPERPBI_MAP_HOSTS` for restricted packaging. See [Map services](map-services.md) and [Security](security.md).
