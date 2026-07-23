# Analytical maps

HyperPBI maps are declarative Leaflet visuals for analytics, dashboards, operational mapping,
Power BI interaction, and AI-authored HyperPBI 2.0 specifications. A map is a component containing
one or more ordered layers. Every layer has one source, one renderer, optional labels/details,
optional interaction policy, and an independent legend. Viewer state—selection, legend filters,
quick filters, visibility, opacity, and live viewport—is kept outside the authored JSON.

The implementation deliberately does not expose arbitrary Leaflet APIs. Specifications cannot
execute JavaScript, create unrestricted HTML markers, embed credentials, or bypass provider and
host policy.

## Component model

```json
{
  "type": "map",
  "id": "operations_map",
  "height": 480,
  "view": { "fitMode": "data", "fitPadding": 0.08 },
  "basemap": { "type": "osm" },
  "legend": { "enabled": true, "defaultOpen": true, "search": true },
  "layers": [],
  "quickFilters": [],
  "tools": {},
  "toolbar": { "visible": true, "position": "topleft" }
}
```

`layers` may use `order`, `visible`, `opacity`, `groupId`, and `dataset`. To keep overlapping
features targetable, raster/heat layers draw below polygons, polygons below lines, and lines below
points; authored/viewer order remains authoritative within each geometry band. `layerGroups`
provide authored visibility/opacity/order for related layers. `bookmarks` contain a stable ID,
label, center, and zoom. The Home tool returns to the authored or fitted home extent; normal
panning does not mutate JSON.

## Data sources

| Source | Configuration | Runtime behavior |
|---|---|---|
| `powerbi` | `bindings.latitude`/`longitude` or a bound geometry field | Retains model row lineage and selection identities |
| `geoJson` | inline `data` or allowed HTTPS `url`, optional `idField` and refresh | Resolves safe Feature, FeatureCollection, or geometry JSON |
| `xyz` | URL template, attribution, zoom bounds, optional subdomains | Read-only generic raster tile overlay |
| `arcgisFeature` | FeatureServer/MapServer URL and `layerId` | Reference/query or declarative join, viewport-aware requests |
| `arcgisTile` | cached MapServer URL | Display-only raster tile overlay |
| `arcgisDynamic` | MapServer URL and optional layer selection | Dynamic export image with optional temporary click identify |

Power BI fields use the normalized field key or prepared AI alias. A layer can name a logical
dataset; lineage is preserved where the dataset operation can retain contributing source rows.
`fieldSource` is always explicit when ambiguity matters: `powerbi`, `service`, or `joined`.
Namespaces never fall through to another namespace.

Remote GeoJSON, XYZ, and ArcGIS URLs pass Runtime Configuration provider/security checks and host
access. Remote GeoJSON must be JSON and is bounded by the normal map feature limits.

## Renderers

Implemented renderer types are:

- `service` for an ArcGIS-authored renderer;
- `simple`, `icon`, `line`, and `polygon` for one authored symbol;
- `uniqueValue` and `classBreaks` for categorical or classified values;
- `continuousColor` and `proportionalSize` for quantitative encodings;
- `cluster` for selectable point aggregation;
- `heatmap` for a real weighted canvas intensity raster; and
- `densityGrid` for count, sum, or average in screen-space cells.

Class breaks support manual, equal-interval, and quantile methods. Natural breaks are rejected.
Computed domains and legend groups are cached by the resolved layer signature.

## Rich symbols

Point symbols support circle, square, diamond, triangle, and controlled icon markers. Line and
polygon symbols support weight, opacity, dash styles, line caps/joins, fill, outline, and a partial
set of fill-pattern presentations.

An icon is one of:

```json
{ "type": "builtIn", "name": "location", "size": [30, 30], "anchor": [15, 26] }
```

```json
{ "type": "svg", "svg": "<svg viewBox=\"0 0 24 24\"><path d=\"M12 2L2 22h20z\"/></svg>" }
```

```json
{ "type": "image", "url": "https://cdn.example.com/approved/sensor.png" }
```

SVG is sanitized to the map icon allowlist. Image URLs must be HTTPS or relative; the browser and
Power BI WebAccess capability still govern whether an external image can load. Text and badges are
escaped. JavaScript URLs, event handlers, foreign objects, unrestricted HTML, and executable marker
callbacks are not accepted.

`iconField` plus `iconMap` maps categories to safe icon definitions. `rotationField`, `sizeField`,
and `colorField` provide data-driven rotation, size, and categorical color. `markerTextField`,
`badgeField`, `showValue`, `anchor`, and `offset` complete the controlled marker layout.

