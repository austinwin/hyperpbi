# Map services and Map Studio

HyperPBI is a declarative analytical Web GIS builder for Power BI. It is not a feature-editing, 3D, geoprocessing, network-tracing, or complete Esri Web AppBuilder/Experience Builder replacement. The saved HyperPBI JSON specification is the only canonical map authoring contract.

## Values-only Power BI contract

Core and Maps expose the same single Power BI field well:

```json
{"displayName":"Values","name":"values","kind":"GroupingOrMeasure"}
```

Put every map field in **Values**. Location, geometry, styling, labels, popup, tooltip, interaction, and join fields are selected dynamically through the Field Manifest, logical datasets, and each layer's JSON. HyperPBI does not use fixed map field buckets.

A Power BI layer resolves bindings in this order:

1. explicit `layer.source.bindings`
2. Map Studio-generated bindings, which are the same canonical property
3. legacy Runtime Config/component bindings only when a legacy map has no explicit layers
4. semantic field type
5. conservative exact-name inference
6. unresolved with a structured diagnostic

Explicit layers never inherit one global coordinate pair. A missing or misspelled explicit binding remains unresolved rather than falling through to unrelated data.

Location precedence within one resolved layer is geometry, latitude/longitude, X/Y, address, then none. Coordinates must be finite numbers with latitude in −90…90 and longitude in −180…180. Diagnostics report current dataset rows, valid features, incomplete pairs, nonnumeric pairs, out-of-range pairs, geometry parse failures, and filtered rows. They do not infer a semantic-model row count.

Power BI query aggregation is separate from the model's default summarization. When the current visual query summarizes row-level coordinates, keep the fields in Values and set those field instances to **Don't summarize**.

## One flattened Power BI data view

Power BI supplies a custom visual one flattened data view. Fields in Values may originate from different related model tables, but the Power BI visual query and semantic-model relationships determine row grain and combinations.

Logical datasets create filtered, derived, renamed, selected, grouped, distinct, sorted, or limited layer views over that received data. They do not issue independent semantic-model queries and do not create Power BI relationships.

An ArcGIS `reference` layer does not require a field in Values; a saved reference-only map continues to run with an empty data view. Leave Values empty when the map uses only service attributes. If fields from unrelated model tables are added, Power BI can reject the visual query with **Can't determine relationships between the fields** before HyperPBI runs. Create an unambiguous model relationship or bridge table for a real Power BI join; the visual cannot infer or bypass semantic-model relationships.

Every layer selects its effective dataset by:

1. `layer.dataset`
2. map component `dataset`
3. `powerbi`

The runtime resolves source bindings, renderer fields, labels, popup/tooltip fields, visibility conditions, filters, interactions, and the Power BI side of ArcGIS joins against that layer's effective schema and rows. Grouped rows retain arrays of contributing Power BI row indices and row identities for selection where Power BI supplied identities.

## Map demos

The current showcase specifications are intentionally map-first and use only compact CSV inputs:

| Demo | Specification | CSV data | Demonstrates |
|---|---|---|---|
| Map Feature Showcase | [`map-feature-showcase.json`](../examples/specs/map-feature-showcase.json) | [`map-feature-showcase.csv`](../examples/data/map-feature-showcase.csv) | Power BI latitude/longitude, unique status styling, one-click details, stable repeat click, multi-selection |
| Multiple Geometry Layers | [`map-multiple-geometries.json`](../examples/specs/map-multiple-geometries.json) | [`facilities`](../examples/data/map-multiple-geometries-facilities.csv), [`segments`](../examples/data/map-multiple-geometries-segments.csv), [`areas`](../examples/data/map-multiple-geometries-areas.csv) | Clickable points, lines, and polygons; layer visibility/order; duplicate raw IDs isolated by canonical feature keys |
| Selection and Feature Details | [`map-selection-details.json`](../examples/specs/map-selection-details.json) | [`map-selection-details.csv`](../examples/data/map-selection-details.csv) | Replace/toggle selection, predictable active details, close/Escape/background behavior, responsive auto details mode |
| ArcGIS Join Showcase | [`arcgis-map-join-showcase.json`](../examples/specs/arcgis-map-join-showcase.json) | [`Power BI rows`](../examples/data/arcgis-map-join-showcase.csv), [`deterministic service fixture`](../examples/data/arcgis-map-join-service-fixture.csv) | ArcGIS Feature join, joined rendering/details, match diagnostics, Power BI lineage selection, retained selection through refresh |
| ArcGIS Dynamic Identify Showcase | [`arcgis-dynamic-identify-showcase.json`](../examples/specs/arcgis-dynamic-identify-showcase.json) | None | Dynamic MapServer image display, temporary read-only identify, multiple-result choice, returned-geometry highlight |

