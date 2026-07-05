# Map services

Map bindings live in Runtime Config. Location priority: Geometry, Latitude/Longitude, X/Y (EPSG:4326), Address. Provider settings are global and presentation settings stay on map components.

Core package: no WebAccess, neutral background, cached/bound coordinates only. Maps package: OSM raster tiles and Nominatim domains declared through WebAccess. OSM uses visible viewport tiles only and includes attribution.

Nominatim is disabled until provider policy and privacy acknowledgement permit it. It has no autocomplete, never runs during report rendering, processes one request at a time at at most one request/second, caches normalized addresses, supports cancellation, and logs each result. Use approved enterprise services or pre-geocode large datasets.