Every symbol can define `selectedStyle`, `hoverStyle`, `externalHighlightStyle`, and
`dimmedOpacity`. The retained runtime patches style/icon state without rebuilding geometry.

## Interactive legends

Each visible analytical layer can own a legend. Types include `categorical`, `classBreaks`,
`continuousColor`, `proportionalSize`, `icon`, `line`, `polygon`, `heatIntensity`, and `combined`;
`auto` derives the presentation from the renderer.

```json
{
  "visible": true,
  "title": "Asset status",
  "interactive": true,
  "selectionMode": "multiple",
  "clickAction": "filterLayer",
  "hoverAction": "highlight",
  "showCounts": true,
  "showPercentages": true,
  "valueField": "value",
  "valueFieldSource": "powerbi",
  "valueAggregation": "sum",
  "order": ["Active", "Warning", "Offline"],
  "labels": { "Active": "Operating" },
  "search": true,
  "maxHeight": 280,
  "externalInteraction": true,
  "internalInteraction": true
}
```

Legend entries support single select, authored multi-select, Ctrl/Cmd multi-select, toggle/clear,
isolate, select all, clear all, hover highlight, authored ordering/labels, counts, percentages, and
aggregates. Long legends are searchable and scrollable. Each layer remains a separate collapsible
legend group.

`clickAction` is `filterLayer`, `filterMap`, `highlight`, or `select`. A select action uses the same
analytical selection controller as map features and spatial tools. `internalInteraction: false`
suppresses HyperPBI linked interaction for that legend selection; `externalInteraction: false`
suppresses Power BI submission. Filtering actions update map-local filter state.

## Selection and visual states

The shared controller accepts `replace`, `add`, `remove`, `toggle`, and `clear`. It is used by
feature clicks, legends, rectangle/lasso/circle tools, Select visible, Invert, quick-filter
reconciliation, external Power BI selection, and linked HyperPBI component state.

Resolved features have one visible analytical state:

- normal;
- hovered;
- selected;
- externally highlighted;
- dimmed when another feature is emphasized; or
- filtered out and absent from the analytical layer.

Features, legend entries, detail popups, selected feature count, and selected contributing-row count
derive from the same canonical keys. A selected feature remains resolvable for details even when a
new local filter hides it.

```json
{
  "tools": {
    "rectangleSelection": { "enabled": true, "selectionMode": "replace" },
    "lassoSelection": { "enabled": true, "selectionMode": "add", "minimumPoints": 3 },
    "circleSelection": { "enabled": true, "selectionMode": "toggle" },
    "selection": {
      "maxSelectionCount": 5000,
      "powerBiIdentityLimit": 1000,
      "identityLimitBehavior": "localOnly"
    }
  }
}
```

Shift adds, Ctrl/Cmd toggles, and Alt subtracts during spatial selection. Circle selection uses a
geodesic radius polygon. The compact selection control also provides Select visible, Invert, Zoom
to selection, and Clear. `maxSelectionCount` truncates deterministically with a viewer warning.
When the Power BI identity limit is exceeded, `localOnly` preserves the complete local selection
without submitting excess identities; `truncate` submits only the bounded prefix and reports it.

## Power BI and HyperPBI interaction

Map layers inherit the component `interaction` unless they author a layer policy. Internal modes are
`none`, `highlight`, and `filter`. External modes are `none`, `auto`, `selection`, and `filter`.
Exact external selection requires retained Power BI identities. External filtering requires an
eligible model-column target; true measures and dataset-derived values are not basic host filters.

External Power BI selection and other HyperPBI components can emphasize map rows. The map resolves
target/scope configuration before styling them as externally highlighted and dimming unrelated
features. Map-originated selections publish the exact next selected row union, including cases
where multiple map features share one row identity.

## Quick filters

Quick filters are deliberately smaller than the Power BI filter pane:

```json
[
  { "id": "status", "label": "Status", "type": "categorical", "field": "category", "multiSelect": true },
  { "id": "value", "label": "Value", "type": "numericRange", "field": "value" },
  { "id": "date", "label": "Event date", "type": "dateRange", "field": "event_date" },
  { "id": "name", "label": "Name", "type": "text", "field": "name", "operator": "contains" },
  { "id": "ready", "label": "Readiness", "type": "null", "field": "nullable" },
  { "id": "top", "label": "Top assets", "type": "topN", "field": "id", "count": 10, "valueField": "value" }
]
```

