# HyperPBI

HyperPBI is a Deneb-inspired Power BI custom visual that compiles AI-generated JSON into complete enterprise dashboards. It renders layouts, controls, metrics, tables, ECharts charts, Leaflet maps, custom components, sanitized HTML/CSS, safe calculations, and Power BI selections without executing user JavaScript.

The repository includes a responsive, dependency-free [product landing page](index.html) ready for GitHub Pages. It documents the end-user workflow, Studio interface, component catalog, security model, provider modes, global styling, and build commands.
<img width="1354" height="688" alt="image" src="https://github.com/user-attachments/assets/5a4c707a-f0a8-47a5-8365-f358a57fb000" />

<img width="1359" height="662" alt="image" src="https://github.com/user-attachments/assets/12e5d4bd-dfa2-4d11-bb35-b223de4d2da5" />

<img width="1359" height="754" alt="image" src="https://github.com/user-attachments/assets/a260cf09-ff0a-4439-82b6-fdf8c6b159e9" />


## Workflow

1. Add HyperPBI and drag the required columns/measures into the single **Values** field well.
2. Select the visual, open its top-right **…** menu, and select **Edit**. Power BI opens HyperPBI Designer in focus mode.
3. Describe the dashboard. HyperPBI combines the complete engine skill, current fields, visual size, data privacy choice, and your goal into one prompt.
4. Copy the prompt to ChatGPT, DeepSeek, or Copilot.
5. Paste the AI response into Studio. HyperPBI extracts and validates the JSON and can produce a repair prompt.
6. Select **Preview dashboard**, inspect the result, then **Save & return**.

The specification and runtime config are saved with Power BI persistent visual properties. `localStorage` is not primary storage.

## Studio

The default **HyperPBI Builder** is a dense guided workflow for normal Power BI users. It asks for dashboard goal, audience, layout pattern, components, and a professional style preset; then provides **Copy AI Prompt**, a large response box, **Validate & Preview**, repair guidance, and a Save action that becomes prominent only after a successful preview. Raw JSON is never required in Simple mode.

**Advanced** remains optional and exposes JSON, Runtime Config, AI Skill, Calculations, Map Services, Field Mapping, interaction diagnostics, formatting, validation, and raw output panels.

The designer/preview divider and bottom diagnostics panel are resizable. Their size, open state, and Simple/Advanced preference are stored in Power BI visual properties. Bottom output is selectable and has a **Copy output** action.

**Skill** generates copyable Markdown containing the full HyperPBI engine contract plus the current field dictionary. **Help / Docs** is also plain copyable/downloadable Markdown, so either document can be pasted directly into ChatGPT, DeepSeek, Copilot, or internal AI tooling.

Diagnostics: **Data**, **Fields**, **Logs**, **Issues**, **Map Services**, **Geocode Results**, and **Interactions**. The Fields panel exposes normalized key, display name, source table/column, query lineage, inferred type, format, roles, sample values, and a copy action.

Field keys are lowercase, stable, and table-qualified when Power BI query metadata is available: `WorkOrders.Status` → `workorders_status`, while `Projects.Status` → `projects_status`. Numeric suffixes are only a final collision fallback. Visible labels continue to use friendly display names.

## AI and privacy

AI Prompt supports field-only (default), sample, masked sample, summary, and type-only modes; a maximum of 50 sample rows; selected fields; dashboard goals; audience; components; maps; calculations; controls; and external interactions. Always review prompts before sending them to an AI service.

Imported output must be JSON only at runtime. HyperPBI never executes functions, `eval`, `new Function`, event handlers, or other user JavaScript. See [AI authoring](docs/ai-authoring.md) and [ChatGPT guideline](docs/chatgpt-guideline.md).

## Specifications, custom components, and calculations

Dashboard Specification defines UI and component behavior. Runtime Config defines field semantics, map providers, interactions, security, and renderer options. The Runtime Config tab is GUI-first; its Advanced JSON panel is optional and changes nothing until **Apply JSON** is selected.

Every component supports `id`, `span`, `className`, sanitized `style`, scoped `css`, safe `slots`, `props`, `data`, `visibility`, and schema-defined interactions. The `custom` type adds sanitized HTML, row-aware repeat wrappers, distinct/sorted repeats, props, metrics, state, selected classes, and typed safe actions. See [spec reference](docs/hyperpbi-spec-reference.md) and [custom components](docs/custom-components.md).

### Global application styling

Use `styles.globalCss` to define a visual-wide design system and `styles.components` for reusable defaults. CSS remains parsed and confined to the HyperPBI visual. Runtime Config defaults to certification-oriented `security.cssMode: "scoped"` and `htmlMode: "sanitized"`; trusted-author modes broaden HTML/CSS for controlled internal dashboards without enabling scripts or event handlers.

```json
{
  "styles": {
    "globalCss": ".hp-card { border: 1px solid var(--hp-border); box-shadow: none; }",
    "components": {
      "*": { "style": { "minWidth": 0 } },
      "kpi": {
        "className": "app-kpi",
        "css": ".hp-metric-value { font-size: 22px; }"
      },
      "#critical_kpi": {
        "css": ".hp-metric { border-left: 4px solid var(--hp-danger); }"
      }
    }
  }
}
```

Keys under `styles.components` may be `*`, a component type, or `#component_id`. Local component styles override defaults. Existing root `css` remains supported.

The calculation DSL provides derived fields and metrics using validated JSON operators. Calculated values work in metrics, charts, tables, maps, filters, and templates. See [calculation DSL](docs/calculations-dsl.md).

### Professional presets and recipes

