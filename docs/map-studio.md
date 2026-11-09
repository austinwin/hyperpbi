# Compact Map Studio

Map Studio uses the same native Leaflet renderer as the report viewer. The map fills its workspace. A collapsible 40px tool rail and one floating drawer provide authoring controls; opening another drawer replaces the current one. Resize the drawer horizontally on desktop. In a narrow visual it is clamped inside the map, and closing it restores the full map surface.

## Layers and sources

Open Layers to search names, toggle visibility, select multiple layers with Ctrl/Cmd, change order, or open layer settings. Origin badges distinguish Power BI, imported definitions, GeoJSON and ArcGIS sources. Loading, feature counts and failures appear beside the affected layer. The overflow menu contains duplicate, move and delete actions.

Add source supports native Power BI geometry, inline or public GeoJSON, ArcGIS feature/tile/dynamic services, XYZ tiles and a generic published-map definition. MiniUp resources use the same public network adapters as other publishers. See [published maps](map-imports.md) for the versioned export contract, snapshot import and controlled linked refresh.

## Layer settings

The active layer selector stays at the top of the drawer. Categories are Data, Style, Labels, Popup, Filter, Effects, Interactions and Advanced. The last category is remembered separately for each layer during the Studio session. Advanced contains relationships, legend, tooltip, performance and diagnostics. Text fields draft locally and commit on blur or Enter; Escape restores the saved value. Valid edits update the canonical JSON and shared preview in one undoable transaction. Invalid edits leave the last valid preview intact.

Color swatches open a compact anchored picker with presets, HEX, opacity, recent colors and reset. Color changes apply immediately. The picker stays within the visual and closes on Escape or outside click. Effects exposes supported transparency and selection dimming. The Leaflet renderer does not advertise unsupported bloom or GPU effects.

## Popup content

Use Add Content in Popup to add formatted fields, text, images, HTTPS links, declarative action buttons, small field comparison charts or conditional sections. Set precision, units and date format on field blocks. Conditions and conditional colors read explicit service, Power BI or joined fields. Reorder blocks with drag or the up/down buttons. Preview by selecting an actual feature in the native map. Images and links require public HTTPS resources; buttons use existing HyperPBI actions and cannot execute arbitrary scripts.

## Viewing and interaction

Viewer tools start collapsed. Expand them for layers, legends, loaded-feature search, configured location search, selection tools, bookmarks and reset. Feature details are bounded inside the visual and can be minimized or closed. A map selection uses the existing row lineage and Power BI selection/filter pipeline. A joined feature with no matching report rows cannot manufacture a Power BI identity. Tile layers are display only; dynamic map layers offer read-only identify.

## Reproducible example and verification

Open [published-map-powerbi.json](../examples/map/published-map-powerbi.json) with [its CSV](../examples/map/published-map-powerbi.csv), or import [the two-layer manifest](../examples/map/published-map.json). The example combines a report layer and published point/polygon layers, a column-key join, measure aggregation and formatted popup content.

`tests/browser/map-studio-compact.spec.ts` verifies wide/narrow drawers, categories, immediate colors, popup content, save/reload, collapsed viewer tools and information cards. Ten reviewed Windows Chromium screenshots are stored beside the test. Other platforms retain functional geometry assertions and emit screenshots without comparing platform-specific fonts. `published-map-runtime.spec.ts` separately verifies report-date filtering and feature-to-row selection with a simulated host. Actual Desktop/Service tenant permissions and semantic-model relationships require validation in the target report.

## Dynamic Content

Under **Popup**, choose **Dynamic Content**, enter the public HTTPS endpoint, and insert a `{{context.field}}` binding. Choose a **Test feature** to issue a live request. Request timeout, TTL, fallback text, and popup size are under **Request, fallback and size**. [Dynamic Content guide](remote-fragments.md).
