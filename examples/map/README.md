# HyperPBI map example gallery

This directory is the source of truth for the dedicated playground route at `/components/map`.
`manifest.json` supplies the navigation, explanation, expected behavior, limitations, Power BI
notes, specification path, and deterministic data path. The playground discovers every `spec.json`
with `import.meta.glob`, so examples are not hardcoded into the page component.

The examples are intentionally focused. They share `data/analytical-points.json` to avoid copying
large datasets, while inline GeoJSON examples keep only the geometry needed to explain the feature.
All specifications are valid HyperPBI 2.0 JSON and are suitable for the **Copy spec** action.

Folders mirror the analytical model:

- `getting-started`, `sources`, `renderers`, and `symbols` cover source and visual encodings.
- `legends`, `interactions`, and `selection` cover the unified analytical interaction controller.
- `heatmap`, `clustering`, `labels`, `popups`, `joins`, and `arcgis` cover focused runtimes.
- `tools`, `performance`, and `advanced` cover operational and combined configurations.

Remote ArcGIS examples require network access and a matching allowlisted provider host. Heatmap
pixels, raster tiles, and dynamic identify results are intentionally not selectable. Rich marker
SVG is sanitized, marker text is escaped, image icons must be HTTPS or relative, and JSON cannot
provide executable JavaScript or arbitrary HTML.