The multiple-geometry source CSVs remain separate and narrow. Because Power BI gives a custom visual one flattened data view, a report author must append or otherwise model those rows into the visual's received table and bind the fields through Values; the specification's logical datasets then project the three layer schemas. The automated browser harness performs the same sparse-row union and renders the real Leaflet runtime.

The ArcGIS join specification uses the repository's existing public Houston service URL. The service-fixture CSV is clearly test-only: it captures the eight object IDs, join keys, and point geometries used by Playwright so browser verification is deterministic and does not depend on live service availability. The Power BI-side rows are fictional.

## Canonical layer example

```json
{
  "type": "map",
  "id": "operations_map",
  "view": {"fitMode":"allVisibleLayers","fitPadding":0.08},
  "layerGroups": [{"id":"operations","name":"Operations","visible":true}],
  "bookmarks": [{"id":"downtown","label":"Downtown","center":[29.76,-95.37],"zoom":13}],
  "layers": [
    {
      "id": "facilities",
      "name": "Facilities",
      "dataset": "activeFacilities",
      "groupId": "operations",
      "source": {"type":"powerbi","bindings":{"latitude":"facilityLatitude","longitude":"facilityLongitude"}},
      "renderer": {"type":"uniqueValue","field":"facilityStatus","fieldSource":"powerbi"},
      "labels": {"enabled":true,"field":"facilityName","fieldSource":"powerbi","maxLabels":300},
      "popup": {"enabled":true,"title":"{{facilityName}}","fields":[{"field":"facilityStatus","fieldSource":"powerbi","label":"Status"}]},
      "filter": {"field":"facilityStatus","fieldSource":"powerbi","operator":"!=","value":"Retired"},
      "performance": {"maxFeatures":5000}
    },
    {
      "id": "incidents",
      "name": "Incidents",
      "dataset": "recentIncidents",
      "groupId": "operations",
      "source": {"type":"powerbi","bindings":{"latitude":"incidentLatitude","longitude":"incidentLongitude"}}
    }
  ],
  "toolbar": {"visible":true,"bookmarks":true,"layers":true,"legend":true}
}
```

## Map Studio

Map Studio is a permanent specialized workspace alongside the Visual Inspector. Select a map in Inspector and choose **Open in Map Studio**, or open its Studio tab directly. Both workspaces share the selected component, canonical JSON, validation, bounded undo/redo history, and live preview. HyperPBI Studio owns candidate validation and passes the exact current Runtime Config into the same preparation pipeline used by the live preview; Map Studio does not synthesize a default configuration during integrated use. Provider, security, interaction, field-binding, feature-limit, geocoder, map, and alias changes therefore affect the next transaction immediately. Text inputs keep a local draft and commit one validated transaction on blur or Enter; Escape cancels. Invalid drafts remain visible for correction without replacing the last valid preview.

Map Studio provides:

