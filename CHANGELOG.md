# Changelog

## Interactive 3D scenes

- Show data-bound water levels on selectable tanks and add signed pipe flow animation with pause and reduced-motion controls. The groundwater dashboard links its Clearwell gauge to a level KPI and trend and colors running pumps green and stopped pumps red.

- Keep the camera idle during selection and release drag state when the pointer is lifted. Add a Groundwater Supply & Distribution dashboard with local and remote wells, a treatment plant, and three residential service points.

- Add a locally bundled Three.js component and visual Scene editor to Core, Maps, and the Playground.
- Bind scene objects to dataset rows for status, tooltips, visibility, and linked selection. Import bounded, self-contained GLB and glTF files.
- Add the portable Pump Station Monitoring dashboard with scenario controls, synthetic readings, and linked equipment, KPIs, charts, and records.

## Dynamic Content

- Add event-driven dashboard regions and overlays. Map popups use the same request and fragment renderer.
- Bind endpoints to table and map clicks, chart selections, button clicks, and filter state. Keep charts mounted on same-URL refresh and scope overlay state to each dashboard root.
- Publish two editable dashboards that fetch station telemetry, work plans, and workload from MiniUp.

## 2026-11-07 — Remote HyperPBI Fragments

- Add validated fragment transport 1.0 using canonical schema 2.0 components, isolated data/state, scoped IDs/styles and restricted local actions.
- Add canonical none/default/custom/remote GIS popups, a Map Studio endpoint/binding/test-feature workflow, cancellation, bounded JSON, TTL caching, refresh and expansion that retains chart state.
- Unify MiniUp .app/.io host families across browser, remote sources, GIS and Maps WebAccess; preserve network-free Core and require CORS/runtime host permission.
- Add a three-sensor remote analytics demo, public CORS-enabled fixture API, editable gallery projects, website feature links, copyable responses and browser screenshots.
- Replace unused popup renderers with one shared Preact body; convert maintained fixtures and generated AI documentation to the canonical model.
- Add fast/PR/full verification levels, pure Node unit environments, incremental caches, controlled browser workers and separate PR/integration CI. Build website and each package profile once per full checkpoint.
- Publish one canonical Maps artifact and archive capability checks for both domain families. See [implementation and verification](docs/releases/2026-11-remote-fragments.md).

## 2026-11-06

- Add shared visual chart configuration for axes, independent combo series, automatic/fixed ranges, formatting, labels, gradients, annotations, thresholds, zoom and animation.
- Validate declarative ECharts options through an allowlisted, bounded policy. Preserve generated semantic data and field lineage; escape built-in tooltip text.
- Add searchable component creation from metadata, field-aware template binding, property search/reset and immediate Inspector preview.
- Extend compact Map Studio with fit-to-layer, source-aware styling suggestions, inline GeoJSON category generation and native WMS raster authoring. Fix omitted raster options overriding Leaflet defaults.
- Disable authored scripts/event handlers in trusted HTML/SVG while retaining static markup and CSS isolation, following the updated safety requirement.
- Retain the existing component registry, ECharts and Leaflet engines, schema 2.0, report interactions and explicit Core/Maps network profiles. No new component type or runtime AI service is added.
