# HyperPBI Houston Intensive Web-App Demo

> Compatibility example: the included dashboard JSON files intentionally use HyperPBI 1.0 normalized runtime keys. They demonstrate the preserved 1.0 path, not the recommended contract for new AI authoring. New dashboards should use version 2.0 and aliases from the current Field Manifest.

## Included files

- `hyperpbi_houston_demo_data.csv` — 240 synthetic Houston operations records.
- `hyperpbi_houston_intensive_dashboard_EXPECTED_KEYS.json` — 1.0 compatibility dashboard using normalized keys expected when the CSV table remains named `hyperpbi_houston_demo_data` and numeric values use Power BI's default Sum summarization.
- `hyperpbi_houston_intensive_dashboard_LOGICAL.json` — field-readable 1.0 compatibility source dashboard.
- `hyperpbi_houston_intensive_runtime_config.json` — Maps runtime configuration.
- `adapt_hyperpbi_dashboard_fields.py` — adapts the logical dashboard to the exact field inventory returned by HyperPBI.
- `hyperpbi_houston_intensive_component_coverage.json` — component and feature manifest.

## Fast setup

1. Build/import a HyperPBI **maps-broad** PBIVIZ.
2. Import `hyperpbi_houston_demo_data.csv` into Power BI.
3. Keep the query/table name as `hyperpbi_houston_demo_data`.
4. Add all CSV columns to HyperPBI's Values field well.
5. Paste `hyperpbi_houston_intensive_runtime_config.json` into Runtime Config.
6. Paste `hyperpbi_houston_intensive_dashboard_EXPECTED_KEYS.json` into Advanced JSON.
7. Validate and preview.

The map uses explicit OSM tiles:

`https://tile.openstreetmap.org/{z}/{x}/{y}.png`

The broad Maps PBIVIZ must contain `https://*` WebAccess.

## Compatibility field-key fallback

This adapter exists because the demo intentionally preserves 1.0 normalized keys. Power BI can change those keys when the query name or summarization changes. If validation reports unavailable fields:

1. Copy/export HyperPBI's current field inventory as JSON.
2. Run:

```bash
python adapt_hyperpbi_dashboard_fields.py   --dashboard hyperpbi_houston_intensive_dashboard_LOGICAL.json   --inventory field_inventory.json   --out hyperpbi_houston_intensive_dashboard_CURRENT_FIELDS.json
```

3. Paste the generated CURRENT_FIELDS JSON.

## Dashboard organization

### Executive

- Calculation DSL metrics and derived fields
- KPI, metric grid, count-up, progress, status badge
- Card, avatar group, stat list
- Executive bar, line, donut and scatter charts

### Chart Gallery

- Bar
- Horizontal bar
- Line
- Area
- Pie
- Donut
- Scatter
- Gauge
- Heatmap
- Small multiples

### Advanced Analytics

- Bar/line combo with dual axes
- Waterfall
- Radar
- Treemap
- Funnel
- Sankey
- Calendar heatmap
- Box plot

### Houston Map

- OSM basemap
- Power BI latitude/longitude points
- Clustering
- Unique-value priority renderer
- Proportional risk renderer
- Continuous response-time renderer
- Labels
- Tooltips
- Popups and safe actions
- Selection
- Layers, legend, opacity, order, label toggle, Home and Zoom to Selection

### Records & Matrix

- Searchable selectable table
- Matrix with heatmap
- Timeline/activity feed
- Selected-record detail rail
- Modal detail

### Component Lab

- Grid, section, card and collapsible layouts
- Steps, tracking, accordion and drawer
- Text, markdown, sanitized HTML and custom repeating content
- Text input, textarea, radio group, checkbox, toggle, input group and button group
- Icon, icon button, avatar, status badge, spinner, placeholder, empty state, alert and info card
- Data grid and list group

## Scope

The demo does not require external ArcGIS services; the map uses generated Houston latitude/longitude fields. Dropdown, offcanvas, and popover are implemented components, but this particular compatibility bundle is not intended to cover every current component.

## Synthetic-data note

All records are fictional and generated solely for demonstration. Neighborhood coordinates are approximate centers with random jitter and are not intended for operational decisions.
