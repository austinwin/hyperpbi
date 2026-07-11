# HyperPBI Specification Reference

Reference for strict HyperPBI 2.0 authoring and compatible HyperPBI 1.0 dashboard specifications.

Version 2.0 rejects unknown properties and requires stable component IDs. Version 1.0 remains lenient and supports normalized/legacy field keys. Both use the same renderer; patterns and definitions are compiled before rendering.

## Root Document

| Key | Required | Type | Description |
|-----|----------|------|-------------|
| `version` | Yes | `"2.0"` or compatible `"1.0"` | Schema version |
| `data.datasets` | No | object | Named logical datasets derived from the Power BI data view |
| `definitions` | No | object | Reusable component defaults |
| `title` | No | string | Dashboard title (max 200 chars) |
| `theme` | No | object | Theme configuration |
| `layout` | No | object | Legacy layout configuration |
| `state` | No | object | Initial state (search, activeTab, filters) |
| `app` | No | object | Application shell configuration |
| `toolbar` | No | array | Toolbar components (max 100) |
| `leftPanel` | No | array | Left panel components (max 200) |
| `rightPanel` | No | array | Right panel components (max 200) |
| `components` | Yes | array | Dashboard components (max 500) |
| `calculations` | No | object | Calculation specification |
| `styles` | No | object | Global style system |
| `css` | No | string | Deprecated global CSS (max 100k chars) |

## Theme

| Key | Type | Default |
|-----|------|---------|
| `mode` | `"light"` \| `"dark"` \| `"auto"` | `"light"` |
| `density` | `"compact"` \| `"normal"` \| `"spacious"` | `"normal"` |
| `fontFamily` | string | System font |
| `primaryColor` | string | `#206bc4` |
| `surfaceColor` | string | `#ffffff` |
| `textColor` | string | `#182433` |
| `borderColor` | string | `#dce1e7` |
| `radius` | number | `6` |
| `cardPadding` | number | `12` |
| `gap` | number | `12` |

## Application Shell

See `src/schema/uiSchema.ts` for the complete `AppShellConfig` interface.

**Brand:** `title`, `subtitle`, `icon`, `shortTitle`
**Navbar:** `visible`, `showSidebarToggle`, `showSearch`, `actions[]`, `user`, `notifications`
**Sidebar:** `visible`, `width`, `collapsedWidth`, `collapsible`, `defaultCollapsed`, `navigation[]`, `footer`
**Page Header:** `visible`, `title`, `subtitle`, `breadcrumbs[]`, `meta[]`, `actions[]`
**Footer:** `visible`, `text`, `secondaryText`

## Shared Component Properties

All components support:

| Property | Type | Description |
|----------|------|-------------|
| `type` | string | Component type (required) |
| `id` | string | Unique stable ID |
| `dataset` | string | Named logical dataset; omitted uses Power BI data view |
| `title` | string | Display title |
| `subtitle` | string | Secondary text |
| `span` | 1-12 | Grid column span |
| `className` | string | CSS class |
| `hidden` | boolean | Hide component |
| `style` | object | Inline CSS (sanitized) |
| `css` | string | Scoped CSS |
| `slots` | object | Named HTML slot overrides |
| `interaction` | object | Universal data interaction |
| `interactions` | object | Safe custom interactions |
| `ariaLabel` | string | Accessible label |
| `icon` | string | Icon from bundled registry |
| `variant` | string | UI variant |
| `size` | string | UI size (xs/sm/md/lg) |
| `disabled` | boolean | Disabled state |
| `tooltip` | object | Tooltip definition |
| `uiAction` | object/array | UI action(s) |

Three independent behavior systems:
- **`interactions`** — safe custom event-to-data payloads
- **`interaction`** — universal Power BI data policy
- **`uiAction`** — interface/navigation/overlay behavior

## UI Actions

