# HyperPBI User Guide

> New dashboards use strict schema 2.0 with field aliases, application patterns, logical data views, reusable styles, structured repair diagnostics, and a post-import visual inspector. Existing 1.0 dashboards continue to work.

## 1. What HyperPBI Does

HyperPBI turns declarative JSON specifications into professional Power BI dashboards. It renders application shells, responsive layouts, KPI cards, charts, tables, maps, forms, overlays, and custom components — without executing JavaScript.

## 2. Add the Visual and Bind Values

1. Import the `.pbiviz` file into Power BI Desktop
2. Add HyperPBI to your report canvas
3. Drag columns and measures into the **Values** field well
4. HyperPBI creates deterministic AI-friendly field aliases and retains normalized keys for compatibility

The Field Manifest shows each alias, display name, source, type, column/measure classification, semantic role, format, and selection/filter support. Copy this manifest for external AI authoring. Alias overrides are optional, validated, and stored once in Runtime Config. Types-only and restricted privacy choices do not expose raw values.

## 3. Open Edit Mode

Select the visual, open the **…** menu (top-right), and choose **Edit**. HyperPBI opens in focus mode.

## 4. Guided Builder Workflow

1. **Customize Dashboard Setup** (optional): prompt job, goal, audience, decisions, application pattern, sections, fields, device priority, style, and privacy mode
2. **Copy AI Prompt**: copies the complete prompt to clipboard
3. **Paste AI response**: paste JSON from any approved external model
4. **Validate & Preview**: extracts one object, shows safe repairs and structured diagnostics, compiles the canonical JSON, and renders a preview
5. **Visual inspector** (optional): edit common properties, fields, order, visibility, responsive width, and interactions with undo/redo
6. **Save & return**: saves only the successfully previewed specification to Power BI

## 5. Dashboard Setup Options

| Setting | Purpose |
|---------|---------|
| Goal | What the dashboard should show |
| Audience | Executive, Manager, Analyst, Field operations, Public viewer |
| Layout | KPI row, left filter drawer, map+details, full table, app shell, etc. |
| Components | KPI cards, charts, table, map, filters, app shell, detail panel, timeline, offcanvas |
| Style | Enterprise Light, Bright Modern, Dark Ops Center, Dense Compact, Map Command Center |
| Privacy | Field-only, sample, masked sample, summary, type-only |

## 6. Professional Application Layouts

Use an app shell (`schema.app`) only when the visual size can support it:
- **Wide (1100+ px):** Full navbar, sidebar, page header
- **Standard (800-1100 px):** Navbar, collapsible sidebar or offcanvas
- **Compact (600-800 px):** Navbar only, offcanvas for secondary content
- **Mobile tile (<600 px):** No permanent sidebar, offcanvas panels, stacked cards

Prefer offcanvas panels instead of permanent sidebars on narrow visuals.

## 7. Choosing Components

Prefer first-class components over custom HTML:
- Container → `card`
- Record list → `listGroup`
- Detail layout → `dataGrid`
- Menu → `dropdown`
- Dialog → `modal`
- Slide-over → `offcanvas`
- Empty data → `emptyState`
- Loading → `placeholder` or `spinner`

## 8. UI Actions vs Data Interactions

- Use `uiAction` for: opening modals, changing tabs, showing toasts, toggling sidebar, navigating steps
- Use `interaction` for: filtering data, highlighting rows, selecting Power BI identities
- Both can coexist on one component

## 9. Advanced Mode

Toggle **Advanced** to access: JSON editor, Runtime Config, AI Skill, Calculations, Map Services, Field Mapping, Interactions, Documentation, and full diagnostics panels.

## 10. Maps

Power BI spatial maps and practical public ArcGIS feature/reference layers, Power BI geometry joins, viewport queries, tile overlays, and basic dynamic images render end to end. Labels, tooltip/popup content, selection, layer visibility/opacity/order, inline diagnostics, legends, Home, Zoom to Selection, and Clear Selection are available. Map centers use `[latitude, longitude]`. See [map services](map-services.md) for the exact supported scope and limitations.

Use a Maps build profile for external tiles, geocoding, and ArcGIS requests:
```bash
npm run package:maps
npm run package:verify
```

## 11. Security and Privacy

- No user JavaScript executes
- HTML is sanitized; CSS is allowlisted and scoped
- AI prompts may contain field names and sample data — review before sending
- External services only available in Maps build profile

## 12. Troubleshooting

| Issue | Solution |
|-------|----------|
| JSON won't validate | Use Copy repair prompt; comments, smart quotes, trailing commas, and competing objects are diagnosed rather than silently rewritten |
| Preview is empty | Verify field aliases and logical data-view bindings in the Field Manifest |
| Map shows grid | Install Maps package or set basemap |
| No external tiles | Maps package + WebAccess required |
| Component not visible | Check `hidden`, `span`, parent container |
| Interaction not working | Verify `interaction.enabled: true` |
