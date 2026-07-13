# HyperPBI Component Showcase — Runtime-Key Fix

This corrected package uses the exact Power BI runtime field keys from the
provided HyperPBI field inventory. It does not depend on friendly-name or alias
resolution for nested component bindings.

## Files

- `hyperpbi_component_showcase_data.csv`
- `hyperpbi_component_showcase_fixed.json`

## Setup

1. Import the CSV into Power BI.
2. Keep the table name `hyperpbi_component_showcase_data`.
3. Add all CSV columns to the HyperPBI visual.
4. Set `latitude` and `longitude` to **Don't summarize**.
5. Paste `hyperpbi_component_showcase_fixed.json` into HyperPBI Studio.
6. Validate, preview, and save.

## What was corrected

- Replaced all 23 friendly field references with exact runtime keys such as
  `hyperpbi_component_showcase_data_recordid`.
- Corrected nested bindings in detail panels, tables, maps, custom content,
  SVG templates, popups, tooltips, interactions, datasets, and patterns.
- Removed obsolete `selectionTarget` properties.
- Added the supported Sankey binding through `component.interaction.field`.
- Preserved the original 48-row compact CSV and the complete component gallery.

## Map requirement

The CSV imports latitude and longitude as numeric columns. Power BI commonly
summarizes numeric fields by default. Set both fields to **Don't summarize**;
otherwise coordinates may be aggregated and the map can render incorrect
locations even when validation succeeds.

All records and coordinates are synthetic and for demonstration only.
