# Remote HyperPBI Fragments

A public GET endpoint can return an untrusted, declarative component tree and its datasets. Dynamic GIS Popups are the first surface using this reusable capability. MiniUp is an optional JSON provider; it does not need an SDK or a special component renderer.

[Try Dynamic GIS Popup — Remote Analytics](https://hyperpbi.com/examples/maps?example=remote-analytics). Click one of three synthetic Houston pressure sensors, hover or zoom its chart, expand the popup, refresh, or choose another sensor. Choose **Edit in Playground** to change the endpoint in Map Studio, save the project, reload and run it. The gallery includes copyable specification JSON and a sample API response.

## Response contract

The transport has one version: `hyperpbi.fragment` **1.0**. Components use the existing strict dashboard **2.0 component schema**. These are different version numbers for different contracts. No historical popup adapter runs at runtime.

```json
{
  "kind": "hyperpbi.fragment",
  "version": "1.0",
  "title": "Sensor 1024",
  "datasets": {
    "current": [{"psi": 62.4, "status": "Healthy"}],
    "pressure": [{"time": "08:00", "psi": 62.4}, {"time": "09:00", "psi": 61.8}]
  },
  "components": [
    {"type": "kpi", "id": "pressure_now", "title": "Current pressure (psi)", "dataset": "current", "field": "psi", "aggregation": "first", "format": "0.0"},
    {"type": "statusBadge", "id": "status", "dataset": "current", "field": "status", "intent": "success"},
    {"type": "lineChart", "id": "history", "title": "Pressure history", "dataset": "pressure", "category": "time", "measure": "psi", "height": 240, "chartStyle": {"zoom": true, "tooltip": true, "legend": true}, "events": {"zoom": {"enabled": true}}}
  ]
}
```

`datasets` maps 1–16 names to arrays of objects containing scalar JSON cells. Names start with a letter and contain letters, numbers, `_` or `-`; `powerbi` is reserved. Use deterministic field aliases such as `time` and `psi`. A component can bind to any dataset. An omitted component dataset uses the first dataset in the response. Empty arrays are supported but provide no field metadata. Remote fragments cannot define remote data sources, dashboard configuration, definitions, scripts or their own network policy.

The executable, complete responses are [sensor 1024](../examples/remote-fragments/sensor-1024.json), [sensor 1025](../examples/remote-fragments/sensor-1025.json) and [sensor 1026](../examples/remote-fragments/sensor-1026.json). They include current pressure, status, a chart, minimum/average/maximum statistics, a paginated table and notes.

## Architecture and isolation

`RemoteFragmentHost` resolves the URL, checks the build and host permissions, fetches bounded JSON, and calls `prepareRemoteFragment`. Preparation normalizes the independent datasets, namespaces component IDs and their references, and calls `prepareSpecification` with canonical component validation. The result renders through `HyperPbiRoot`, `DashboardRenderer` and `ComponentRegistry`.

Each fragment gets its own root state, data workspace, error boundaries and scoped CSS. The parent supplies theme settings and permission information, never dashboard rows, local state, callbacks or Power BI selection identities. UI actions are restricted both during validation and in the root executor. Only local tabs, steps, state changes and filter clearing are permitted. External model interaction is blocked; this release does not accept model identity mappings from an API response.

Trees are limited to 100 components, eight layout levels, 16 datasets, 5,000 total rows, 100 columns per dataset and 1 MiB per response. IDs must be unique and at most 55 characters before namespacing. Validation rejects unsupported types at any nested component position. Returned errors do not replace another sensor's current content.

## Component support

Compatibility is derived from canonical component descriptors, with explicit exclusions. KPIs, metric grids, status badges, charts, gauges, progress indicators, tables, matrices, cards, detail panels, text, Markdown, safe SVG, tabs, grids and flex layouts use their existing renderer. Images embedded in supported SVG or sanitized content follow existing image sanitization and the build asset-host policy; there is no separate image API renderer.

Nested maps, HTML/custom author documents and HTML slots, Mermaid diagrams, global side panels and overlay components (`modal`, `offcanvas`, `dropdown`, `popover`) are restricted. Fragments cannot trigger nested remote sources, host actions or arbitrary recursion. Supported local controls operate on their own state. See `fragmentComponentTypes` in the implementation for the current derived list; no separate component count is maintained here.

ECharts retains hover tooltips, legends, multiple series, zoom/pan, sliders, brush events and restore controls through its current adapters and sanitized `options`. Set `chartStyle.zoom: true` and `events.zoom.enabled: true` to retain zoom state. Use canonical chart `events.brush` for local selection and `options.toolbox.feature.restore` for reset. Expanding the popup resizes the existing chart through `ResizeObserver`; it does not remount the fragment. Popup wheel, pointer, touch and double-click events stop before reaching Leaflet navigation. Refresh intentionally replaces the response and resets its local component state.

## Map Studio

1. Select a layer and open **Popup** under Interaction.
2. Choose **Remote Fragment** in **Popup mode**.
3. Enter the endpoint and insert a feature attribute binding.
4. Choose a **Test feature**, or click one on the map.
5. Inspect the live response and save.

The canonical modes are `none` (no details), `default` (feature attributes), `custom` (built-in builder, fields, templates and actions) and `remote` (a fragment request). `popup.enabled` has been removed. Tooltips retain their independent `enabled` setting.

```json
{
  "mode": "remote",
  "remote": {
    "endpoint": "https://my-app.miniup.io/api/sensor?id={{service.site_id}}&station={{powerbi.station_id}}&asset={{joined.asset_id}}",
    "timeoutMs": 10000,
    "cacheTtlSeconds": 30,
    "fallback": "attributes",
    "width": 540,
    "maxHeight": 560
  }
}
```

This object belongs at `map.layers[].popup`. Bindings use the existing `service`, `powerbi` and `joined` attribute resolver. Values are URL-encoded; missing values produce a clear error. The origin must be literal: attributes cannot choose a host. `remote.endpoint` bindings are included when collecting required ArcGIS service query fields.

Only the endpoint and binding picker are initially shown. Advanced settings collapse into **Request, fallback and size**. Timeout is 1,000–15,000 ms; cache TTL is 0–3,600 seconds (zero disables caching); width is 280–1,000 px and maximum height 200–1,000 px. Layout clamps to narrow containers. `fallback` is `message` or `attributes`; `fallbackMessage` accepts up to 500 characters.

## MiniUp and generic HTTPS providers

Publish an endpoint that returns the response object above with `Content-Type: application/json` and browser CORS support. Public applications and API paths under **both** MiniUp domain families are approved by default:

```text
https://miniup.app
https://*.miniup.app
https://miniup.io
https://*.miniup.io
```

A wildcard covers subdomains; the apex is declared separately. Similar suffixes, unapproved ports and embedded credentials are rejected. MiniUp Functions are one possible provider, not a requirement. Keep protected upstream credentials on your server.

Browser builds can add HTTPS origins with `HYPERPBI_WEB_REST_HOSTS`. Power BI Maps packages can add them using `HYPERPBI_MAP_HOSTS`. Built-ins are retained when adding hosts. A fragment response cannot add a host. Requests use GET, omit cookies/credentials and referrers, accept JSON, and reject redirects. Arbitrary methods, secret headers and embedded credentials are unsupported.

## Browser, Power BI, CORS and WebAccess

Browsers require the build trust policy and endpoint CORS. Power BI additionally requires the network-enabled Maps package, valid packaged `WebAccess` origin declarations and runtime host permission for the configured endpoint. Core remains network-free. Read-only `miniup.table`, `miniup.function` and approved `rest.get` sources use the same permission boundary; remote records never acquire model identities automatically.

WebAccess approval is not a proxy and does not override CORS. Power BI supports exact HTTPS hosts or subdomain wildcards on concrete domains; `https://*` is unsupported. Tenant, administrator, authentication and network rules can still prevent a connection. Browser success does not prove Power BI tenant connectivity.

The gallery fetches public repository fixtures from the explicitly approved `https://raw.githubusercontent.com` origin, using `/austinwin/hyperpbi/main/examples/remote-fragments/sensor-{{service.site_id}}.json`. Those responses are public and CORS-enabled after the source commit reaches main; no MiniUp account or website server is required. The website also mirrors the responses as a Next.js route at `/api/demo/sensors/1024` (also `1025` and `1026`), included in the existing OpenNext/Sites Worker build. It returns deterministic fixtures, a 30-second cache header, `Access-Control-Allow-Origin: *`, `GET, OPTIONS`, and no private data. Unknown sensors return CORS-enabled 404 JSON. Cross-origin preview and Power BI can use the public route after that website version has been deployed; local browser tests intercept that public HTTPS URL with the same fixture bytes, preserving the real fetch/validation/render pipeline.

## Caching, cleanup and troubleshooting

The in-memory cache retains at most 32 bounded responses keyed by the fully resolved URL. Each consumer owns its abort signal; switching sensor, editing the endpoint or unmounting cancels its request. Late responses are ignored. TTL expiration causes another fetch; **Refresh data** bypasses cached content. Charts are disposed by the existing renderer when their fragment unmounts.

- **Host not approved:** add the exact HTTPS origin to the appropriate build variable and rebuild; editing JSON cannot grant access.
- **WebAccess denied:** use Maps, inspect packaged capabilities and approve that origin in the host. Core cannot request it.
- **Network, CORS or WebAccess restriction:** check the endpoint in browser developer tools and inspect `Access-Control-Allow-Origin`. JavaScript cannot reliably distinguish these transport failures, so the error names the possible boundaries.
- **Missing feature attribute:** check the qualified namespace and ArcGIS query fields. A service ID and a joined ID can differ.
- **Invalid fragment:** verify `kind`, transport `version`, scalar datasets, unique IDs and canonical component fields. Extra root properties and privileged actions are rejected.
- **Size/timeout error:** reduce rows/components or optimize the endpoint. Limits cannot be raised by returned JSON.

See [Security](security.md), [Map Studio](map-studio.md), [Data model](data-model.md), and [Development verification](development-verification.md).
