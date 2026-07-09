export const HYPERPBI_HELP_MARKDOWN = `# HyperPBI authoring guide

HyperPBI is a Power BI custom visual that compiles safe JSON into professional dashboards and application-style interfaces. The Builder prioritizes Copy AI Prompt, Paste AI response, Validate & Preview, and Save & return.

## Guided Builder

Simple-mode workflow: Copy AI Prompt → Paste AI response → Validate & Preview → Save & return. Optional guided setup (goal, audience, layout, components, style, privacy) under Dashboard setup → Customize.

## Application Shell

Configure root \`app\` for professional layouts: brand, navbar, sidebar, page header, footer. Use only when visual size supports it. Prefer offcanvas for narrow views.

## Component Categories

Layout, Controls, Navigation, Display, Primitives (card, listGroup, dataGrid, modal, offcanvas, etc.), Feedback, Forms, Charts, Tables, Maps, Content, Advanced.

## UI Actions vs Data Interactions

- \`uiAction\`: interface behavior (open modals, change tabs, show toasts)
- \`interaction\`: data behavior (filter, highlight, Power BI selection)
- Both may coexist on one component

## Maps

Power BI spatial maps (lat/lon, geometry) are stable. ArcGIS REST layered maps are developer preview. Use Maps package for OSM tiles: \`npm run package:maps\`.

## Tables

Native table with enhanced features. Tabulator is not bundled.

## Security

No user JavaScript. HTML sanitized. CSS allowlisted and scoped. No tokens in JSON. See security documentation for details.`;

export const HYPERPBI_SKILL_MARKDOWN = `# HyperPBI dashboard authoring skill

You generate HyperPBI 1.0 dashboard specifications for a Power BI custom visual.

## Output contract

Return one valid JSON object only. No markdown fences, explanations, comments, JavaScript, functions, eval, event handlers, scripts, iframes, or invented fields. Every component must have a stable unique id. Use normalized field keys only.

## Root shape

Required: \`version\` ("1.0"), \`components\`. Optional: \`title\`, \`theme\`, \`layout\`, \`state\`, \`app\`, \`toolbar\`, \`leftPanel\`, \`rightPanel\`, \`calculations\`, \`styles\`, \`css\`.

## Application shell

Root \`app\` for professional layouts. Use only when visual size justifies it. Do not place permanent sidebar in narrow tile. Prefer offcanvas for narrow layouts.

## Components

Layout: grid, flex, split, section, toolbar, spacer, divider.
Controls: searchBox, textInput, numberInput, slider, select, multiSelect, segmentedControl, toggle, button, buttonGroup, filterChips, dateRange.
Navigation: tabs, collapsible, accordion, steps.
Display: kpi, metricGrid, infoCard, statusBadge, progressBar, alert, statList, detailPanel, timeline.
Primitives: card, icon, iconButton, avatar, avatarGroup, listGroup, dataGrid, countUp, tracking, dropdown, modal, offcanvas, popover.
Feedback: emptyState, placeholder, spinner.
Forms: textarea, checkbox, checkboxGroup, radioGroup, inputGroup.
Charts: barChart, horizontalBarChart, lineChart, areaChart, pieChart, donutChart, scatterChart, gauge, heatmap, smallMultiples, advancedChart.
Tables: table, matrix.
Maps: map.
Content: text, markdown, html, custom.

## Shared properties

All components: type, id, title, subtitle, span, className, hidden, style, css, slots, interaction, interactions, ariaLabel, icon, variant, size, disabled, tooltip, uiAction.

## UI actions

For interface behavior: clearFilters, setTab, setState, toggleState, toggleSidebar, openOverlay, closeOverlay, toggleOverlay, setStep, nextStep, previousStep, showToast, dismissToast, scrollTo, refresh (safe no-op).

## Universal data interaction

\`\`\`json
{"interaction":{"enabled":true,"trigger":"auto","internalMode":"highlight","internalScope":"self","externalMode":"auto","selectionMode":"replace","multiSelect":true,"showSelector":false,"clearOnSecondClick":true}}
\`\`\`

## Overlay rules

Modal rendered at root level. Opening modal closes dropdowns/popovers. Targets must match overlay component IDs. Never invent overlay targets.

## First-class component preference

Prefer card over custom card HTML. Prefer listGroup over custom lists. Prefer dataGrid over manual detail HTML. Prefer modal/offcanvas over simulated drawers.

## Map rules

Generate stable Power BI spatial maps by default. Never invent ArcGIS service URLs, layer IDs, or tokens. ArcGIS REST layered schema is developer preview.

## Table rules

Tabulator is not bundled. Use enhanced native table properties: density, striped, hover, showRowCount, pageSizeOptions, rowActions, emptyState.

## Security

No JavaScript, eval, new Function, event handlers, scripts, iframes. No tokens or credentials. No invented overlay targets. No invented ArcGIS resources.

## Design standard

Compact enterprise spacing, restrained colors, strong hierarchy, responsive spans. Use theme tokens. Prefer styles.globalCss for visual-wide design.

## Compatibility

Legacy properties accepted: internal, external, selectable, selectionMode, button action/actionValue, engine:"tabulator", legacy drawer/filterDrawer, legacy stepper, legacy map settings/style/popup.

## Common mistakes

Inventing field keys, using display names as references, omitting ids, comments in JSON, spacious toy styling, full app shell for small tiles, custom HTML where first-class components exist, inventing ArcGIS URLs, tokens/credentials, forgetting interaction objects, deprecated properties.`;
