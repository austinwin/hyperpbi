# Map services

HyperPBI's `map` component combines bound Power BI locations with optional public HTTPS ArcGIS/provider services. Core and Maps PBIVIZ profiles expose different network privileges.

## Power BI binding and precedence

Bindings can be supplied per Power BI role or overridden in a layer's `source.bindings`. A valid override wins; otherwise the first field bound to the corresponding role is used. Latitude/longitude also fall back to fields normalized as latitude/longitude types.

Location mode precedence is exact:

1. Geometry
2. Latitude + longitude
3. X + Y
4. Address
5. None

Geometry is parsed from supported GeoJSON/WKT-like input by the geometry parser. Latitude/longitude and X/Y must be finite and within ±90/±180; coordinate pairs render points. A non-point Map Type on coordinate pairs warns and still renders a point—bind Geometry for lines/polygons.

Address combines address, city, state, and ZIP. Normalization never sends address data automatically. It uses a cached geocode if one exists; otherwise the row remains unresolved until a user-triggered geocoder action.

Power BI roles also supply layer, type, color, size, tooltip, and detail fields. A layer binding groups rows by its value.

## Conservative coordinate inference

HyperPBI does not guess latitude/longitude from arbitrary numeric fields. Use explicit Map Latitude/Longitude roles or verified overrides. Center order is `[latitude, longitude]`.

The Field Manifest distinguishes a summarized query wrapper from a true model measure. If latitude/longitude has `isImplicitAggregation` and a query aggregation, the map warns to set the Power BI field to **Don't summarize**. Average/sum coordinates collapse rows and can create incorrect locations even though the underlying origin is a model column.

## Declarative map model

`map` accepts:

- `view`: center, zoom/min/max, fit mode, padding, view preservation
- `basemap`
- `layers`
- search and legend
- layer panel
- toolbar
- height and normal interaction

Fit modes are `data`, `allVisibleLayers`, `firstLayer`, and `none`.

Basemap types are `none`, `osm`, `customTile`, and `arcgisTile`. OSM/custom/ArcGIS tiles require Maps WebAccess and runtime provider/host policy; Core uses no external tiles.

## Layer sources

| Source | Implemented scope |
|---|---|
| `powerbi` | Bound geometry/coordinates/address cache, renderer, labels, popup/tooltip, selection |
| `arcgisFeature` | Public FeatureServer/MapServer layer metadata/query, reference or Power BI join mode |
| `arcgisTile` | Public raster tile overlay |
| `arcgisDynamic` | Basic public dynamic map image requests |

Every layer requires `id`, `name`, and `source`; it may set visibility, opacity/order, join, renderer, labels, popup, tooltip, visibility range/condition, performance, interaction, and legend.

### ArcGIS feature layers

Feature sources accept URL, optional layer ID, service renderer/label flags, definition expression, out fields, `reference|join` mode, and refresh interval.

The query system:

- inspects public service/layer metadata
- requests only needed fields plus object/join fields
- batches join keys in groups of 200
- batches object IDs in groups of 500
- uses service max-record count capped to 2,000 for a reference/viewport request
- requests output spatial reference 4326
- parses point/multipoint/polyline/polygon geometry
- records request/feature/join diagnostics

Viewport mode is a practical one-request planning mode. The current planner does not send a full envelope geometry filter; documentation must not claim complete spatial-query optimization.

### Power BI joins

Joins map one Power BI field to one service field. Normalization steps are `trim`, `upper`, `lower`, `removeNonAlphanumeric`, and `numberString`. Key type is auto/string/number. Cardinality is one-to-one or many-to-one.

Duplicate policies, unmatched diagnostics, and join aggregations are configurable. Aggregations are `count`, `distinctCount`, `sum`, `avg`, `min`, `max`, `first`, and `last`. A join does not create a Power BI semantic-model relationship.

## Renderers and labels

Resolver support includes service, simple, unique value, class breaks, continuous color, proportional size, heatmap, cluster, and density-grid definitions. Class breaks support manual/equal interval/quantile; `naturalBreaks` currently falls back to quantile. Density-grid runtime output is basic and should not be presented as an advanced spatial-analysis engine.

Symbols support circle/square/diamond/triangle/line/fill and safe paint/size/outline values. Renderer fields can come from Power BI, service, or joined values.

Labels support field/template, source, placement, zoom range, typography/halo/background, collision policy (`none|hideOverlaps`), and maximum count. Label collision is basic; advanced cartographic placement is not implemented.

Popups/tooltips use declared safe fields/templates. Popup actions are UI actions. HTML is sanitized.

## Viewer controls

Implemented controls include layer visibility/order/opacity/labels, legend, search, Home, Clear Selection, and Zoom to Selection. Toolbar buttons can be individually enabled. Search result markers are not Power BI selection identities.

## Search and geocoder policy

The default geocoder is `none` and disabled. Tile and geocoder WebAccess decisions are independent, so denial or disablement of one does not disable the other. Public OSMF Nominatim requires deliberate expert configuration, keeps autocomplete disabled, and is not a production-reliability guarantee. A single search result is applied automatically; multiple results apply the first unless `autoSelectFirst` is false. Clear resets the query, results, status, selection, and marker.

Providers are Runtime Config, not dashboard credentials. Geocoding requires:

- a Maps build
- available Power BI WebAccess
- an enabled valid provider
- explicit privacy acknowledgment
- user-triggered search

Autocomplete is rejected. Nominatim is limited to one request per second, cancellable, cached when configured, and returns a bounded result count. ArcGIS/custom providers must use configured HTTPS endpoints allowed by the package. Core reports why geocoding is unavailable.

## Interactions

Map features can use universal internal highlight/filter and external selection/filter. External selection maps feature rows through Power BI identities or logical-dataset lineage. External filtering requires a real model-column target. A joined service field, ArcGIS attribute, derived field, or dataset metric cannot directly filter the Power BI semantic model.

## Packaging profiles

```powershell
npm run package:core
npm run package:maps
```

- **Core:** no `WebAccess` privilege; bound Power BI geometry remains available.
- **Maps broad (default):** `https://*` when `HYPERPBI_ALLOW_ALL_MAP_HOSTS` is not `false`.
- **Maps restricted:** built-in OSM/Nominatim/ArcGIS hosts, default ArcGIS wildcards, plus comma-separated `HYPERPBI_MAP_HOSTS` when `HYPERPBI_ALLOW_ALL_MAP_HOSTS=false`.

Host patterns must be HTTPS, may use only a leading subdomain wildcard, and cannot contain credentials, path, query, or hash. Runtime ArcGIS policy always rejects non-HTTPS and embedded credentials even in broad mode.

Packaging labels outputs `*-core.pbiviz`, `*-maps-broad.pbiviz`, or `*-maps-restricted.pbiviz`, plus a `*-maps.pbiviz` compatibility copy. The base name is packager-derived.

## Explicitly unsupported

- secured/token/OAuth ArcGIS services or credentials in JSON
- feature editing
- 3D scenes
- relationship queries, network tracing, geoprocessing
- arbitrary SQL/network dataset sources
- non-4326 output promises
- complete advanced label collision/cartography
- automatic/bulk address transmission
- treating ArcGIS/join/dataset metrics as Power BI model columns
- guaranteed full viewport-envelope server filtering

Use pre-geocoded coordinates and organizationally approved public services for predictable enterprise deployment.
