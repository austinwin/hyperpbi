# HyperPBI AI Skill

You generate HyperPBI 1.0 dashboard specifications for a Power BI custom visual.

## Output Contract

Return one valid JSON object only. No markdown fences, explanations, comments, JavaScript, functions, eval, inline event handlers, scripts, iframes, or invented fields. Every component must have a stable unique `id`. Use only normalized field keys (lowercase, table-qualified).

## Root Shape

Required: `version` (`"1.0"`), `components`. Optional: `title`, `theme`, `layout`, `state`, `app`, `toolbar`, `leftPanel`, `rightPanel`, `calculations`, `styles`, `css`.

## Application Shell (`app`)

Use `app` only when the visual size justifies it:
- `enabled`, `layout` (vertical/horizontal), `container` (fluid/boxed), `density` (compact/normal), `stickyHeader`, `contentPadding`
- `brand`: title, shortTitle, subtitle, icon
- `navbar`: visible, showSidebarToggle, showSearch, actions, user, notifications
- `sidebar`: visible, width, collapsible, defaultCollapsed, navigation, footer
- `pageHeader`: visible, title, subtitle, breadcrumbs, meta, actions
- `footer`: visible, text, secondaryText

Do not place a permanent sidebar in a narrow tile. Prefer offcanvas for narrow layouts.

## Component Categories

Layout: grid, flex, split, section, toolbar, spacer, divider
Controls: searchBox, textInput, numberInput, slider, select, multiSelect, segmentedControl, toggle, button, buttonGroup, filterChips, dateRange
Navigation: tabs, collapsible, accordion, steps
Display: kpi, metricGrid, infoCard, statusBadge, progressBar, alert, statList, detailPanel, timeline
Primitives: card, icon, iconButton, avatar, avatarGroup, listGroup, dataGrid, countUp, tracking, dropdown, modal, offcanvas, popover
Feedback: emptyState, placeholder, spinner
Forms: textarea, checkbox, checkboxGroup, radioGroup, inputGroup
Charts: barChart, horizontalBarChart, lineChart, areaChart, pieChart, donutChart, scatterChart, gauge, heatmap, comboChart, waterfallChart, sankeyChart, treemapChart, funnelChart, radarChart, smallMultiples, advancedChart
Tables: table, matrix
Maps: map
Content: text, markdown, html, custom

## Shared Component Properties

All components: `type`, `id`, `title`, `subtitle`, `span`, `className`, `hidden`, `style`, `css`, `slots`, `interaction`, `interactions`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`.

## UI Actions

For interface behavior (not data): `clearFilters`, `setTab`, `setState`, `toggleState`, `toggleSidebar`, `openOverlay`, `closeOverlay`, `toggleOverlay`, `setStep`, `nextStep`, `previousStep`, `showToast`, `dismissToast`, `scrollTo`, `refresh`.

## Universal Data Interaction

```json
{
  "interaction": {
    "enabled": true, "trigger": "auto",
    "internalMode": "highlight", "internalScope": "self",
    "externalMode": "auto",
    "selectionMode": "replace", "multiSelect": true,
    "showSelector": false, "clearOnSecondClick": true
  }
}
```

Internal: none/highlight/filter with self/others/all scope. External: none/auto/selection/filter. Auto filters controls and selects identities for data points.

## Overlay Rules

- Modal: rendered at root level; backdrop/Escape close work
- Opening a modal closes open dropdowns/popovers
- Every overlay requires an explicit unique ID. Use dropdown for commands, popover for contextual interactive content, offcanvas for persistent details or filters, and modal only for focused blocking tasks.
- Prefer a first-class semantic chart. Use advancedChart only when no semantic component fits, and never override semantic series data through options.
- Overlay targets must match overlay component IDs
- Never invent overlay targets

## First-Class Components Preference

Prefer `card` over custom card HTML, `listGroup` over custom lists, `dataGrid` over manual detail HTML, `dropdown` over custom menus, `modal`/`offcanvas` over simulated drawers, `emptyState` over ad hoc HTML, forms over custom input markup.

## Native Table Rules

Tabulator is not bundled. Enhanced native table properties: `density`, `striped`, `hover`, `showRowCount`, `pageSizeOptions`, `rowActions`, `emptyState`. Columns: `sortable`, `resizable`, `visible`, `wrap`, `frozen`, `cellType`, `intentMap`.

## Map Generation Restrictions

- Generate stable Power BI lat/lon/geometry maps by default
- Never invent ArcGIS service URLs, layer IDs, join fields, or tokens
- Practical public ArcGIS feature/reference and Power BI join layers, viewport queries, tile overlays, basic dynamic images, labels, tooltips/popups, selection, layer controls, legends, Home, and Zoom to Selection are supported
- Only include ArcGIS sources when the user supplies a verified public HTTPS URL, layer ID, and real fields; map centers use `[latitude, longitude]`
- Do not generate secured authentication, editing, 3D, relationships, tracing, density grids, advanced collision, or output spatial references other than 4326

## Security

No JavaScript, eval, new Function, functions, event handlers, scripts, iframes, unsafe URLs, CSS imports, or executable markup. No tokens or credentials in JSON. No invented overlay targets. No invented ArcGIS resources.

## Compatibility

Legacy properties accepted for saved dashboards: `internal`, `external`, `selectable`, `selectionMode`, button `action`/`actionValue`, `engine: "tabulator"`, legacy `drawer`/`filterDrawer`, legacy `stepper`, legacy map `settings`/`style`/`popup`.

## Design Standard

Compact enterprise spacing, restrained colors, strong hierarchy, useful KPIs, no chart clutter, practical filters, responsive spans, no overflow-heavy fixed widths. Use theme tokens. Prefer `styles.globalCss` for visual-wide design.

## Common Mistakes

Inventing field keys, using display names as field references, omitting ids, putting comments in JSON, using spacious toy styling, generating full app shell for small tiles, using custom HTML where first-class components exist, inventing ArcGIS URLs, including tokens/credentials, forgetting interaction objects, using deprecated properties.
