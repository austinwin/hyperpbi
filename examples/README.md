# HyperPBI examples

Example files intentionally cover both schema generations.

## Current 2.0 examples

- `hyperpbi_svg_full_demo_bundle/hyperpbi_svg_full_demo.json`
- prompt files beginning with `v2-`
- prompt guidance in this directory that explicitly requests version 2.0

Use these as the starting point for new authoring. Confirm every alias against the current Field Manifest; aliases depend on the bound Power BI fields.

## Map demos

The polished map showcase uses version 2 specifications in `specs/` and CSV inputs in `data/`:

- `specs/map-feature-showcase.json` + `data/map-feature-showcase.csv` — 10 municipal assets; columns: `asset_id`, `asset_type`, `status`, `latitude`, `longitude`.
- `specs/map-multiple-geometries.json` + three layer CSVs — 5 facilities with five columns, 4 segments with four columns, and 2 areas with three columns. The facility and segment sources intentionally share raw ID `A-01`.
- `specs/map-selection-details.json` + `data/map-selection-details.csv` — 8 response sites; columns: `site_id`, `category`, `severity`, `latitude`, `longitude`.
- `specs/arcgis-map-join-showcase.json` + `data/arcgis-map-join-showcase.csv` — 8 fictional work summaries with four columns joined to the existing public ArcGIS Feature service. `data/arcgis-map-join-service-fixture.csv` is the deterministic three-column service response used only by automated tests.

For the multiple-geometry demo, Power BI still supplies one flattened visual data view. Append or model the three narrow CSV sources into the rows received by the visual, bind their fields through Values, and let the specification's `facilities`, `segments`, and `priorityAreas` logical datasets project each layer. The browser harness performs this sparse-row union directly.

Power BI coordinate and geometry layers are interactive and can select native rows. ArcGIS Feature layers can query, select, show details, and join. ArcGIS Dynamic and Tile layers are display-only; the examples do not expose unsupported identify, popup, join, or selection controls for those sources.

## Intentional 1.0 compatibility examples

The following files are retained to verify and explain existing-dashboard compatibility. They use normalized runtime keys and may contain legacy component/property forms. Do not copy them as the primary contract for a new dashboard:

- root `hyperpbi-*.json` dashboards and `table-as-filter.json`
- `specs/executive-dashboard.json`
- `specs/custom-component-dashboard.json`
- `specs/calculations-dashboard.json`
- `specs/professional-operations-app.json`
- `specs/map-dashboard.json`
- `specs/guided-operations-dashboard.json`
- `config/hyperpbi-map-config.json`
- files under `components/` that declare `"version": "1.0"`
- Houston intensive demo JSON documented by `demo/README_hyperpbi_houston_intensive_demo.md`

These examples remain valid compatibility/history material. Normal improvement and repair should preserve their 1.0 version. Convert them to 2.0 only as an intentional migration using Field Manifest aliases, stable IDs, strict per-type properties, and full validation.

Binary `.pbix` and `.pbiviz` assets are not documentation sources and are not modified during documentation synchronization.
