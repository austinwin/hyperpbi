export const HYPERPBI_HELP_MARKDOWN = `# HyperPBI authoring guide

HyperPBI is a Power BI custom visual that compiles safe JSON into complete dashboards. Bind data to the single Values field well, open Studio, generate an AI prompt, import the returned JSON, validate, preview, and save.

## Specification and Config

- Specification: theme, global styles, layout, components, calculations, slots, HTML, and component interactions.
- Runtime Config: map field semantics, provider policy, renderer settings, and Power BI interactions.
- Use normalized field keys from the Fields panel. Never guess field names.

## Global design system

Use styles.globalCss for visual-wide CSS. HyperPBI parses, allowlists, and scopes it to the visual root. Use styles.components for defaults shared by all components, a component type, or a specific component id.

~~~json
{
  "styles": {
    "globalCss": ".hp-card { border: 1px solid var(--hp-border); }",
    "components": {
      "*": { "style": { "minWidth": 0 } },
      "kpi": { "className": "app-kpi", "css": ".hp-metric-value { font-size: 22px; }" },
      "#critical_kpi": { "css": ".hp-metric { border-left: 4px solid var(--hp-danger); }" }
    }
  }
}
~~~

Existing root css remains supported as an alias for global visual CSS. Component css is scoped to data-hp-id and cannot leak to another component.

## Tabs

Use tabs[].children. For compatibility, HyperPBI also migrates tabs[].components and tabs[].content to children.

## Safe calculations

Use calculations.fields and calculations.metrics. Expressions are JSON nodes containing field, value, or op. JavaScript, functions, eval, and event handlers are forbidden.

## Custom components

Custom components support sanitized html, scoped css, props, slots, repeat templates, metric/row/state tokens, and predefined actions such as selectWhere and clearSelection.

## Table selection

Selectable tables filter themselves to the selected row(s) by default and expose Show all. Set selectionMode to highlight to keep all rows visible. A normal click replaces selection; Ctrl/Cmd-click adds or removes rows. External Power BI filtering still requires valid selection identities, model relationships, host interaction support, and enabled report interactions.

## Maps

Location priority is Geometry, Latitude/Longitude, X/Y, then Address. Core mode has no external access. Maps mode can use OSM and user-triggered Nominatim after WebAccess and privacy approval.

## Validation and repair

Validate reports structural, field, calculation, provider, and security errors. Start Render validates and updates only the Studio preview. Back to Report validates, persists properties, exits Studio, and renders. When AI JSON fails, use Copy repair prompt.

## Security

No user JavaScript is executed. HTML is sanitized with DOMPurify. CSS is parsed, allowlisted, and scoped. Scripts, iframes, inline handlers, CSS imports, unsafe URLs, fixed positioning, and abusive z-index are blocked.`;

export const HYPERPBI_SKILL_MARKDOWN = `# HyperPBI dashboard authoring skill

You generate HyperPBI 1.0 dashboard specifications for a Power BI custom visual.

## Output contract

Return one valid JSON object only. Do not return markdown fences, explanations, comments, JavaScript, functions, eval, event handlers, scripts, iframes, or invented fields. Every component must have a stable unique id. Use only normalized field keys provided by the user.

## Root shape

Required: version and components. Optional: title, theme, layout, state, toolbar, leftPanel, rightPanel, calculations, styles, css.

## Components

Layouts: grid, flex, split, leftPanel, rightPanel, toolbar, section, spacer, divider.
Controls: searchBox, textInput, numberInput, slider, select, multiSelect, toggle, button, buttonGroup, filterChips, dateRange.
Navigation: tabs, collapsible, accordion.
Display: kpi, metricGrid, infoCard, statusBadge, progressBar, alert, statList, detailPanel.
Charts: barChart, horizontalBarChart, lineChart, areaChart, pieChart, donutChart, scatterChart, gauge, heatmap.
Data/content: table, map, html, text, markdown, custom.

## Global styling

styles.globalCss is application-wide CSS scoped to the HyperPBI visual. styles.components supports keys *, component type names, and #component_id. Each rule may contain className, style, and css. Component-level css overrides global defaults and is scoped to that component.

## Templates

Allowed tokens include count, title, sum.field, avg.field, min.field, max.field, distinctCount.field, metric.key, selected.field, row.field, field.key.displayName, prop.name, and state.name. Tokens are lookups, not executable expressions.

## Calculations

Use field/value nodes and safe operators: arithmetic, comparison, boolean, text, date, null, if, and case. Metrics support count, countWhere, sum, sumWhere, avg, avgWhere, min, max, distinctCount, ratio, and percentOfTotal.

## Design standard

Create a compact enterprise dashboard with restrained colors, strong hierarchy, useful KPIs, no chart clutter, practical filters, a detail table, and a map only when location fields exist. Ensure responsive 12-column spans and avoid fixed widths that overflow.

## Map and interaction rules

Provider settings belong in Runtime Config. Do not trigger geocoding automatically. Use selectable tables/charts/maps where external Power BI interactions are useful. Internal filters and external Power BI selections are separate.

Selectable tables filter to selected rows by default. Use selectionMode "highlight" only when the dashboard should retain every row while highlighting selection.

## Common mistakes

Do not invent fields, use display names instead of keys, omit ids, put comments in JSON, put provider settings on every map, use unsupported chart types, create tabs without children, or produce spacious toy styling.`;
