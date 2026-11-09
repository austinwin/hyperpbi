# Dynamic Content & Remote Fragments

Dynamic Content loads a declarative `hyperpbi.fragment` from an approved public HTTPS API. Use `dynamicContent` wherever a dashboard accepts components, including a card, `rightPanel`, modal, offcanvas, or inline region. Map popups use the same request and renderer.

| Live dashboard | Try it | Public MiniUp request |
| --- | --- | --- |
| [Dynamic GIS Analytics](https://hyperpbi.com/examples/dynamic-gis-analytics) | Click a Houston pressure station, zoom the chart, and page through measurements. | [Sensor 1024](https://functions.miniup.app/hyperpbi-dynamic-demo/sensor?id=1024) |
| [Universal Dynamic Content](https://hyperpbi.com/examples/universal-dynamic-content) | Select an asset for its work plan. Set Work priority or click Refresh workload to update the workload card. | [Asset P-204](https://functions.miniup.app/hyperpbi-dynamic-demo/asset?id=P-204), [High-priority workload](https://functions.miniup.app/hyperpbi-dynamic-demo/backlog?priority=High) |

Each page offers **Open in Playground** and a live preview. The examples share one public MiniUp Function with three routes. Its [source](../examples/dashboards/dynamic-content-api.mjs) serves synthetic data and generates canonical component JSON at request time.

## Bind a region to an event

```json
{
  "type": "dynamicContent",
  "id": "asset_details",
  "title": "Asset details",
  "emptyText": "Select a work order to see its plan.",
  "trigger": { "source": "assets", "event": "click" },
  "request": {
    "endpoint": "https://functions.miniup.app/hyperpbi-dynamic-demo/asset?id={{context.assetid}}",
    "cacheTtlSeconds": 30,
    "timeoutMs": 10000,
    "fallbackMessage": "The work plan is temporarily unavailable."
  }
}
```

`trigger.source` is a component ID in the same dashboard. A table row or map feature emits `click`. A chart datum selection emits `select`. A `button` emits `click` and a filter control emits `change`. These bindings work alongside authored dashboard interactions and Power BI selections. A source can drive multiple regions. A region can render in a modal opened with the ordinary `openOverlay` UI action.

`{{context.field}}` reads a scalar from the event. Table events supply the clicked row. Chart events supply values shared by all rows for the selected datum and expose `{{context.$value}}` for the chart datum's category or value. Controls expose the selected scalar as `{{context.$value}}`. Map events merge service, Power BI, and joined attributes in that order, with later values winning on a duplicate key. Map context also exposes `{{context.$featureId}}` and `{{context.$layerId}}`. Ambiguous or missing context fields produce a visible binding error. Only strings, finite numbers, and booleans can enter a URL binding.

For a table, a chart with one dataset, or a Power BI layer popup, use the field's canonical alias. Preparation resolves it against the source dataset. For service and joined features, use the resolved attribute name shown in Map Studio.

`{{state.priority}}` reads the current dashboard control or UI action state by ID. It updates the region when the resolved endpoint changes, without needing a `change` trigger. An unset value expands to an empty string and a control's authored `defaultValue` is used when present. Select controls that emit multiple values require a scalar state value before binding. With no trigger the request runs when the component mounts. With a trigger it waits for an event by default. Set `loadOnMount: true` to also load a URL with no `context` bindings on mount. Set `trigger.refresh: true` to bypass the in-memory cache on each trigger event.

## Use a map feature popup

```json
{
  "mode": "dynamic",
  "title": "{{service.name}}",
  "width": 540,
  "maxHeight": 560,
  "request": {
    "endpoint": "https://functions.miniup.app/hyperpbi-dynamic-demo/sensor?id={{context.site_id}}",
    "cacheTtlSeconds": 30
  }
}
```

Place this object in `map.layers[].popup`. In Map Studio select a layer, open **Popup**, and choose **Dynamic Content**. Add the endpoint and use the feature binding picker. Select a **Test feature** to issue the same live request as the map. Popup modes are `none`, `default`, `custom`, and `dynamic`. `width` and `maxHeight` are popup layout properties. The feature's attributes remain available as fallback if the first request fails. For ArcGIS, popup context fields are included in service queries. If a separate dashboard region reads ArcGIS fields from a map click, include those fields in the layer source's `outFields`.

## Return a fragment from an API

```json
{
  "kind": "hyperpbi.fragment",
  "version": "1.0",
  "title": "North pressure station",
  "datasets": {
    "current": [{ "psi": 66.8 }],
    "pressure": [{ "time": "08:00", "psi": 62.4 }, { "time": "09:00", "psi": 61.8 }]
  },
  "components": [
    { "type": "kpi", "id": "pressure_now", "title": "Current pressure (psi)", "dataset": "current", "field": "psi", "aggregation": "first" },
    { "type": "lineChart", "id": "history", "title": "Pressure history", "dataset": "pressure", "category": "time", "measure": "psi", "chartStyle": { "zoom": true, "tooltip": true }, "events": { "zoom": { "enabled": true } } }
  ]
}
```

Serve `application/json` and allow browser CORS. Use `Access-Control-Allow-Origin: *` for public credential-free responses, or allow the relevant browser origins. The live example returns CORS headers on success and on unknown-record errors.

Fragment transport version `1.0` contains dashboard schema `2.0` components. Dataset names start with a letter and can contain letters, digits, underscores, and hyphens. `powerbi` is reserved. Dataset rows contain scalar JSON cells. A component without a dataset uses the first named dataset. Use stable IDs and field aliases across refreshes. Empty datasets have no inferred field metadata, so use static content to describe an empty response.

The response is limited to 1 MiB, 16 datasets, 5,000 total rows, 100 columns per dataset, 100 components, and eight layout levels. Returned components use the shared validation, registry, and dataset pipeline. Charts, KPIs, tables, cards, tabs, and other permitted primitives render with the parent theme. State, interactions, and row identities are local to the fragment. Responses cannot define nested Dynamic Content, maps, global overlays, HTML/custom documents, HTML slots, Mermaid, remote sources, or network permissions. ECharts tooltips stay inside the chart. See the [security guide](security.md) for the host boundary.

## Request lifecycle and permissions

- Requests use anonymous GET with no cookies, custom headers, referrer, or redirects. Tokens are encoded into URL path or query values. The HTTPS origin must be literal. Keep private IDs and credentials out of public requests.
- The browser build permits `https://miniup.app`, `https://*.miniup.app`, `https://miniup.io`, and `https://*.miniup.io` by default. Add approved origins at build time with `HYPERPBI_WEB_REST_HOSTS` for web or `HYPERPBI_MAP_HOSTS` for Power BI.
- Power BI requires the Maps package, a matching packaged `WebAccess` declaration, and runtime permission for the exact origin. CORS still applies after WebAccess approval. Browser previews do not exercise a Power BI tenant's policy.
- A consumer cancels its pending request when dependencies change or it unmounts. Late responses cannot replace newer content. The shared cache retains up to 32 responses per runtime, keyed by resolved URL. TTL ranges from 0 to 3,600 seconds and defaults to 30. Expiration is checked on the next load. Timeout ranges from 1,000 to 15,000 ms and defaults to 10,000.
- Refresh bypasses cache. For the same endpoint, refresh keeps the last successful tree visible and updates its data in place. Stable component IDs retain chart state, including configured zoom and selection. Selecting a different URL clears the previous details while loading. If the request fails, the region shows the error and fallback. After a failed refresh of the same URL, the last successful tree remains visible.

See [interactions](interactions.md), [the specification reference](hyperpbi-spec-reference.md), and [the complete dashboard projects](dashboard-examples.md).