| Action | Required | Description |
|--------|----------|-------------|
| `clearFilters` | — | Clear all HyperPBI filters |
| `setTab` | target, value | Set active tab |
| `setState` | target, value | Set state value |
| `toggleState` | target | Toggle Boolean state |
| `toggleSidebar` | — | Toggle sidebar collapse |
| `openOverlay` | target | Open overlay |
| `closeOverlay` | target | Close overlay |
| `toggleOverlay` | target | Toggle overlay |
| `setStep` | target, value | Set active step |
| `nextStep` | target | Advance step |
| `previousStep` | target | Reverse step |
| `showToast` | message, title?, intent?, durationMs? | Show toast (1-30s) |
| `dismissToast` | target (toast ID) | Dismiss toast |
| `scrollTo` | target (component ID) | Scroll to component |
| `refresh` | — | Safe no-op |

## Universal Data Interaction

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
    "selectionMode": "replace",
    "multiSelect": true,
    "showSelector": false,
    "clearOnSecondClick": true
  }
}
```

## Containers

Layout types: `grid`, `flex`, `split`, `section`, `toolbar`, `leftPanel`, `rightPanel`. All support `children`, `direction`, `gap`, `columns`.

## Overlays

- **`modal`**: title, children, footer, size (sm/md/lg), backdropClose. Rendered by root OverlayHost.
- **`offcanvas`**: explicit id, title, children, position (left/right), width, openWhen (always/selectedRow/state), backdrop. Root-hosted with focus management.
- **`dropdown`**: explicit id, trigger, items (with dividers, disabled, actions/interactions and one nested level), placement. Keyboard-accessible and viewport-aware.
- **`popover`**: explicit id, trigger, children, typed placement, width and arrow controls. Use for contextual interactive content.

Overlay targets must match component IDs. Opening a modal closes open dropdowns/popovers.

Prefer semantic `comboChart`, `waterfallChart`, `sankeyChart`, `treemapChart`, `funnelChart`, and `radarChart` components when applicable. Use `advancedChart` only for uncommon configurations. Semantic chart `options` are presentation-only and cannot replace generated data, links, nodes, transforms, encodings, series types, or series counts.

## Forms

`textarea`, `checkbox`, `checkboxGroup`, `radioGroup`, `inputGroup`. Shared properties: `description`, `helpText`, `errorText`, `required`, `orientation`, `rows`, `maxLength`, prefix/suffix.

## Tables

Native table properties: `density`, `striped`, `hover`, `showRowCount`, `pageSizeOptions`, `rowActions`, `emptyState`. Column properties: `sortable`, `resizable`, `visible`, `wrap`, `frozen`, `cellType`, `intentMap`. Tabulator is not bundled.

## Maps

See [map services documentation](map-services.md) for complete coverage. Legacy `settings`/`style`/`popup` remain supported and normalize into the resolved `layers[]` model.

- `view.center` is `[latitude, longitude]`; practical ArcGIS query output is SR 4326.
- `layers[].source.type` supports `powerbi`, `arcgisFeature`, `arcgisTile`, and `arcgisDynamic`.
- Feature sources support reference or Power BI join mode, definition expressions, explicit output fields, opt-in service renderer/labels, viewport queries, cache/feature/batch limits, and managed refresh intervals.
- Tooltip definitions validate `enabled`, `template`, and `fields[]` (`field`, `fieldSource`, `label`, `format`). Tooltip configuration is not inferred from popup fields.
- Layer panels support viewer visibility, opacity, labels, order, Reset, and inline diagnostics. Toolbar controls support Home, Layers, Legend, Clear Selection, and Zoom to Selection.
- The practical runtime excludes secured authentication, editing, 3D, relationships, tracing, density grids, advanced label collision, and non-4326 output.

## Compatibility

- Legacy `internal`/`external` → use `interaction.internalMode`/`interaction.externalMode`
- Legacy `selectable`/`selectionMode` → use `interaction.showSelector`/`interaction.internalMode`
- `drawer`/`filterDrawer` → supported; use `offcanvas` for new specs
- `stepper` → supported; use `steps` for new workflows
- `engine: "tabulator"` → normalized to native with warning
- Legacy map properties → normalized to `layers[]` internally
