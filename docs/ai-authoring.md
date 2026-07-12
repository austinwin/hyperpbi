# HyperPBI AI Authoring

## Prompt Composition

Generated prompts contain only relevant modules:

- SVG grammar is included only for SVG, animation, illustration, diagram, pictorial, gauge, pipeline, schematic, or moving-marker intent.
- AI guidance prefers declarative `type: "svg"`, approved presets, field aliases, bounded repeats, stable interactive IDs, and `ariaLabel`.
- Raw `svgMarkup` is not recommended unless the request explicitly needs raw SVG; JavaScript, events, external resources, `foreignObject`, and external libraries are always forbidden.
- Semantic field manifest (stable aliases, types, roles, formats, source capabilities, privacy-aware profiles)
- Privacy-selected sample rows
- Visual dimensions
- Relevant components and application patterns
- Application-shell contract
- UI-action contract
- Overlay contract
- Table contract
- Map contract
- Security contract
- Exact version 2.0 output contract

Prompt jobs are **Create dashboard**, **Improve current dashboard**, **Add section**, **Redesign selected section**, and **Repair invalid JSON**. Improve jobs include the complete current specification and require one complete updated specification with unrelated behavior and stable IDs preserved. Generic JSON Patch is not the default workflow.

The prompt always states: “Any component type, property, action, dataset operation, pattern, field alias, or design token not listed in this prompt is invalid.” Map and advanced-chart rules are omitted unless requested.

## Field aliases

Use the supplied `alias` in version 2.0 JSON. Aliases are generated from the underlying Power BI table and column metadata, remain stable when field order changes, qualify collisions with the source table, and use a stable hash only for remaining collisions. The manifest distinguishes true model measures from model columns summarized by the current visual query through `kind`, `queryAggregation`, and `isImplicitAggregation`. Existing normalized and unambiguous legacy wrapper keys still resolve for version 1.0 compatibility. Types-only and restricted privacy modes never expose raw examples.

For logical datasets, generated names (`derive`, rename targets, and metric keys) remain exactly as authored. Components may reference them only when their selected dataset exposes them. Do not use derived or metric fields as direct Power BI external-filter targets; use selection/highlight or a retained group-by/model column.

## Application patterns

- `kpi-row` — a responsive row of KPI components
- `trend-and-breakdown` — coordinated trend and category charts
- `record-explorer` — searchable table and selected-record detail panel
- `map-and-details` — map and selected-location details

Patterns compile to existing first-class components. They do not add a second runtime or bypass validation.

## Choosing an Application Shell

- Use `app` for a true full-page or large dashboard (>1100px)
- Avoid in small embedded tiles (<600px)
- Use compact page header without sidebar for medium views (600-800px)
- Use offcanvas on narrow views instead of permanent sidebar
- Never emulate the app shell using giant custom HTML/CSS

## Choosing First-Class Components

Prefer first-class components over custom HTML:

| Need | Prefer |
|------|--------|
| Container | `card` |
| Record list | `listGroup` |
| Detail layout | `dataGrid` |
| Menu | `dropdown` |
| Dialog | `modal` |
| Slide-over | `offcanvas` |
| Empty data | `emptyState` |
| Loading | `placeholder` or `spinner` |
| Input | First-class form component |

Prefer semantic `comboChart`, `waterfallChart`, `sankeyChart`, `treemapChart`, `funnelChart`, and `radarChart` components when they match the request. Use `advancedChart` only for uncommon ECharts configurations, and never override generated semantic data through `options`.

Every overlay needs an explicit unique ID. Use dropdown for commands, popover for contextual interactive content, offcanvas for persistent details or filters, and modal only for focused blocking tasks.

## Action Selection

- Need to open a modal? → `uiAction: { type: "openOverlay" }`
- Need to change a tab? → `uiAction: { type: "setTab" }`
- Need to show a toast? → `uiAction: { type: "showToast" }`
- Need to filter HyperPBI data? → `interaction.internalMode: "filter"`
- Need to select Power BI identities? → `interaction.externalMode: "selection"`
- Need to resolve a repeated custom row? → `interactions` + `interaction`

## Map Generation Rules

- Always prefer stable Power BI lat/lon/geometry maps by default
- Only generate ArcGIS layers when the user explicitly provides a verified public HTTPS service URL, layer ID, and real fields
- Never invent ArcGIS service URLs, layer IDs, join fields, or tokens
- Never include credentials in any form
- Practical ArcGIS feature/reference and Power BI join layers, viewport queries, tiles, basic dynamic images, labels, tooltips/popups, selection, layer controls, legends, Home, and Zoom to Selection are supported
- Use `[latitude, longitude]` for map centers and output SR 4326; do not generate authentication, editing, 3D, relationship/tracing, density-grid, advanced-collision, or non-4326 configurations

## Sharing Component Properties

All components share: `type`, `id`, `title`, `subtitle`, `span`, `className`, `hidden`, `style`, `css`, `slots`, `interaction`, `interactions`, `ariaLabel`, `icon`, `variant`, `size`, `disabled`, `tooltip`, `uiAction`.

## Style Guidance

- Use compact enterprise spacing
- Restrained colors; avoid rainbow palettes
- Strong hierarchy: header → KPI → filter → chart → detail
- Responsive 12-column spans
- No fixed widths that overflow
- Use theme tokens rather than hardcoded colors
- Prefer `styles.globalCss` for visual-wide design

## Common Mistakes

- Inventing fields instead of using supplied aliases
- Using display names as field references
- Omitting component `id`
- Putting comments in JSON
- Using spacious toy styling for enterprise dashboards
- Generating a full app shell for a small tile
- Using custom HTML where first-class components exist
- Inventing ArcGIS service URLs
- Including tokens or credentials
- Forgetting `interaction` on interactive components
- Using deprecated `internal`, `external`, `selectable` properties
