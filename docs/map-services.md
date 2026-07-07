# Map services

Map bindings live in Runtime Config. Location priority: Geometry, Latitude/Longitude, X/Y (EPSG:4326), Address. Provider settings are global and presentation settings stay on map components.

Core package: no WebAccess, neutral background, cached/bound coordinates only. Maps package: OSM raster tiles plus Nominatim and declared ArcGIS geocoding domains through WebAccess. OSM uses visible viewport tiles only and includes attribution.

Nominatim is disabled until provider policy and privacy acknowledgement permit it. It has no autocomplete, never runs during report rendering, processes one request at a time at at most one request/second, caches normalized addresses, supports cancellation, and logs each result. Use approved enterprise services or pre-geocode large datasets.

## ArcGIS Geocoding Server

Choose **ArcGIS Geocoding Server** and provide either a URL ending in `/GeocodeServer` or the full `/findAddressCandidates` URL. HyperPBI sends `SingleLine`, `f=json`, `outFields=*`, and `maxLocations=1`; optional `countryCode`, `category`, and `token` values are sent only when configured. The highest-scoring candidate must meet `minScore` (default `80`) and contain finite `location.x`/`location.y` longitude/latitude values.

Example endpoint:

```text
https://geosop1.houstontx.gov/arcgis/rest/services/Geocoders/COH_Locator_Compo/GeocodeServer
```

Geocoding remains user-triggered and requires the privacy acknowledgement. The maps package declares the default ArcGIS service and the example above; other organizational hosts must be added to the package WebAccess privilege before Power BI will permit requests.
