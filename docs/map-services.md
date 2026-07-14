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

Every layer selects its effective dataset by:

1. `layer.dataset`
2. map component `dataset`
3. `powerbi`

The runtime resolves source bindings, renderer fields, labels, popup/tooltip fields, visibility conditions, filters, interactions, and the Power BI side of ArcGIS joins against that layer's effective schema and rows. Grouped rows retain arrays of contributing Power BI row indices and row identities for selection where Power BI supplied identities.

## Canonical layer example

```json
{
  "type": "map",
  "id": "operations_map",
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
      "filter": {"field":"facilityStatus","operator":"!=","value":"Retired"},
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

Map Studio is a permanent specialized workspace alongside the Visual Inspector. Select a map in Inspector and choose **Open in Map Studio**, or open its Studio tab directly. Both workspaces share the selected component, canonical JSON, transaction validation, undo/redo history, and live preview. Invalid candidates leave the last valid preview unchanged.

Map Studio provides:

- layer tree creation for Power BI, ArcGIS feature, ArcGIS tile, and ArcGIS dynamic layers
- unique IDs, rename, duplicate, two-step delete, drag/keyboard reorder, grouping, group visibility/opacity/collapse
- effective dataset selection and dataset-aware field controls
- geometry, coordinate, address, grouping, color, size, tooltip, and detail bindings
- provider-specific URLs and public service metadata inspection
- service/simple/unique/class-break/continuous/proportional/heatmap/cluster/density renderers
- bounded unique-value/domain previews and editable manual breaks
- labels, safe popups/tooltips, UI actions, structured filters, joins, visibility, and performance limits
- basemap choices, authored view, layer groups, canonical view bookmarks, and static/runtime diagnostics

Map Studio never creates a second hidden configuration model. Provider URLs must be supplied explicitly; it does not invent endpoints or credentials.

## Sources and ArcGIS queries

| Source | Current scope |
|---|---|
| `powerbi` | Per-layer dataset, location bindings, renderers, labels, popup/tooltip, filters, lineage selection |
| `arcgisFeature` | Public FeatureServer/MapServer metadata/query, reference or Power BI join mode |
| `arcgisTile` | Public HTTPS raster tile overlay with attribution and zoom bounds |
| `arcgisDynamic` | Public dynamic map image requests with layer IDs/definitions, format, transparency, debounce, and zoom bounds |

ArcGIS feature queries request output spatial reference 4326. Viewport mode sends an envelope geometry with `inSR`, `outSR`, and intersects spatial relation; it supports request debounce, abort signals, stale-result rejection, pagination/object-ID fallback, service record limits, bounded request batches, and local extent/query caching. Results and warnings are bounded. Provider and Power BI attributes remain separate, with joined attributes as an explicit overlay.

Joins support normalization (`trim`, `upper`, `lower`, `removeNonAlphanumeric`, `numberString`), duplicate/unmatched policies, key batching, and aggregations. The preview reports local Power BI keys immediately; service/match counts populate after a public service query. A join never creates or implies a Power BI relationship.

## Runtime correctness and safety

- Configured `layerValue` that is absent returns an empty layer with `MAP_LAYER_VALUE_NOT_FOUND` and bounded available values. It never chooses the first group.
- Geometry analysis examines all valid features and returns point, multipoint, polyline, polygon, mixed, or unknown. Mixed layers emit `MAP_LAYER_MIXED_GEOMETRY` with type counts.
- Per-layer `maxFeatures` and a deterministic 20,000-feature map-wide budget prevent unbounded drawing.
- Labels, popup fields, unique classes, class breaks, join preview samples, diagnostics, ArcGIS result counts, and caches are bounded.
- Source, renderer, request, join, and layer rendering timings are exposed in structured diagnostics where applicable.
- Normal viewer diagnostics show a sanitized service origin, not the full raw URL.

## Schema/runtime capability status

The machine-readable registry is `src/maps/mapCapabilityRegistry.ts`. Strict map validation rejects unknown nested properties. Every accepted capability records status, runtime/validation ownership, Map Studio support, documentation, test evidence, and a limitation when necessary.

| Status | Capabilities |
|---|---|
| Implemented | per-layer datasets/bindings, groups, bookmarks, structured filters, supported basemaps, ArcGIS sources/joins, simple/unique/class-break/continuous/proportional/cluster renderers, labels, safe popup/tooltip, layer/toolbar controls, feature limits |
| Partial | `fitMode` nuances, join `keyType`, basic `hideOverlaps`, zoom-based approximation for service-scale visibility |
| Experimental | mounted-instance `preserveView`, heatmap fallback, basic density grid, provider-dependent generalization, per-layer rather than streamed progressive drawing |
| Unsupported | scale/coordinate readout, rectangle/lasso selection, measurement, time slider, swipe/side-by-side comparison, export/print, and viewer-to-Studio launch; these are registered future P1 work and are not accepted schema |
| Rejected | unknown properties, unsupported renderer types, and `naturalBreaks` (use manual, equal interval, or quantile) |

Partial and experimental properties emit `MAP_CAPABILITY_LIMITATION`; Map Studio labels them accordingly. Accepted stable input is not silently ignored.

## Viewer controls

The layer panel supports group hierarchy, collapse/expand, visibility, source/dataset tooltip, selected layer, drag and keyboard reorder, opacity, labels, feature/loading/diagnostic status, layer zoom, and reset. The toolbar supports Home, layers, legend, search, clear selection, zoom to selection, and bookmarks. `firstLayer` fit uses the first visible feature layer; one point receives a bounded point zoom and multiple points use padded bounds.

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
