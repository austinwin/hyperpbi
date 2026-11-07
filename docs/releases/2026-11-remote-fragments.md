# Remote HyperPBI Fragments — implementation and verification

Remote endpoints can supply `hyperpbi.fragment` 1.0 JSON with canonical schema 2.0 components and independent datasets. Dynamic GIS Popups use the existing renderer, ECharts adapters, data engine and sanitizers. Map Studio offers none/default/custom/remote modes, feature bindings, live preview and bounded request/fallback/size settings. The map gallery includes **Dynamic GIS Popup — Remote Analytics**, three deterministic pressure-sensor responses and a public Next.js GET route with CORS headers. The example opens as an editable, saved Playground project.

The runtime namespaces component IDs, scopes data/state/styles, blocks external model actions and privileged UI actions, bounds trees/rows/response sizes, cancels obsolete requests and caches completed responses. Both MiniUp apex/subdomain families share one host list with packaging. Generic HTTPS endpoints require build-time approval; Power BI additionally requires Maps WebAccess and endpoint CORS. No Power BI tenant test is implied by browser or package verification.

The old `popup.enabled` model, unused template-only popup module and unused DOM popup renderer have been removed. Built-in popup bodies now share a Preact component. All repository examples and fixtures use the canonical mode contract. Generated documentation comes from metadata and AI-help sources. Remote fragments explicitly restrict nested maps, remote sources, overlays, authored HTML/custom documents and global panels; the existing compatible component library is reused without adding another component type.

The release adds `verify:fast`, `verify:pr` and `verify:full`, incremental type/lint caches, Node environments for pure unit suites, controlled browser workers and change-based verification. Full website verification builds Next once through OpenNext before Worker staging. Core and Maps packages are serialized and archive-verified once each. Redundant broad/restricted Maps artifact labels are replaced by the single canonical Maps artifact.

## Verification measurements

Measurements use the same Windows workstation. Baseline source: `001466e`. Initial baseline unit run: **832 tests in 155.25 seconds**; website build: **88.98 seconds**; Core package: **199.15 seconds**; Maps package: **190.30 seconds**. The isolated baseline browser suite completed in **113.67 seconds with 52 of 53 tests passing**; chart authoring exceeded its old 30-second timeout while another build was active. It is not a clean browser speed benchmark. A separate initial browser run overlapped changing files and is excluded from comparisons.

The existing successful main GitHub Actions run [42321849643](https://github.com/austinwin/hyperpbi/actions/runs/42321849643) took **249 seconds** from start to update. Hosted CI timing is separate from local timing; no estimate is presented as a measurement. Final verification timings, results and publication status are recorded after the integration checkpoint.

See [Remote fragments](../remote-fragments.md) for executable JSON, restrictions, cache semantics, API/CORS details and troubleshooting, and [Development verification](../development-verification.md) for the impact matrix. Screenshots are captured by the real browser integration tests in `docs/screenshots/`.
