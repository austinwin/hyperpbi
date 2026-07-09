# ChatGPT Authoring Guideline

Use this as a concise reference when generating HyperPBI dashboard JSON with ChatGPT or similar AI tools.

## Output Format

Return exactly one valid JSON object. No markdown fences, no explanations, no comments.

## Required Structure

```json
{
  "version": "1.0",
  "title": "Dashboard Title",
  "components": []
}
```

## Professional Application Shell (Optional)

Use root `app` only when the visual is wide enough (1100+ px):
```json
{
  "app": {
    "enabled": true,
    "layout": "vertical",
    "container": "fluid",
    "brand": { "title": "App Name" },
    "navbar": { "visible": true },
    "sidebar": {
      "visible": true,
      "collapsible": true,
      "navigation": [
        { "id": "overview", "label": "Overview", "icon": "dashboard",
          "action": { "type": "setTab", "target": "main_tabs", "value": "overview" } }
      ]
    },
    "pageHeader": { "visible": true, "title": "Page Title" }
  }
}
```

## Component Rules

1. Every component needs a unique `id` and `interaction` object
2. Use normalized field keys (lowercase, table-qualified)
3. Prefer first-class components (`card`, `listGroup`, `dataGrid`, `modal`, `offcanvas`) over custom HTML
4. Use `uiAction` for interface behavior; `interaction` for data behavior
5. Never use deprecated `internal`, `external`, `selectable` properties

## UI Actions

For interface behavior: `openOverlay`, `closeOverlay`, `setTab`, `showToast`, `setState`, `toggleSidebar`, `scrollTo`, `setStep`. `refresh` is a safe no-op.

## Data Interactions

```json
{
  "interaction": {
    "enabled": true,
    "trigger": "auto",
    "internalMode": "highlight",
    "internalScope": "self",
    "externalMode": "auto",
    "selectionMode": "replace",
    "multiSelect": true,
    "showSelector": false,
    "clearOnSecondClick": true
  }
}
```

## Maps

- Use stable Power BI spatial maps by default (lat/lon, geometry)
- Never invent ArcGIS service URLs, layer IDs, or tokens
- ArcGIS REST layered maps are developer preview

## Tables

- Tabulator is not bundled; native table is the engine
- Enhanced properties: `density`, `striped`, `hover`, `showRowCount`, `pageSizeOptions`, `rowActions`

## Security

- No JavaScript, functions, eval, event handlers, scripts, iframes
- No credentials or tokens anywhere in JSON
- HTML is sanitized; CSS is allowlisted and scoped
- Only HTTPS for external services (Maps build only)

## Responsive Sizing

- 12-column grid system via component `span`
- Below 700px: avoid permanent sidebar; use offcanvas
- Small tiles: compact cards, one primary analysis path
- No fixed pixel widths that overflow

## Minimal Example

```json
{
  "version": "1.0",
  "title": "Summary Dashboard",
  "theme": { "mode": "light", "density": "compact" },
  "components": [
    {
      "type": "metricGrid", "id": "metrics", "span": 12,
      "metrics": [
        { "title": "Records", "aggregation": "count", "format": "integer", "intent": "primary" }
      ],
      "interaction": { "enabled": false, "internalMode": "none", "externalMode": "none" }
    },
    {
      "type": "barChart", "id": "chart", "span": 7, "category": "__category_field_key__", "measure": "__measure_field_key__", "aggregation": "sum", "height": 300,
      "interaction": { "enabled": true, "trigger": "auto", "internalMode": "highlight", "internalScope": "self", "externalMode": "auto", "selectionMode": "replace", "multiSelect": true, "showSelector": false, "clearOnSecondClick": true }
    },
    {
      "type": "table", "id": "details", "span": 5, "columns": ["__field_key__"], "pagination": true, "pageSize": 25,
      "interaction": { "enabled": true, "trigger": "auto", "internalMode": "highlight", "internalScope": "self", "externalMode": "auto", "selectionMode": "replace", "multiSelect": true, "showSelector": true, "clearOnSecondClick": true }
    }
  ]
}
```
