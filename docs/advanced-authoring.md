# Visual chart and map authoring

Open Visual Inspector to create and configure existing components. The searchable picker uses component metadata and field traversal to seed an existing template with received fields. Review suggestions before using them. The field list shows aliases, display names, primitive type, column/measure provenance and received aggregation metadata; the visual does not alter the Power BI query's aggregation.

Chart configuration stays in the existing Inspector, with Data, Series, Axes, Appearance, Labels & Tooltips, Interactions and Advanced categories. Controls are shared metadata, not separate editors for each chart type. Unsupported controls are hidden for the selected series family. Search finds properties, reset removes an override, and Undo/Redo uses the shared specification history. Invalid candidates identify the property and keep the previous valid preview. Advanced JSON stays available in its collapsed section.

## Axes and series

Use a combo chart to bind independent line/bar series, choose their aggregations and place each on the left or right Y axis. Existing field lineage and selection bindings are retained. The automatic axis range uses ECharts `scale: true`; values near 50–60 need not force zero. Data range uses `dataMin`/`dataMax`. Fixed ranges require minimum < maximum. Axis precision, units, date format, rotation, label density and grid lines are ordinary controls.

`chartStyle` is optional in schema 2.0. Omitted values retain the existing chart behavior. The runtime applies it after safe existing `options` and generated chart data. Its `xAxis`, `yAxis` and `series` arrays address existing generated objects by index; they do not add series or replace data. Use the combo chart's `series` bindings to add series. Advanced charts can still use validated ECharts axes/datasets where applicable.

```json
{
  "type": "comboChart", "id": "quality", "category": "date",
  "series": [
    {"field": "temperature", "label": "Temperature", "chartType": "line", "aggregation": "avg"},
    {"field": "rainfall", "label": "Rainfall", "chartType": "bar", "aggregation": "sum", "axis": "right"}
  ],
  "chartStyle": {
    "xAxis": [{"dateFormat": "iso", "rotate": 20}],
    "yAxis": [{"domain": "auto", "decimals": 2}, {"domain": "zero", "suffix": " mm"}],
    "series": [{"color": "#2563eb", "smooth": true, "referenceLines": [{"value": 55, "label": "Target"}]}, {"color": "#0f766e", "gradientEnd": "#99f6e4", "opacity": 0.75}],
    "tooltipDecimals": 2, "legend": true, "zoom": true
  }
}
```

Series controls include supported symbols, line styles, smoothing/steps, stacking, gradients, labels, reference lines/bands and numeric thresholds. Threshold colors apply to data items such as bars and point symbols. They do not imply arbitrary geoprocessing or custom JavaScript renderers. Animation, zoom, plot margins and no-data text are available. Existing chart adapters still implement gauge, waterfall, treemap, heatmap, funnel, Sankey and radar semantics.

## Safe options and compatibility

ECharts `options` uses an allowlisted vocabulary, finite primitive values, bounded depth/node/array counts and supported series types. Unknown keys, functions, executable formatter source, unsafe markup, URL-bearing properties and external URLs are rejected during schema preparation and stripped with diagnostics at the defensive runtime boundary. Native semantic data, axis bindings and row identities cannot be replaced through presentation overrides. Formatting callbacks are library-owned implementations of declarative settings. Built-in HTML tooltip text is escaped.

Existing schema 2.0 examples are regression-tested. Authored option arrays and advanced-chart row limits report incomplete data explicitly. Power BI data windows and host identity limitations remain applicable. Browser tests use 1,200 received readings, independent axes, automatic domains, precision/date controls, live preview, save/reload and report-date updates. Actual Power BI Desktop/Service behavior still requires validation with the target report and tenant.

Load the [complete example specification](../examples/specs/advanced-chart-authoring.json) with [1,200 sample readings](../examples/data/advanced-chart-authoring.csv). It demonstrates logical daily aggregation, the visual presentation model and a validated advanced ECharts alternative with independent axes.

## Map Studio

The map remains dominant with a narrow collapsible rail and one contextual drawer. Layer actions include fit-to-layer, duplicate, remove and keyboard/drag reorder. Style suggestions use the selected source's field namespace. Inline GeoJSON categories can be generated from actual feature properties. Existing labels, popup content builder, filtering, clustering, heatmap, classification, joins and selection infrastructure remain in use. See [Map Studio](map-studio.md).

WMS uses native Leaflet raster support within the existing XYZ source adapter:

```json
{"type":"xyz","url":"https://YOUR-APPROVED-HOST/WMSServer","wms":{"layers":"0","version":"1.3.0","format":"image/png","transparent":true}}
```

Add source → WMS raster service exposes the URL, server layer names, named styles, protocol version, image format and transparency. Unconfigured raster drafts show warnings and perform no requests. WMS is display only: it supplies no Power BI identities, client joins or feature popup records. Vector tiles require a decoder and remain unsupported; use a published raster service, FeatureServer or GeoJSON. Custom hosts require declared Maps WebAccess and CORS. The [public USA sample](../examples/specs/wms-reference-map.json) was checked against the service's GetCapabilities response; browser tests use deterministic raster responses.

## Security and certification

The latest safety requirement disables authored scripts and event handlers in all modes. Trusted static HTML/SVG preserve markup in an opaque-origin iframe without `allow-scripts`; CSS containment remains separate. No JavaScript execution component, runtime AI dependency, host-object bridge, `eval`, or `new Function` is introduced.

Core has no WebAccess. Maps declares only specific HTTPS host families, including MiniUp app/io and ArcGIS; tenant policies still apply. These packages are **not claimed to be Microsoft certified**. External maps/resources, optional trusted external content and the full dependency/code review remain certification considerations. Microsoft certification tests include checking access to external services/resources. See [Microsoft's certification requirements](https://learn.microsoft.com/en-us/power-bi/developer/visuals/power-bi-custom-visuals-certified).

The [metadata audit](advanced-authoring-audit.json) covers all 83 active registered components and their canonical examples. The earlier authorized GeoLibre removal accounts for the difference from the previous 84-component inventory. This work adds zero component types and preserves the remaining registry and schema version.
