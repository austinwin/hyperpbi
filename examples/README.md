# HyperPBI examples

Example files intentionally cover both schema generations.

## Current 2.0 examples

- `hyperpbi_svg_full_demo_bundle/hyperpbi_svg_full_demo.json`
- prompt files beginning with `v2-`
- prompt guidance in this directory that explicitly requests version 2.0

Use these as the starting point for new authoring. Confirm every alias against the current Field Manifest; aliases depend on the bound Power BI fields.

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
