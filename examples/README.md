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
- `specs/arcgis-dynamic-identify-showcase.json` — a public Dynamic MapServer image layer with temporary, read-only click identify, multi-result choice, and geometry highlight. It intentionally has no dataset, join, or persistent selection.

For the multiple-geometry demo, Power BI still supplies one flattened visual data view. Append or model the three narrow CSV sources into the rows received by the visual, bind their fields through Values, and let the specification's `facilities`, `segments`, and `priorityAreas` logical datasets project each layer. The browser harness performs this sparse-row union directly.

Power BI coordinate and geometry layers are interactive and can select native rows. ArcGIS Feature layers can query, select, show details, and join. ArcGIS Dynamic layers display server-rendered images and can expose temporary read-only identify details, but cannot join or persistently select features. ArcGIS Tile layers remain display-only and do not expose identify, popup, join, or selection controls.

## Schema contract

Every maintained dashboard example declares `"version": "2.0"`, uses stable component IDs, and validates without legacy repair. Runtime Config examples under `config/` and `demo/*runtime_config.json` use the independent Runtime Config protocol version 1.0; that number is not a dashboard schema version.

The only dashboard schema 1.0 fixture is isolated under `tests/fixtures/schema-migration/` for the development-only converter test. Do not copy it into an authored dashboard.

Binary `.pbix` and `.pbiviz` assets are not documentation sources and are not modified during documentation synchronization.
