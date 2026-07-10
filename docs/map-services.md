# Map services

HyperPBI renders Power BI spatial data and a practical subset of public ArcGIS REST services with Leaflet. It does not bundle the ArcGIS JavaScript SDK.

## Runtime support

| Capability | Status |
|---|---|
| Power BI latitude/longitude, X/Y, WKT, GeoJSON, cached addresses | Supported |
| Public FeatureServer/MapServer feature layers | Supported |
| Power BI-to-service geometry joins | Supported |
| Full-layer and viewport feature queries | Supported |
| Simple, unique-value, class-break, continuous-color, proportional-size, cluster rendering | Supported |
| Opt-in ArcGIS service renderer and service labels | Supported |
| OSM, custom HTTPS, and ArcGIS tile basemaps | Supported in Maps packages |
| Multiple ArcGIS tile overlays | Supported |
| Basic ArcGIS dynamic MapServer image overlays | Supported |
| Labels, tooltips, popups, safe popup actions | Supported |
| Power BI and map-local selection | Supported |
| Layer visibility, opacity, labels, order, diagnostics, legend | Supported |
| Home, Zoom to Selection, Clear Selection, Layers, Legend, Location Search | Supported |

Map `view.center` is always `[latitude, longitude]`, matching the value passed to Leaflet. ArcGIS queries request output spatial reference 4326.

## Layer sources

- `powerbi`: geometry and attributes from bound Power BI rows.
- `arcgisFeature`: a public FeatureServer layer or query-capable MapServer layer. `mode: "reference"` loads service features; `mode: "join"` joins service geometry to a Power BI field.
- `arcgisTile`: an HTTPS cached MapServer tile overlay.
- `arcgisDynamic`: a basic MapServer `/export` image overlay refreshed for the current map view.

Configured renderers override service renderers. Service symbology is used only with `renderer.type: "service"` or `source.useServiceRenderer: true`. Configured labels override service labels; service labels require `source.useServiceLabels: true`. Tooltip configuration is independent of popup configuration and supports `template`, `fields`, `fieldSource`, and formatting.

Viewport-query layers requery after meaningful user view changes. Non-viewport feature layers and tile/dynamic shells do not. Requests, loading, errors, refresh intervals, and stale-response protection are isolated by layer ID, so a slow or failing layer does not replace successful siblings.

## Toolbar popovers and location search

Layers, Legend, and Location Search open as compact, mutually exclusive popovers anchored inside the map frame. `settings.showLegend` makes the legend feature available; it does not permanently open it. Use `layerPanel.defaultOpen` or `legend.defaultOpen` for the initial popover. Viewer opacity is entered as `0` through `100` percent and stored as `0` through `1`. Location Search and Zoom to Selection are separate toolbar actions.

Location Search uses the geocoder selected in Runtime Config. Nominatim remains the default free provider in the Maps package; ArcGIS and compatible custom HTTPS endpoints are also supported. Search sends a request only after the user presses Enter or clicks Search—there is no automatic geocoding or autocomplete. The Maps package, Power BI WebAccess permission, an enabled valid provider, and explicit privacy acknowledgment are all required. The Core package never performs external geocoding and shows an availability reason instead. Search result markers are nonselectable and never enter Power BI selection state.

A custom geocoder may return one object, an array, or `{ "results": [...] }`. Each result uses `latitude`/`longitude` (or `lat`/`lon`), optional `label`, and optional GeoJSON-order `bounds: [west, south, east, north]`. Existing single-result custom endpoints continue to work through `geocode(...)` fallback behavior.

## Controls and diagnostics

The toolbar can expose Home, Layers, Legend, Location Search, Zoom to Selection, and Clear Selection. Layer-panel state supports visibility, opacity, label visibility, viewer order, Reset, and expandable diagnostics. Diagnostics include source type/URL, feature and request counts, OID field, strategy, cache use, join field, match counts, warnings, and errors.

## Packages and hosts

```bash
npm run package:core
HYPERPBI_ALLOW_ALL_MAP_HOSTS=true npm run package:maps
HYPERPBI_ALLOW_ALL_MAP_HOSTS=false HYPERPBI_MAP_HOSTS="https://*.houstontx.gov,https://example.com" npm run package:maps
npm run package:verify
```

- Core has no `WebAccess` privilege. Power BI geometry remains available; external ArcGIS layers show package diagnostics.
- Broad Maps has `https://*` WebAccess but still enforces HTTPS, no embedded credentials, and the runtime host policy.
- Restricted Maps contains only built-in OSM/ArcGIS hosts plus normalized `HYPERPBI_MAP_HOSTS` entries.
- Host patterns cannot contain HTTP, credentials, paths, queries, or hashes. Only exact HTTPS hosts and leading subdomain wildcards are valid in restricted mode.

`package:verify` opens the actual PBIVIZ ZIP archives and reads the packaged capabilities payload for Core, broad Maps, and restricted Maps.

## Public ArcGIS URL examples

```text
https://host.example/arcgis/rest/services/folder/service/FeatureServer/0
https://host.example/arcgis/rest/services/folder/service/MapServer/9
https://host.example/arcgis/rest/services/folder/service/MapServer
```

Never put tokens or credentials in dashboard JSON. HyperPBI sends external requests with credentials omitted and no referrer.

## Intentional limitations

The practical runtime does not support secured-service authentication, editing, 3D, relationship queries, network tracing, non-4326 output, advanced label collision, density grids, or fullscreen workarounds. `hideOverlaps` produces an explicit warning and renders labels without collision suppression. Large joins remain subject to the configured feature limit and the source service's query capabilities.
