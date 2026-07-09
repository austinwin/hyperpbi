# HyperPBI

HyperPBI is a schema-driven Power BI custom visual that compiles declarative JSON into professional enterprise dashboards and application-style interfaces. It renders application shells, responsive layouts, controls, metrics, tables, ECharts charts, Leaflet maps, custom components, sanitized HTML/CSS, safe calculations, and Power BI selections — without executing user JavaScript.

The repository includes a responsive, dependency-free [product landing page](index.html) ready for GitHub Pages, and a standalone [component catalog](hyperpbi-component-catalog-reference.html).

## Capability Summary

| Area | Capability |
|------|-----------|
| Authoring | Guided Builder, AI prompt, validation, preview, repair |
| Application layout | Navbar, sidebar, page header, footer, responsive shell |
| Components | ~60 first-class component types across 11 categories |
| Actions | Safe UI actions and Power BI data interactions (independent) |
| Data | Power BI Values field, calculations, identity selection |
| Charts | Simple and advanced ECharts (10 chart types + JSON-only advanced) |
| Tables | Native paginated, sortable, resizable, frozen columns |
| Maps | Stable Power BI spatial maps; ArcGIS REST developer foundations |
| Security | No user JavaScript, sanitized HTML, scoped CSS |
| Packaging | Core and Maps profiles |

## Workflow

1. Add HyperPBI to a Power BI report and drag columns/measures into the **Values** field well.
2. Select the visual, open the **…** menu, and choose **Edit**. HyperPBI opens in focus mode.
3. In **Guided Builder**, describe the dashboard goal, audience, layout, and components.
4. **Copy AI Prompt** and paste it into ChatGPT, DeepSeek, or Copilot.
5. Paste the AI response and select **Validate & Preview**.
6. Inspect the preview, then **Save & return**.

The specification and runtime config are saved with Power BI persistent visual properties.

## Studio

**HyperPBI Builder** (Simple mode) guides normal Power BI users through goal, audience, layout pattern, component selection, and style preset; then provides Copy AI Prompt, a response area, Validate & Preview, repair guidance, and Save. Raw JSON is never required.

**Advanced mode** exposes: JSON editor, Runtime Config, AI Skill, Calculations, Map Services, Field Mapping, Interactions, Documentation, and diagnostics. The designer/preview divider and bottom diagnostics panel are resizable.

**Advanced tabs:** Guided builder / AI builder, JSON, Runtime config, AI skill, Calculations, Map services, Field mapping, Interactions, Documentation.

## Professional Application Shell

Configured at the root level through `schema.app`:

- **Brand:** title, subtitle, icon, shortTitle
- **Navbar:** search, actions, user menu, notifications, sidebar toggle
- **Sidebar:** collapsible navigation groups, mobile offcanvas, footer
- **Page header:** breadcrumbs, title, subtitle, metadata, action buttons
- **Footer:** primary and secondary text
- **Layout:** vertical or horizontal, fluid or boxed, density, content padding, sticky header

The app shell is responsive: sidebar collapses at narrow widths or becomes an offcanvas overlay on mobile. Existing dashboards without `app` continue rendering unchanged.

See the [specification reference](docs/hyperpbi-spec-reference.md) and [professional operations example](examples/specs/professional-operations-app.json).

## Component Catalog

The catalog includes approximately 60 first-class component types across 11 categories:

| Category | Types |
|----------|-------|
| Layout | grid, flex, split, section, toolbar, leftPanel, rightPanel, spacer, divider |
| Controls | searchBox, textInput, numberInput, slider, select, multiSelect, segmentedControl, toggle, button, buttonGroup, filterChips, dateRange |
| Navigation | tabs, collapsible, accordion, drawer, filterDrawer, steps, stepper |
| Display | kpi, metricGrid, infoCard, statusBadge, progressBar, alert, statList, detailPanel, timeline |
| Primitives | card, icon, iconButton, avatar, avatarGroup, listGroup, dataGrid, countUp, tracking, dropdown, modal, offcanvas, popover |
| Feedback | emptyState, placeholder, spinner |
| Forms | textarea, checkbox, checkboxGroup, radioGroup, inputGroup |
| Charts | barChart, horizontalBarChart, lineChart, areaChart, pieChart, donutChart, scatterChart, gauge, heatmap, smallMultiples |
| Tables | table, matrix |
| Maps | map |
| Content/Advanced | text, markdown, html, custom, advancedChart |

See the [component catalog](hyperpbi-component-catalog-reference.html) for complete details.

### Shared Properties

