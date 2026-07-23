# July 2026 analytical map expansion

HyperPBI 2.0 maps now use a unified analytical interaction controller, interactive multi-layer
legends, rich safe icons, a true weighted canvas heatmap, circle selection, compact selection tools,
quick filters, scale/coordinate controls, inline/remote GeoJSON, and generic XYZ tiles.

Existing Power BI, ArcGIS Feature, ArcGIS Tile, ArcGIS Dynamic, popup, label, join, cluster, and
rectangle/lasso specifications remain valid. Legacy `toolbar.rectangleSelection` and
`toolbar.lassoSelection` still enable their tools; new specifications should prefer structured
`tools.rectangleSelection` and `tools.lassoSelection`.

The former heatmap point-symbol fallback is migrated automatically because the existing
`renderer.type: "heatmap"` discriminator is unchanged. Pixels are no longer selectable. Set
`interactivePoints: true` when source-record selection is required.

New bounded controls are opt-in except toolbar Zoom in/out, which replace Leaflet’s built-in zoom
buttons inside the compact HyperPBI toolbar when the toolbar is visible. Authors can set
`toolbar.zoomIn` or `toolbar.zoomOut` to `false`.

The capability registry now classifies accepted schema paths as implemented, partial, experimental,
or unsupported and provides runtime, validation, Studio, documentation, and test ownership.
