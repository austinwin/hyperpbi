# Trusted rendering and compact Map Studio

Baseline: `9d35a80a5f22e3e3a564102daf54aaa441f306f3`. The final commit and review link are reported with the delivery. The latest user instruction authorizes committing the completed implementation and distributables to `main`.

## Result

- Explicit trusted HTML/CSS/raw SVG preserve authored browser features behind isolated document or visual boundaries. Standard sanitizers remain the default. Data templates are bound as inert values after parsing, and executable binding positions are rejected.
- The former third-party embedded GIS component, dependency, submodule, build integration, catalog entries and active authoring documentation are removed. Old specifications receive an actionable migration diagnostic. Ignored legacy generated files were moved outside the served and packaged trees into `.tmp` for reversible cleanup.
- The latest UI supplement removes the dedicated MiniUp map workflow. Public resources from `miniup.app`, `miniup.io`, their subdomains and ArcGIS use generic native source adapters. A publisher-neutral `hyperpbi.map` 1.0 manifest supports reusable multi-layer exports, snapshot import and explicit linked refresh with local overrides.
- Native GeoJSON features reuse the existing join engine, stable publisher identity, row lineage and report selection pipeline. Logical datasets reevaluate when report data changes; measures can drive styles and aggregation, while model columns provide identity/filter keys.
- Map Studio uses the existing map engine with a collapsible rail and one floating drawer. Searchable multi-layer contents, scoped runtime commands, contextual categories, anchored colors, labels, supported effects and the popup content builder edit canonical JSON. Viewer controls start collapsed and information cards minimize/close.
- Remote GeoJSON loading deduplicates URLs, bounds payload/cache sizes, aborts stale requests, retains last-good data on failure and pauses hidden layers. ArcGIS feature requests also suspend while hidden, including non-viewport sources.

## Architecture and review pointers

`src/security` owns trusted templates, isolated author documents and visual containment. `src/render/ExternalMount.tsx` mounts explicitly owned content without loading Preact's event compatibility layer. The visual's context provider stays inside its mount; sandboxed documents receive no host bridge.

`src/maps/imports` contains the portable manifest parser, public HTTPS adapter, provenance validation and three-way import/refresh merge. `src/maps/join/mapGeoJsonBinding.ts` adapts native GeoJSON to the existing join engine. `src/components/maps/runtime/useRemoteGeoJsonLayers.ts` owns remote request/cache lifecycle. `src/maps/interactions/mapStudioCommands.ts` coordinates the single map preview using a per-Studio channel.

Popup schemas and validation live in `src/maps/popup`; `MapPopupContent.tsx` is shared by native information cards and resolved popups. The compact rail, categories, layer-origin presentation, popup builder, color picker and effects controls are separate modules under `src/editor/map-studio`. The existing renderers, selection infrastructure and one flattened Power BI Values data view remain the analytical foundation.

See [the changed-file inventory](2026-11-map-studio-files.txt), [Map Studio guide](../map-studio.md), [manifest contract](../map-imports.md), [security boundaries](../security.md#trusted-author-documents), [native example specification](../../examples/map/published-map-powerbi.json) and [example data](../../examples/map/published-map-powerbi.csv).

## Verification

The shared TypeScript and web checks, all 818 unit tests in 166 files, lint, generated-documentation check, production web build, Playground typecheck/build and both browser suites pass. Browser verification passes 42 main cases plus two Playground cases. Ten Windows Chromium screenshot states cover the compact viewer, layers, styling, color picker, classifications, labels, popup builder, feature card and narrow authoring layout.

Core, Maps and restricted Maps are packaged sequentially. `package:verify` opens each PBIVIZ and verifies the Values-only role and exact WebAccess capabilities against its profile manifest. Core has no WebAccess. Default packaging no longer uses certification-driven code stripping; the explicit certification audit command remains available. Both Maps labels use concrete HTTPS host declarations; neither emits an unsupported all-host wildcard. The packaged default hosts include MiniUp app/io roots and subdomains, ArcGIS/ArcGIS Online families and existing basemap/geocoder hosts. Additional organization services require `HYPERPBI_MAP_HOSTS` at build time.

Built PBIVIZ archives, the Playground distribution and browser runtime assets are committed with a SHA-256 build manifest. Next.js build caches, dependency folders, temporary files and local test traces are excluded. Exact command outcomes are recorded in the final delivery.

## Limits and compatibility

No actual Power BI Desktop/Service report or tenant was available for this verification. Browser tests simulate report-date updates and selection callbacks; target-host permissions, identity behavior and semantic-model relationships still require report validation. The visual cannot independently query arbitrary model tables or create model relationships. Features without matching report lineage cannot generate identities. Measures cannot become basic-filter column targets.

Public remote resources require HTTPS, CORS, allowed build/host origins and tenant permission. Private/token-bearing map exports are unsupported. No live MiniUp publication URL was supplied; fixtures validate the generic export adapter without claiming a production account/discovery API. Tile services are display only; dynamic services offer read-only identify. GeoJSON is a bounded client-side dataset; large spatial datasets should use FeatureServer viewport loading.

Trusted author scripts execute only inside an opaque-origin iframe and cannot invoke report services. CSP, external frame restrictions, resource permissions and browser behavior may still prevent authored resources from loading. Raw trusted SVG is separate from the structured SVG interaction renderer. Standard-mode behavior is covered by existing security regressions.

Removed component specifications require manual GeoJSON/ArcGIS export and native map reconstruction. Published map format 1.0 is an explicit interoperability contract, not an arbitrary website converter. Refresh preserves local edits through baseline comparison; changed publisher IDs require a new import. Screenshot baselines use Windows fonts; other platforms run geometry/functional assertions and save images. No ArcGIS reference screenshots were present in the supplied attachments, so no pixel comparison or product-wide superiority claim is made.

Production builds retain existing large chart/spreadsheet/diagram chunks. Vite reports chunk-size guidance; this does not prevent successful packaging. The installed Node version is 22.10.0, below the repository's declared 22.13 minimum; the recorded commands nevertheless complete on this machine. Use a supported Node release in CI and production.
