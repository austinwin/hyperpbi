# Published maps

HyperPBI imports portable map definitions into its existing Leaflet runtime. It does not embed a published website or execute its JavaScript. Map Studio → Add source → Import published map definition, or **Import published map**, opens a preview and import workflow.

## Supported publishing interfaces

Any publisher can supply a public GeoJSON URL, ArcGIS FeatureServer URL, tile URL or a portable definition using this contract. MiniUp app/io resources use these same generic adapters. There is no dedicated MiniUp account, map selector or inferred project endpoint. Arbitrary HTML/JavaScript is not a portable map export and is never scraped or executed.

Publish the exported JSON as a site asset and paste that asset's HTTPS URL, or open a local JSON export for a snapshot. A private page, HTML response, authorization error, invalid definition, or blocked origin leaves saved JSON untouched. Redirects are rejected: supply the final public asset URL. Credential-bearing and signed URLs are rejected. Authentication is intentionally outside the dashboard JSON.

## Manifest 1.0

Required envelope: `format: "hyperpbi.map"`, `schemaVersion: "1.0"`, stable `id`, `name`, publisher `version`, and 1–256 `layers`. See [the complete two-layer fixture](../examples/map/published-map.json).

Optional metadata: `sourceUrl`, `view`, WGS84 `extent: [west,south,east,north]`, `basemap`, `layerGroups`, `bookmarks`, `legend`, `refresh: {updatedAt,intervalMinutes}`, and `interactions: {selection,rectangle,lasso}`. Center/bookmark coordinates use Leaflet `[latitude,longitude]`; GeoJSON coordinates use `[longitude,latitude]`. An extent without a view is converted to an approximate center/zoom, since exact fit depends on the report viewport.

Each layer uses the native HyperPBI `MapLayerDefinition`: stable `id`, `name`, `source`, `order`, `groupId`, `visible`, `opacity`, `renderer`, `labels`, `popup`, `tooltip`, `legend`, `visibility`, `performance`, filters and interactions. Additional export metadata includes `geometryType` and `fields: [{name,type,alias?}]`, where type is string, number, boolean, or date. Native renderer validation rejects unsupported styles with a precise error; unsupported source layers are listed as import warnings and skipped. At least one supported layer is required.

Supported sources are inline/public remote `geoJson`, `arcgisFeature`, `arcgisTile`, `arcgisDynamic`, and `xyz`. GeoJSON needs stable feature IDs or `source.idField`; FeatureServer uses its object IDs. Local row-position fallback is diagnosed and cannot guarantee persistence after data reorder. URLs may be relative only when resolving a remote manifest against its published URL. Source data is not fetched while previewing a manifest.

The typed `exportMapManifest` adapter in `src/maps/imports/mapManifestSource.ts` validates a publisher-supplied configuration and adds the format/version envelope. This adapter requires explicit map configuration; it never scrapes or evaluates a website's source.

## Generic published-map picker

Configure a report's reusable library in Runtime Config JSON:

```json
{"version":"1.0","maps":{"publishedMaps":[{"name":"Facility Network","manifestUrl":"https://YOUR-PUBLISHED-HOST/map.hyperpbi.json"}]}}
```

These are author-configured URLs, not an account discovery API. Selecting a map loads and validates its manifest, then **Import map and layers** applies one undoable transaction. The URL is illustrative: replace it with the actual exported asset URL.

## Snapshot, linked refresh and lineage

A snapshot copies supported configuration into the native `map` specification. A linked import also keeps `map.imports[]` with the manifest URL, publisher version, timestamp, refresh metadata and a baseline. Imported native layers retain `provenance` with map/layer IDs, source URL, fields and geometry metadata. Existing Power BI and other layers remain intact.

Linked maps refresh explicitly from the import panel. Preview first, then apply. Three-way merging compares the last baseline with the local configuration and the new publication: untouched properties accept publisher updates; local style, visibility, order, join, source and nested-property edits remain. Local deletions stay deleted. A publisher-deleted layer with local edits is retained with a warning. A changed publisher map ID requires a new import. No background manifest refresh changes a saved dashboard without author action. Data-source refresh intervals remain separate from map-definition refresh.

Power BI slicers reevaluate logical datasets; they do not remove imported definitions. Layer datasets are logical views of the one flattened Values data view or explicit remote sources. They are not independent semantic-model table queries. Joins do not create Power BI model relationships. Measures may style or aggregate values; only real model columns may serve as external basic-filter targets.

## Host limits

Public resources require CORS plus allowed Power BI WebAccess origins and tenant permissions. Core does not grant remote access. The browser Playground has its own access policy. GeoJSON downloads are bounded client-side datasets; use FeatureServer viewport queries for large remote spatial datasets. Tile layers provide display only; dynamic map services provide read-only identify. Power BI report slicer/relationship behavior must also be validated in the actual report host.