All components support: `type`, `id`, `title`, `subtitle`, `span`, `className`, `hidden`, `style`, `css`, `slots`, `data`, `visibility`, `interaction`, `interactions`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`.

### UI Actions vs Data Interactions

Three independent behavior systems on every component:

- **`uiAction`** — Interface behavior: navigation, overlays, toasts, sidebar, steps, scrolling
- **`interaction`** — Universal data policy: internal highlight/filter, external Power BI selection/filter
- **`interactions`** — Safe custom event-to-data payload resolution

| UI Action | Purpose |
|-----------|---------|
| `clearFilters` | Clears all HyperPBI filters |
| `setTab` | Sets active tab (target, value required) |
| `setState` / `toggleState` | Named state management |
| `toggleSidebar` | Toggles root sidebar collapse |
| `openOverlay` / `closeOverlay` / `toggleOverlay` | Overlay visibility |
| `setStep` / `nextStep` / `previousStep` | Step progression |
| `showToast` / `dismissToast` | Toast notifications (1-30s duration) |
| `scrollTo` | Scroll to component by ID |
| `refresh` | Safe no-op (Power BI owns data refresh) |

## First-Class Components

Professional dashboards can be built with first-class components instead of custom HTML:

- **`card`** — Container with header, icon, subtitle, actions, footer, status, collapsible body
- **`listGroup`** — Data-bound or static list with badges, values, selection
- **`dataGrid`** — Label/value record detail, 1-4 columns, copyable fields
- **`iconButton`** / **`icon`** — Safe SVG icons from bundled registry (40+ icons)
- **`avatar`** / **`avatarGroup`** — Identity indicators with initials, status, overflow
- **`countUp`** — Animated number with prefix/suffix (respects reduced motion)
- **`tracking`** — Compact stage progress (horizontal/vertical)
- **`dropdown`** — Action menu (schema defined; renderer in development)
- **`modal`** — Focused overlay with backdrop/Escape close (focus trap in development)
- **`offcanvas`** — Slide-over panel (renders through legacy Drawer adapter)
- **`popover`** — Rich tooltip (schema defined; renderer in development)
- **`emptyState`** / **`placeholder`** / **`spinner`** — Empty, loading, skeleton states
- **`accordion`** — Real accordion with keyboard navigation, multiple/exclusive mode
- **`steps`** — Sequential workflow with configurable orientation

**Forms:** `textarea`, `checkbox`, `checkboxGroup`, `radioGroup`, `inputGroup` with labels, help/error text.

## Native Tables

The native table engine supports: `density` (compact/normal), `striped`, `hover`, `showRowCount`, `pageSizeOptions`, `rowActions`, `emptyState`. Columns support: `sortable`, `resizable`, `visible`, `wrap`, `frozen` (left/right), `cellType` (text/badge/progress), `intentMap`.

**Tabulator is not bundled.** `engine: "tabulator"` is normalized to native with a nonblocking warning.

## Maps

### Stable: Power BI Spatial Maps
Location priority: Geometry → Latitude/Longitude → X/Y → Address. GeoJSON and WKT point/line/polygon supported. Leaflet renders with selection, tooltips, popups, clustering, and legend.

### Developer Preview: ArcGIS REST Foundations
Declarative layered-map schema and ArcGIS REST service infrastructure exist (URL parsing, host policy, service inspection, query planning, safe WHERE generation, GeoJSON/Esri JSON parsing, geometry conversion, join engine). End-to-end ArcGIS feature rendering is not yet connected to the report renderer.

### Build Profiles
```bash
npm run package:core   # No WebAccess, certification posture
npm run package:maps   # WebAccess for OSM/Nominatim/ArcGIS
HYPERPBI_MAP_HOSTS="https://gis.example.org" npm run package:maps
```
Only HTTPS; user URLs cannot bypass package privileges. No tokens in JSON. Public services only.

See [map services](docs/map-services.md).

## Calculations

Derived fields and metrics using validated JSON operators: arithmetic, comparison, boolean, text, date, null, conditional. Aggregations: count, sum, avg, min, max, distinctCount, countWhere, sumWhere, avgWhere, ratio, percentOfTotal. See [calculation DSL](docs/calculations-dsl.md).

## Security

- No user JavaScript — no `eval`, `new Function`, event handlers, scripts, iframes
- HTML sanitized with DOMPurify; CSS parsed, allowlisted, scoped
- UI actions never execute code strings or navigate arbitrary URLs
- ArcGIS REST: HTTPS required, host allowlist, public services only
- Safe WHERE generation from validated field metadata
- Icons from bundled registry only; no arbitrary SVG

See [security](docs/security.md).

## Development

```powershell
npm install
npm run typecheck
npm test
npm run lint
npm start              # Power BI dev server
npm run package:core   # Certification build
npm run package:maps   # Map-provider build
npm run docs:generate  # Generate catalog docs
npm run docs:check     # Verify docs up to date
```

Generated files: `dist/*-core.pbiviz`, `dist/*-maps.pbiviz`.

## Documentation

| Document | Content |
|----------|---------|
| [User guide](docs/user-guide.md) | Workflow, Builder, troubleshooting |
| [Specification reference](docs/hyperpbi-spec-reference.md) | Complete JSON schema |
| [Component catalog](hyperpbi-component-catalog-reference.html) | Interactive catalog |
| [AI skill](docs/hyperpbi-ai-skill.md) | Engine contract for AI |
| [AI authoring](docs/ai-authoring.md) | Prompt composition guidance |
| [ChatGPT guideline](docs/chatgpt-guideline.md) | Concise authoring rules |
| [Interactions](docs/interactions.md) | UI actions + data interactions |
| [Custom components](docs/custom-components.md) | Sanitized HTML, repeats |
| [Map services](docs/map-services.md) | Maps, ArcGIS REST, hosts |
| [Calculation DSL](docs/calculations-dsl.md) | Derived fields, metrics |
| [Security](docs/security.md) | Security model |
| [Examples](examples/specs/) | Professional specs |

## Known Limitations

- Power BI host row and aggregation-memory limits bound total data
- Non-EPSG:4326 X/Y needs a projection adapter
- Tabulator is not bundled; native table is the supported engine
- Nominatim unsuitable for bulk production geocoding
- Maps package requires organizational WebAccess approval
- ArcGIS REST layered rendering is developer preview; end-to-end not connected
- Dropdown, popover, and dedicated offcanvas renderers are in development
- Map toolbar Home and Zoom-to-selection are placeholder handlers
- Layer panel reorder/opacity/label toggle UI not fully exposed
