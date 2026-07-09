# UI Actions and Data Interactions

HyperPBI has three independent behavior systems on every component:

| System | Property | Purpose |
|--------|----------|---------|
| UI Actions | `uiAction` | Interface behavior: navigation, overlays, toasts, sidebar, steps |
| Data Interaction | `interaction` | Universal data policy: internal highlight/filter, Power BI selection/filter |
| Custom Interactions | `interactions` | Safe event-to-data payload resolution (custom repeat rows) |

They are independent and may coexist on one component. A list item can both filter data (`interaction`) and open a detail modal (`uiAction`).

## UI Actions

UI actions control interface behavior. They never execute strings, navigate the browser, open arbitrary URLs, or trigger Power BI filtering.

| Action | Required Fields | Description |
|--------|----------------|-------------|
| `clearFilters` | — | Clears all HyperPBI internal filters |
| `setTab` | target, value | Sets active tab in a tab container |
| `setState` | target, value | Sets a named state value |
| `toggleState` | target | Toggles a Boolean state value |
| `toggleSidebar` | — | Toggles root sidebar collapsed state |
| `openOverlay` | target | Opens a modal, dropdown, or popover |
| `closeOverlay` | target | Closes an overlay |
| `toggleOverlay` | target | Toggles an overlay |
| `setStep` | target, value | Sets the active step in a steps component |
| `nextStep` | target | Advances to the next step |
| `previousStep` | target | Goes to the previous step |
| `showToast` | message, title?, intent?, durationMs? | Shows a toast notification (1-30s duration) |
| `dismissToast` | target (toast ID) | Dismisses a specific toast |
| `scrollTo` | target (component ID) | Scrolls to a component by ID |
| `refresh` | — | Safe no-op (Power BI owns data refresh) |

### UI-Only Example

```json
{
  "type": "iconButton",
  "id": "open_filters",
  "icon": "filter",
  "ariaLabel": "Open filters",
  "uiAction": {
    "type": "openOverlay",
    "target": "filters_panel"
  },
  "interaction": {
    "enabled": false,
    "internalMode": "none",
    "externalMode": "none"
  }
}
```

## Universal Data Interaction

Every component supports the universal `interaction` object for Power BI data behavior:

```json
{
  "interaction": {
    "enabled": true,
    "trigger": "auto",
    "internalMode": "highlight",
    "internalScope": "self",
    "externalMode": "auto",
    "field": "__field_key__",
    "operator": "=",
    "value": "__value__",
    "selectionMode": "replace",
    "multiSelect": true,
    "showSelector": false,
    "clearOnSecondClick": true
  }
}
```

### Internal Behavior
- `none` — No internal filtering/highlighting
- `highlight` — Highlight matching items; keep all visible
- `filter` — Filter to matching items only
- `self` / `others` / `all` — Scope of internal effect

### External Behavior
- `none` — No Power BI interaction
- `auto` — Controls filter Power BI; data points select identities
- `selection` — Select Power BI identities
- `filter` — Filter Power BI by field value (requires explicit field)

Runtime Config is only a global gate/fallback. Component interaction policy wins.

## Safe Custom Interactions

The `interactions` property resolves custom click/change events to data payloads for the universal engine. Used with custom repeat-row components:

```json
{
  "interactions": {
    "onClick": {
      "action": "selectWhere",
      "where": {
        "op": "=",
        "left": { "field": "category" },
        "right": { "valueFromRow": "category" }
      }
    }
  }
}
```

Supported actions: `selectRow`, `selectWhere`, `setFilter`, `clearFilter`, `clearSelection`, `setState`, `toggleState`, `openTab`, `toggleCollapse`, `openOverlay`, `closeOverlay`, `toggleOverlay`, `showToast`, `setStep`, `nextStep`, `previousStep`.

## Combined Behavior

When both `uiAction` and `interaction` are present, the UI action executes alongside the data interaction. Both fire on the same trigger event.

## Overlay Examples

### Open a Modal
```json
{
  "type": "button",
  "id": "open_settings",
  "label": "Settings",
  "uiAction": { "type": "openOverlay", "target": "settings_modal" },
  "interaction": { "enabled": false, "internalMode": "none", "externalMode": "none" }
}
```

### Toggle an Offcanvas
```json
{
  "uiAction": { "type": "toggleOverlay", "target": "filter_panel" }
}
```

Overlay targets must match the `id` of an existing `modal`, `dropdown`, `popover`, or `offcanvas` component. Opening a modal closes open dropdowns/popovers. Opening a dropdown closes other dropdowns.

## Compatibility

Legacy properties normalized internally:
- `button.action: "clearFilters"` → `uiAction: { type: "clearFilters" }`
- `button.action: "setTab"` + `actionValue` → `uiAction: { type: "setTab", target: "mainTabs", value: "..." }`
- Deprecated `internal`, `external`, `selectable`, `selectionMode` remain accepted