- layer tree creation for Power BI, ArcGIS feature, ArcGIS tile, and ArcGIS dynamic layers
- unique IDs, rename, duplicate, two-step delete, drag/keyboard reorder, grouping, group visibility/opacity/collapse
- effective dataset selection and dataset-aware field controls
- geometry, coordinate, address, grouping, color, size, tooltip, and detail bindings
- provider-specific URLs and explicit, cancellable public service metadata inspection; one root request returns bounded spatial-layer, group-layer, and table summaries, and selecting one spatial item makes one lazy metadata request for its fields
- service/simple/unique/class-break/continuous/proportional/heatmap/cluster/density renderers
- bounded unique-value/domain previews and editable manual breaks
- labels, safe popups/tooltips, UI actions, a first-class layer interaction editor, source-aware structured filters, joins, visibility, and performance limits
- an explicit, cancellable **Run join preview** action bounded to 500 service features, using the runtime query, normalization, duplicate/unmatched policies, and join engine
- basemap choices, reactive authored view, layer groups, live-preview view bookmarks, and static/runtime diagnostics

Map Studio never creates a second hidden configuration model. Provider URLs must be supplied explicitly; it does not invent endpoints or credentials.

Stable map feature interactions execute from Leaflet feature clicks, so `map.layers[].interaction.trigger` accepts `"click"` only. Map Studio shows that value as read-only and strict 2.0 validation rejects `change` or `auto` for a map layer. Those generic triggers remain available to non-map component contracts.

## Sources and ArcGIS queries

| Source | Current scope |
|---|---|
| `powerbi` | Coordinate or bound geometry display, feature click/details/tooltip, renderers/labels, filters, and native lineage selection |
| `arcgisFeature` | Public FeatureServer/MapServer metadata/query, feature click/details/tooltip/selection, service renderer/labels, and reference or Power BI join mode |
| `arcgisTile` | Display-only public HTTPS raster tile overlay with attribution and zoom bounds; no feature identify, popup, join, or selection |
| `arcgisDynamic` | Public dynamic map images plus user-driven `/identify`; results are temporary read-only details with optional returned-geometry highlight, never joins or persistent selection |

ArcGIS feature queries request output spatial reference 4326. Viewport mode sends an envelope geometry with `inSR`, `outSR`, and intersects spatial relation; it supports request debounce, abort signals, stale-result rejection, pagination/object-ID fallback, service record limits, bounded request batches, and local extent/query caching. Every completed map navigation publishes the new viewport, including Home, bookmarks, authored-view changes, fit-to-data, layer/selection zoom, and search results. Invisible and out-of-range viewport layers do not request data; an in-flight request is cancelled, retained results remain available, and entering the visible zoom range requests the current extent. Results and warnings are bounded. Query `outFields` contain only fields whose effective `fieldSource` is `service`, plus required service join keys; Power BI keys and joined aliases are never sent as ArcGIS field names.

Dynamic identify captures the clicked WGS84 location together with the current map extent and rendered image size, then posts to the MapServer `/identify` endpoint. A newer click aborts and versions out an older request. Matching sublayers share the Preact feature-details surface through an accessible result chooser; returned geometry is highlighted in a non-interactive temporary layer. Closing details, clicking elsewhere, hiding the source, or activating a persistent feature removes the temporary result. Identify output never enters canonical layer selection, Power BI selection, joins, refresh state, or the persistent Leaflet feature registry. Tile layers do not call identify.

Feature attributes have three exact namespaces: `powerbi`, `service`, and `joined`. Renderer, labels, popup/tooltip, visibility, structured filters, interactions, and cluster sums use the selected `fieldSource`; a missing source never falls through to a same-named value in another namespace. Power BI layers default to `powerbi`, ArcGIS reference layers to `service`, and ArcGIS join layers to `joined`. Impossible source/layer combinations and metadata/schema misses produce structured diagnostics.

Service-root inspection is intentionally lazy. The root response is classified without fetching every child: spatial layers are render candidates, group layers are hierarchy/navigation only, and nonspatial tables are shown separately and cannot be selected as geometry sources. Selecting a spatial layer cancels or supersedes an older item request, rejects stale responses, reuses successful metadata from the normalized URL/item cache, and preserves the root summaries. Authentication/access failures are not cached as successful metadata.

