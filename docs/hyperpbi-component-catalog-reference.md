# HyperPBI component catalog reference

## Application patterns (schema 2.0)

Patterns are AI-friendly authoring constructs compiled into the existing component runtime. Generated child IDs are derived from the pattern ID.

- `kpi-row`
- `trend-and-breakdown`
- `record-explorer`
- `map-and-details`

> Generated from canonical component definitions. Do not edit manually.
> Component count: 82

## Universal interaction

Every component supports the universal interaction object:

```json
{
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
```

## UI action reference

UI actions control interface behavior (navigation, overlays, toasts). They are separate from data interactions.

| Action | Required Fields | Description |
|--------|----------------|-------------|
| `clearFilters` | — | Clears all HyperPBI filters |
| `setTab` | target, value | Sets the active tab in a tab container |
| `setState` | target, value | Sets a named state value |
| `toggleState` | target | Toggles a Boolean state |
| `toggleSidebar` | — | Toggles the root sidebar collapsed state |
| `openOverlay` | target | Opens a modal, offcanvas, dropdown, popover, or legacy drawer |
| `closeOverlay` | target | Closes an overlay |
| `toggleOverlay` | target | Toggles an overlay |
| `setStep` | target, value | Sets the active step |
| `nextStep` | target | Advances to the next step |
| `previousStep` | target | Goes to the previous step |
| `showToast` | message, title?, intent?, durationMs? | Shows a toast notification |
| `dismissToast` | target | Dismisses a specific toast |
| `scrollTo` | target | Scrolls to a component by ID |
| `refresh` | — | Safe no-op (Power BI owns data refresh) |

## Application shell

The application shell is configured at the root level through `schema.app`, not as a component.
See the [specification reference](hyperpbi-spec-reference.md) for complete property documentation.

## Shared component properties

All components share these base properties:

| Property | Type | Description |
|----------|------|-------------|
| `type` | string | Component type identifier (required) |
| `id` | string | Unique stable identifier |
| `dataset` | string | Logical dataset name; omitted uses the Power BI data view |
| `title` | string | Display title |
| `subtitle` | string | Secondary display text |
| `span` | 1–12 | 12-column grid span |
| `className` | string | Additional CSS class |
| `hidden` | boolean | Hide the component |
| `style` | object | Inline CSS properties (sanitized) |
| `css` | string | Scoped CSS (allowlisted, scoped) |
| `slots` | object | Named HTML slot overrides |
| `interaction` | object | Universal data interaction policy |
| `interactions` | object | Safe custom event-to-data payloads |
| `ariaLabel` | string | Accessible label |
| `icon` | string | Icon name from bundled registry |
| `variant` | string | UI variant (primary, secondary, success, warning, danger, ghost, outline) |
| `size` | string | UI size (xs, sm, md, lg) |
| `disabled` | boolean | Disabled state |
| `tooltip` | object | Tooltip definition (content, placement, delayMs) |
| `uiAction` | object/array | Declarative UI action(s) |

Three independent behavior systems:

- **`interactions`** — Safe custom event-to-data payload resolver
- **`interaction`** — Universal local/Power BI data policy
- **`uiAction`** — Interface/navigation/overlay/state behavior

## Layout

### grid

<!-- component:grid -->

### flex

<!-- component:flex -->

### split

<!-- component:split -->

### section

<!-- component:section -->

### toolbar

<!-- component:toolbar -->

### leftPanel

<!-- component:leftPanel -->

### rightPanel

<!-- component:rightPanel -->

### spacer

<!-- component:spacer -->

### divider

<!-- component:divider -->

## Controls

### searchBox

<!-- component:searchBox -->

### textInput

<!-- component:textInput -->

### numberInput

<!-- component:numberInput -->

### slider

<!-- component:slider -->

### select

<!-- component:select -->

### multiSelect

<!-- component:multiSelect -->

### segmentedControl

<!-- component:segmentedControl -->

