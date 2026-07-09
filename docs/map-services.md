# HyperPBI Maps and Map Services

## Current Support Status

| Capability | Status |
|-----------|--------|
| Power BI lat/lon | Stable |
| Power BI WKT/GeoJSON geometry | Stable |
| Power BI X/Y coordinates | Stable |
| Cached address geocoding | Stable |
| OSM basemap | Stable in Maps build |
| Nominatim geocoding | Stable, user-triggered |
| ArcGIS geocoder | Stable where configured |
| Declarative layered map schema | Experimental |
| Power BI layered source | Stable |
| ArcGIS REST URL parsing | Foundation |
| ArcGIS host policy checking | Foundation |
| ArcGIS service inspection | Foundation |
| ArcGIS feature query client | Foundation |
| ArcGIS geometry conversion | Foundation |
| Power BI/service join engine | Foundation |
| ArcGIS layer rendering | Not end-to-end |
| Runtime layer reorder | Not connected |
| Runtime opacity control | Not exposed |
| Runtime label toggle | Not exposed |
| Map toolbar Home | Placeholder |
| Map toolbar Zoom to selection | Placeholder |
| Dedicated Map Builder tab | Not implemented |

## Legacy Power BI Spatial Maps (Stable)

Location priority: Geometry → Latitude/Longitude → X/Y → Address. GeoJSON and WKT point/line/polygon supported. All legacy `settings`, `style`, and `popup` properties continue working.

## Core and Maps Packages

- **Core** (`npm run package:core`): No WebAccess. Certification posture.
- **Maps** (`npm run package:maps`): WebAccess for OSM/Nominatim/ArcGIS hosts.

Add custom ArcGIS hosts:
```bash
HYPERPBI_MAP_HOSTS="https://gis.example.org,https://*.agency.gov" npm run package:maps
```
Only HTTPS; user URLs cannot bypass package privileges. ArcGIS Online wildcards included by default.

## Basemaps

| Provider | Maps Build Required |
|----------|-------------------|
| `none` | No |
| `osm` | Yes |
| `customTile` | Yes |
| `arcgisTile` | Yes |

## Geocoding

User-triggered in Studio only. Address data never sent automatically. Cached by normalized address.

## Declarative Map Layers (Experimental)

The `layers[]` schema supports Power BI, ArcGIS feature, ArcGIS tile, and ArcGIS dynamic sources. See specification reference for complete schema.

**ArcGIS feature rendering is not yet end-to-end connected.** The schema and service infrastructure (URL parsing, host policy, inspection, query planning, WHERE generation, GeoJSON/Esri JSON parsing, geometry conversion, join engine) are in place. Runtime integration is in progress.

## Public ArcGIS REST Services

HyperPBI accesses public services through native `fetch`. No ArcGIS SDK. No ArcGIS account required for public layers.

### URL Forms
```
https://<host>/arcgis/rest/services/<folder>/<service>/FeatureServer
https://<host>/arcgis/rest/services/<folder>/<service>/FeatureServer/0
https://<host>/arcgis/rest/services/<folder>/<service>/MapServer
```

### Public vs Secured
- **Public:** Accessible without auth. Query capability available.
- **Secured:** Error 498/499 or HTTP 401/403. Clear unsupported message displayed. No token field exposed.

## Join Privacy

A geometry join transmits distinct configured join-key values to the service host. No other Power BI fields are transmitted.

## Troubleshooting

| Symptom | Likely Cause |
|---------|-------------|
| Map shows neutral grid | Maps package not installed |
| No tiles | WebAccess not granted |
| "Host not permitted" | Host not in HYPERPBI_MAP_HOSTS |
| "Service requires authentication" | Layer is secured |
| "Could not access service" | CORS/network/WebAccess |
| Map empty with bound fields | Check field roles |

## Current Limitations

- ArcGIS REST layered rendering not yet end-to-end connected
- Map toolbar Home/Zoom-to-selection are placeholder handlers
- Layer panel reorder/opacity/label toggle UI not fully exposed
- Dedicated Map Builder Studio tab not implemented
- Only EPSG:4326 output spatial reference supported
- No secured-service authentication flow
- No ArcGIS SDK bundled (intentional)