Joins support normalization (`trim`, `upper`, `lower`, `removeNonAlphanumeric`, `numberString`), duplicate/unmatched policies, key batching, and aggregations. Cardinality is declared from Power BI rows toward service features. `oneToOne` requires unique normalized keys on both sides. `manyToOne` permits repeated Power BI keys and aggregates their rows, while repeated service keys remain a diagnosed violation; `serviceDuplicatePolicy: "first"|"all"|"error"` determines deterministic suppression, expansion, or failure. Duplicate policies never relabel a violated relationship as clean cardinality.

`unmatchedPolicy: "ignore"` computes bounded counts without a layer warning; `"warn"` emits one bounded summary warning; `"diagnose"` exposes match rate, blank/duplicate counts, and bounded samples in detailed diagnostics without requiring a user-facing warning. Blank join keys are counted separately from unmatched normalized keys. Runtime and **Run join preview** use the same policy adapter.

Join numeric aggregation excludes null, undefined, empty/whitespace strings, booleans, objects, NaN, and infinities. Finite numeric strings remain supported for compatibility. `sum|avg|min|max` return `null` when no valid numeric input exists; zero remains a real value. `first|last` skip blanks, `count` counts nonblank values, and `distinctCount` uses stable nonblank value semantics. Bounded per-alias diagnostics report input, valid, blank, and discarded counts without retaining rows. A join never creates or implies a Power BI relationship.

## Runtime correctness and safety

- Configured `layerValue` that is absent returns an empty layer with `MAP_LAYER_VALUE_NOT_FOUND` and bounded available values. It never chooses the first group.
- Geometry analysis examines all valid features and returns point, multipoint, polyline, polygon, mixed, or unknown. Mixed layers emit `MAP_LAYER_MIXED_GEOMETRY` with type counts.
- Per-layer `maxFeatures` and a deterministic 20,000-feature map-wide budget prevent unbounded drawing.
- Labels, popup fields, unique classes, class breaks, join preview samples, diagnostics, ArcGIS result counts, and caches are bounded.
- Point features render the stable `circle`, `square`, `diamond`, and `triangle` symbols through a controlled marker factory; non-circle SVG contains no author markup or external URL.
- An explicit `cluster` renderer is authoritative for a 2.0 layer even when the legacy global cluster switch is off. `clusterLabel: "count"` shows the member count; `"sum"` sums the numeric `aggregateField` from its exact field source and honors the bounded numeric format.
- Source, renderer, request, join, and layer rendering timings are exposed in structured diagnostics where applicable.
- Normal viewer diagnostics show a sanitized service origin, not the full raw URL.
- ArcGIS tile and dynamic overlays have stable definition signatures. URL, attribution, zoom bounds, pane, source type, and every dynamic layer-ID/definition/format/transparency/debounce property replace the mounted instance; opacity and visibility update an unchanged instance in place. Access denial removes already-loaded content, restoration uses the newest definition, stale callbacks are ignored, and map center/zoom is preserved.
- Computed class breaks cap the effective class count by the validated request, color-ramp length, and distinct finite values. Equal intervals handle a constant domain as one class; quantiles collapse repeated boundaries; no break contains `undefined`/NaN; and an explicit final inclusive boundary classifies the maximum without adding an epsilon. Manual ranges require finite ordered non-overlapping bounds.
- Map diagnostics use RFC 6901 pointers based on the authored component location, such as `/components/3/layers/10`; IDs are never substituted for array indexes. Map Studio filters by the exact selected-layer pointer/prefix, so layer 1 cannot display layer 10 diagnostics, and keeps map/provider diagnostics separate.

## Schema/runtime capability status

The machine-readable registry is `src/maps/mapCapabilityRegistry.ts`. Strict map validation rejects unknown nested properties. Every accepted capability records status, runtime/validation ownership, Map Studio support, documentation, test evidence, and a limitation when necessary.