The Builder and generated prompt share six reusable presets: **Enterprise Light**, **Bright Modern**, **Futuristic Light**, **Dark Ops Center**, **Dense Compact**, and **Map Command Center**. Each defines theme tokens plus card, KPI, table, chart, control, selected-state, spacing, and density guidance.

The prompt includes executive overview, operations, map-first, detail explorer, KPI monitoring, table-heavy, custom slicer, bright enterprise, futuristic light, and dense 600×500 recipes. Generated dashboards are instructed to keep compact spacing, strong hierarchy, restrained colors, bounded tables, responsive spans, and no overflow-heavy fixed widths.

### Advanced charts and high-value components

`advancedChart` accepts JSON-only ECharts 6 options. HyperPBI registers every bundled declarative series (including candlestick, chord, custom, effectScatter, lines, map, parallel, pictorialBar, themeRiver, and tree), coordinate systems, dataset/transforms, dataZoom/brush, mark components, toolbox, graphic, aria, Canvas, and SVG rendering. Safe string formatter templates work; JavaScript callbacks such as `renderItem`, event-handler keys, external URLs, and executable markup remain blocked. `initOptions`, `setOption`, and `maxDataRows` expose renderer/update/performance controls without executing code.

High-value application components include `drawer`, `filterDrawer`, `segmentedControl`, `timeline`, `matrix`, `smallMultiples`, and an improved selected-row `detailPanel`. Existing component JSON remains supported.

## Maps and provider builds

Location priority is Geometry → Latitude/Longitude → X/Y → Address. GeoJSON and WKT point/line/polygon are supported.

- `npm run package:core`: no WebAccess, neutral map background, no external geocoder; certification-oriented posture.
- `npm run package:maps`: WebAccess for OpenStreetMap tiles, Nominatim, and declared ArcGIS geocoding hosts; external-provider posture and not represented as certification-safe.

OSM attribution is displayed by Leaflet. Nominatim is user-triggered only, sequential, capped at one request/second, cached by normalized address, cancellable, and has no autocomplete. Address data is never silently sent. For bulk production geocoding, pre-geocode in Power Query/data model or use an approved enterprise provider. See [map services](docs/map-services.md).

## Power BI interactions

HyperPBI uses one universal `interaction` policy and engine for every component. Internal `none`/`highlight`/`filter` behavior and external Power BI `none`/`auto`/`selection`/`filter` behavior are independent, with `self`/`others`/`all` internal scope. Auto filters controls/slicers and selects exact identities for rows, points, map features, and items. Runtime Config defaults to `auto` and is only a global external gate/fallback; component policy wins. See [interactions](docs/interactions.md).

HyperPBI requests 30,000-row Power BI windows and uses sequential aggregation-mode `fetchMoreData(true)` while `metadata.segment` indicates more data. Loaded rows and selection identities accumulate, while tables stay paginated and cap rendered rows. Power BI limits still apply: 30,000 rows per window, 1,048,576 total data-view rows, and 100 MB aggregation memory.

Table row clicks are enabled by `interaction.enabled`; `showSelector` only controls visible selection UI. Use `internalMode:"highlight"` to retain and style rows, or `internalMode:"none"` to leave the source unchanged. Legacy `internal`, `external`, `selectable`, and table `selectionMode` remain normalized for saved dashboards but are deprecated for new specifications.

## Security

HTML and popup templates are sanitized with DOMPurify. CSS is parsed, allowlisted, and scoped to the visual or component root. Scripts, iframes, object/embed, inline handlers, CSS imports, external CSS URLs, fixed positioning, and abusive z-index values are blocked. Runtime dependencies are bundled; there are no CDN scripts. See [security](docs/security.md).

## Development and Power BI build commands

Requirements: Node.js, npm, and Power BI Visual Tools (`pbiviz`). Dependencies are installed locally, so global `pbiviz` installation is optional when using the npm scripts.

```powershell
npm install
npm run typecheck
npm test
npm run lint
```

Run the local Power BI development server:

```powershell
npm start
```

Build the default core/offline `.pbiviz`:

```powershell
npm run package
# equivalent explicit command
npm run package:core
```

Build the map-provider `.pbiviz` with OSM/Nominatim/ArcGIS WebAccess declarations:

```powershell
npm run package:maps
```

Run the certification-oriented audit/fix profile:

```powershell
npm run certification:audit
```

Generated files are under `dist/`:

- `*-core.pbiviz`: no WebAccess privilege; external request call sites are removed by the SDK certification-fix pass.
- `*-maps.pbiviz`: OSM/Nominatim/declared ArcGIS WebAccess enabled; intended for approved organizational use and not claimed as certification-safe.
- the unsuffixed `.pbiviz` is the most recently built profile; use the suffixed files to avoid ambiguity.

Import a package in Power BI Desktop with **Visualizations → … → Import a visual from a file**, select the required `.pbiviz`, add the visual, and place fields in **Values**. For development-server use, enable the Power BI developer visual workflow and run `npm start`.

The profile script temporarily adjusts `capabilities.json` and the compile-time provider flag, runs `pbiviz package`, creates a suffixed artifact, and restores source files even when packaging fails.

## Known limitations

- Power BI host row and aggregation-memory limits still bound total loaded data; table display remains independently capped and paginated.
- Non-EPSG:4326 X/Y needs a projection adapter.
- Native enterprise tables intentionally expose a bounded schema rather than arbitrary Tabulator options.
- Nominatim is unsuitable for bulk production geocoding.
- The map-enabled package requires organizational WebAccess approval and is not claimed to be certification-safe.
- The core package uses the SDK certification-fix transform to remove provider request call sites; test both profiles in the target Power BI tenant before distribution.

Start with [user guide](docs/user-guide.md), [AI skill](docs/hyperpbi-ai-skill.md), [examples/specs](examples/specs), and [examples/prompts](examples/prompts).
