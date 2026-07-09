# Custom Components

Custom components use sanitized HTML, scoped CSS, safe templates, and typed interactions. Use them only when first-class components cannot achieve the desired result.

## Before Using Custom

| Need | Prefer First-Class |
|------|-------------------|
| Container | `card` |
| Record list | `listGroup` |
| Detail layout | `dataGrid` |
| Menu | `dropdown` |
| Dialog | `modal` |
| Slide-over | `offcanvas` |
| Empty data | `emptyState` |
| Loading | `placeholder` or `spinner` |
| Workflow stage | `steps` or `tracking` |
| Input | Form component |

## Three Behavior Systems

### `interactions` (Safe Custom Interactions)
Resolves custom click/change events and row matches into data payloads:
```json
{
  "interactions": {
    "onClick": {
      "action": "selectWhere",
      "where": { "op": "=", "left": { "field": "category" }, "right": { "valueFromRow": "category" } }
    }
  }
}
```

### `interaction` (Universal Data Policy)
Controls internal filtering/highlighting and Power BI behavior:
```json
{
  "interaction": {
    "enabled": true,
    "trigger": "click",
    "internalMode": "none",
    "internalScope": "self",
    "externalMode": "filter",
    "field": "category",
    "operator": "="
  }
}
```

### `uiAction` (Interface Actions)
Controls overlays, navigation, toasts. Independent from data behavior.

## Template Tokens

Safe lookup tokens available in custom HTML templates:
- `{{row.field_key}}` — Row value
- `{{field_key.displayName}}` — Field display name
- `{{count}}` — Row count
- `{{sum.field_key}}`, `{{avg.field_key}}`, `{{min.field_key}}`, `{{max.field_key}}`
- `{{metric.key}}` — Calculated metric
- `{{selected.field_key}}` — Selected row value
- `{{prop.name}}` — Component prop value
- `{{state.name}}` — Dashboard state value

Tokens are lookups only — not executable expressions.

## Repeat Templates

Custom components can iterate over data rows:
```json
{
  "type": "custom",
  "id": "field_slicer",
  "repeat": {
    "source": "rows",
    "distinctBy": "field_key",
    "sortBy": "field_key",
    "sortDirection": "asc",
    "limit": 200,
    "template": "<span>{{row.field_key}}</span>"
  }
}
```

## Security

- HTML is sanitized with DOMPurify
- CSS is parsed, allowlisted, and scoped to the component
- No scripts, iframes, event handlers, or JavaScript URLs
- Templates use safe token lookup — no code execution
- Handled-event protection prevents parent/child conflicts