Filters may set `layerId` and `fieldSource`. The filter panel supports null/not-null, Clear filters,
and Filter to selected. Filters combine with authored layer filters and legend filtering, then feed
the same resolved analytical layer used by symbols, heatmaps, counts, and spatial selection.

## Real heatmaps

The heatmap renderer uses a Leaflet-compatible retained canvas layer. Each point contributes a
radial alpha kernel that is colorized from the authored gradient. `weightField`, `fieldSource`,
`radius`, `blur`, `minOpacity`, `maxIntensity`, `gradient`, `minZoom`, and `maxZoom` are supported.
`normalization: "global"` uses the resolved layer domain; `"viewport"` normalizes the current
visible points.

Heat data is replaced in place after authored filters, quick filters, legend filters, or external
interaction updates. Pixels have `pointer-events: none` and never become selectable features.
`interactivePoints: true` retains a lightweight transparent source-point layer for click/spatial
hit testing.

## Labels, popups, and details

Labels support a field/source, placement, zoom range, text/halo presentation, a bounded maximum, and
`hideOverlaps` collision handling. Tooltips and popups contain structured field definitions and
safe templates. Feature details use the same active/selected keys as the map; responsive `auto`
mode uses an anchored panel when space allows and a sheet/panel on compact maps.

Dynamic MapServer identify results are temporary read-only details. They never enter persistent map
selection, joins, quick filters, or Power BI identity submission.

## Basic tools

The responsive toolbar supports Home, Zoom in/out, search, layer visibility/opacity, legend,
bookmarks, the compact selection control, quick filters, and the selected feature/row count.
`position` is `topleft`, `topright`, `bottomleft`, or `bottomright`.

`tools.scaleBar` enables metric and/or imperial distance at the lower left/right.
`tools.coordinateDisplay` shows the live pointer coordinate with bounded precision. Map Studio
groups major configuration into layer/source, renderer/symbol, legend, interaction, filters/tools,
and advanced JSON controls.

## Performance

- Prefer ArcGIS `viewportQuery` for large services.
- Use cluster rendering for dense selectable points and heatmap for intensity.
- Heat and dense operational layers use canvas; rich DOM icon markers are for bounded datasets.
- Selection/style changes patch retained Leaflet layers instead of rebuilding geometry.
- Renderer domains, legend groups, service metadata, and query results are signature-cached.
- Expensive viewport/source updates are debounced and stale requests are aborted/versioned.
- Per-layer feature limits and the map-wide feature budget emit diagnostics before a dashboard
  becomes unresponsive.
- Leaflet event listeners, panes, timers, abort controllers, retained layers, and heat canvases are
  removed during definition replacement and component disposal.

## Security

- No arbitrary JavaScript, Leaflet callbacks, unrestricted marker HTML, or credentials in JSON.
- SVG icons and popup templates are sanitized; marker text and badges are escaped.
- Remote images must be HTTPS or relative.
- ArcGIS, GeoJSON, XYZ, basemap, geocoder, and image access follows Runtime Configuration and
  Power BI WebAccess policy.
- Service diagnostics show sanitized origins rather than leaking complete private URLs.

## Examples and authoring

The [map example manifest](../examples/map/manifest.json) drives the Playground map gallery at
`/components/map`. It contains 29 focused groups, deterministic data, expected behavior, limitations,
and Power BI notes. Use **Copy spec** to copy the exact JSON shown beside the running preview.

Map Studio configures the major source, renderer, icon, legend, heatmap, interaction, selection,
filter, and tool settings. Advanced JSON remains available for complete expert authoring.

## Known limitations

- Secured/token/OAuth services and credentials embedded in JSON are unsupported.
- Natural breaks, advanced cartographic labeling, feature editing, geoprocessing, 3D, time
  animation, swipe, print layouts, and selected-feature export are outside this component.
- Polygon fill patterns are partial and intentionally simpler than desktop GIS symbology.
- Density-grid cells and heat pixels are summaries, not selectable source geometries.
- ArcGIS Tile pixels are display-only; Dynamic identify is read-only.
- Quick filters are map-local analytical controls, not a replacement for report filters.

See [map services](map-services.md), [interactions](interactions.md), the
[HyperPBI specification reference](hyperpbi-spec-reference.md), and the machine-readable
[`mapCapabilityRegistry.ts`](../src/maps/mapCapabilityRegistry.ts).