### toggle

<!-- component:toggle -->

### button

<!-- component:button -->

### buttonGroup

<!-- component:buttonGroup -->

### filterChips

<!-- component:filterChips -->

### dateRange

<!-- component:dateRange -->

## Navigation

### tabs

<!-- component:tabs -->

### collapsible

<!-- component:collapsible -->

### accordion

<!-- component:accordion -->

### drawer

<!-- component:drawer -->

### filterDrawer

<!-- component:filterDrawer -->

### steps

<!-- component:steps -->

### stepper

<!-- component:stepper -->

## Display

### kpi

<!-- component:kpi -->

### metricGrid

<!-- component:metricGrid -->

### infoCard

<!-- component:infoCard -->

### statusBadge

<!-- component:statusBadge -->

### progressBar

<!-- component:progressBar -->

### alert

<!-- component:alert -->

### statList

<!-- component:statList -->

### detailPanel

<!-- component:detailPanel -->

### timeline

<!-- component:timeline -->

## Primitives

### card

<!-- component:card -->

### icon

<!-- component:icon -->

### iconButton

<!-- component:iconButton -->

### avatar

<!-- component:avatar -->

### avatarGroup

<!-- component:avatarGroup -->

### listGroup

<!-- component:listGroup -->

### dataGrid

<!-- component:dataGrid -->

### countUp

<!-- component:countUp -->

### tracking

<!-- component:tracking -->

### dropdown

<!-- component:dropdown -->

### modal

<!-- component:modal -->

### offcanvas

<!-- component:offcanvas -->

### popover

<!-- component:popover -->

## Feedback

### emptyState

<!-- component:emptyState -->

### placeholder

<!-- component:placeholder -->

### spinner

<!-- component:spinner -->

## Forms

### textarea

<!-- component:textarea -->

### checkbox

<!-- component:checkbox -->

### checkboxGroup

<!-- component:checkboxGroup -->

### radioGroup

<!-- component:radioGroup -->

### inputGroup

<!-- component:inputGroup -->

## Charts

### barChart

<!-- component:barChart -->

### horizontalBarChart

<!-- component:horizontalBarChart -->

### lineChart

<!-- component:lineChart -->

### areaChart

<!-- component:areaChart -->

### pieChart

<!-- component:pieChart -->

### donutChart

<!-- component:donutChart -->

### scatterChart

<!-- component:scatterChart -->

### gauge

<!-- component:gauge -->

### heatmap

<!-- component:heatmap -->

### comboChart

<!-- component:comboChart -->

### waterfallChart

<!-- component:waterfallChart -->

### sankeyChart

<!-- component:sankeyChart -->

### treemapChart

<!-- component:treemapChart -->

### funnelChart

<!-- component:funnelChart -->

### radarChart

<!-- component:radarChart -->

### smallMultiples

<!-- component:smallMultiples -->

## Tables

### table

<!-- component:table -->

### matrix

<!-- component:matrix -->

## Maps

### map

<!-- component:map -->

Practical runtime support includes Power BI geometry, public ArcGIS feature layers and joins, viewport queries, tile and basic dynamic overlays, labels, tooltips/popups, selection, layer controls, legend, Home, and Zoom to Selection. External ArcGIS requests require a Maps package whose WebAccess hosts match the service.

## Compatibility

Legacy properties and types remain supported for existing dashboards:

- `accordion` with only `children` (no `items`) — wrapped into one item automatically
- `stepper` — rendered as a collapsible section. Use `steps` for new workflows.
- `drawer` / `filterDrawer` — supported. Use `offcanvas` for new components.
- `button.action` / `button.actionValue` — normalized to `uiAction` internally.
- `table.engine: "tabulator"` — normalized to native with a nonblocking warning.
- `map.settings` / `map.style` / `map.popup` — legacy map properties normalized to `layers[]`.
- Deprecated properties: `internal`, `external`, `selectable`, `selectionMode`.
