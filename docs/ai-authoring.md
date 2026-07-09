# HyperPBI AI Authoring

## Prompt Composition

Generated prompts contain:
- Field dictionary (normalized keys, types, display names)
- Privacy-selected sample rows
- Visual dimensions
- Current component catalog
- Application-shell contract
- UI-action contract
- Overlay contract
- Table contract
- Map contract
- Security contract
- Dashboard recipes

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

## Action Selection

- Need to open a modal? → `uiAction: { type: "openOverlay" }`
- Need to change a tab? → `uiAction: { type: "setTab" }`
- Need to show a toast? → `uiAction: { type: "showToast" }`
- Need to filter HyperPBI data? → `interaction.internalMode: "filter"`
- Need to select Power BI identities? → `interaction.externalMode: "selection"`
- Need to resolve a repeated custom row? → `interactions` + `interaction`

## Map Generation Rules

- Always prefer stable Power BI lat/lon/geometry maps by default
- Only generate ArcGIS layers when the user explicitly provides a service URL and confirms runtime support
- Never invent ArcGIS service URLs, layer IDs, join fields, or tokens
- Never include credentials in any form
- The layered ArcGIS REST schema is developer-preview

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

- Inventing field keys instead of using normalized ones
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
