# ChatGPT Authoring Guideline

Use the self-contained prompt copied from the Guided Builder. Return exactly one complete JSON object using the requested schema version—normally `2.0`. Use only the field aliases, logical dataset operations, application patterns, components, properties, actions, and design tokens listed in that prompt. Do not return Markdown fences, explanation, JSON Patch, JavaScript, functions, credentials, or invented fields.

For improvements, preserve stable IDs and unrelated working behavior and return the complete updated specification. For repairs, address the structured diagnostics without changing field choice, aggregation meaning, interactions, filters, or business logic unless the requested change explicitly requires it.

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
4. Prefer first-class semantic charts, including combo, waterfall, Sankey, treemap, funnel, and radar; use `advancedChart` only when no semantic chart fits
5. Require explicit unique IDs for every overlay. Use dropdown for commands, popover for contextual content, offcanvas for persistent details/filters, and modal for blocking tasks
6. Never place JavaScript in ECharts options or override semantic chart data through `options`
7. Use `uiAction` for interface behavior; `interaction` for data behavior
8. Never use deprecated `internal`, `external`, `selectable` properties

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
- Practical public ArcGIS feature/join, viewport, tile, basic dynamic, label, tooltip/popup, selection, layer-control, legend, Home, and Zoom-to-Selection behavior is supported; use only verified HTTPS resources and output SR 4326

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