| Status | Capabilities |
|---|---|
| Implemented | per-layer datasets/bindings, groups, live-view bookmarks, source-aware filters/visibility/interactions, reactive supported basemaps/views and ArcGIS tile/dynamic definitions, temporary Dynamic MapServer identify, ratio fit padding, enforced join cardinality/unmatched/aggregation semantics, lazy classified ArcGIS metadata authoring, canonical/scoped diagnostics, circle/square/diamond/triangle points, robust simple/unique/class-break/continuous/proportional/cluster renderers with count/sum labels, labels, safe popup/tooltip, layer/toolbar controls, feature limits |
| Partial | map-layer interaction trigger (`click` only), `fitMode` nuances, join `keyType`, basic `hideOverlaps`, zoom-based approximation for service-scale visibility |
| Experimental | mounted-instance `preserveView`, heatmap fallback, basic density grid |
| Deprecated | generalization and progressive-rendering properties remain accepted for schema compatibility but are not executed or exposed by Map Studio |
| Unsupported | scale/coordinate readout, rectangle/lasso selection, measurement, time slider, swipe/side-by-side comparison, export/print, and viewer-to-Studio launch; these are registered future P1 work and are not accepted schema |
| Rejected | unknown properties, unsupported renderer types, and `naturalBreaks` (use manual, equal interval, or quantile) |

Partial, experimental, and deprecated properties emit `MAP_CAPABILITY_LIMITATION`. Deprecated no-op input remains accepted only to preserve existing schemas and is not exposed as an authoring option. Accepted stable input is not silently ignored.

## Viewer controls

The layer panel supports group hierarchy, collapse/expand, visibility, source/dataset tooltip, selected layer, drag and keyboard reorder, opacity, labels, feature/loading/diagnostic status, layer zoom, and reset. The toolbar supports Home, layers, legend, search, clear selection, zoom to selection, and bookmarks. Basemap visibility/type/URL/attribution/max zoom and authored center/zoom/min/max synchronize to the mounted map without remounting or removing operational overlays. Unrelated layer changes do not reset a user's live navigation. `firstLayer` fit uses the first visible feature layer; one point receives a bounded point zoom and multiple points use `view.fitPadding`, a Leaflet bounds-padding ratio from `0` through `0.5` with default `0.08` (8%).

Map Studio's **Add current view** reads the selected map's latest live preview center and zoom. It falls back to the authored view only when no live viewport is available, and a pan/zoom never changes canonical JSON until the author explicitly creates the bookmark.

## Search and geocoding are unchanged

This architecture change does not alter geocoding. The default geocoder remains `none`; Nominatim, ArcGIS, and custom implementations, endpoint policies, WebAccess checks, caching, rate limiting, privacy acknowledgment, search requests, and result handling are unchanged. Address data is never transmitted automatically.

## Packaging profiles

- **Core:** the single Values role and no WebAccess privilege; bound Power BI geometry remains available.
- **Maps broad:** the same Values role and intended `https://*` map access.
- **Maps restricted:** the same Values role and configured HTTPS host allowlist.

Run `npm run package:core`, `npm run package:maps`, and `npm run package:verify`. Never store tokens, credentials, or private service secrets in dashboard JSON.

## Current limitations

- secured/token/OAuth ArcGIS services and credentials in JSON
- feature editing, 3D scenes, geoprocessing, relationship queries, and network tracing
- independent queries to arbitrary Power BI model tables
- advanced cartographic label placement
- natural breaks classification
- streamed feature-by-feature progressive rendering
- exact ArcGIS service-scale denominator parity
- scale/coordinate readout, rectangle/lasso selection, and distance/area measurement
- time slider, swipe/side-by-side comparison, selected-feature export, print-layout, and opening Map Studio from the viewer

Use pre-geocoded coordinates and organizationally approved public services for predictable enterprise deployment.
