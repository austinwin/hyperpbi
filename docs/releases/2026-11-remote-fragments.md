# Remote HyperPBI Fragments — implementation and verification

Remote endpoints can supply `hyperpbi.fragment` 1.0 JSON containing canonical schema 2.0 components and independent datasets. Dynamic GIS Popups fetch, validate and render those components through the existing HyperPBI engine. The changes are recorded in [the full file inventory](2026-11-remote-fragments-files.txt); [machine-readable verification](2026-11-remote-fragments-verification.json) contains timings and step results.

## Implementation and architecture

- `src/fragments/` owns the transport, bounded fetching/cache, canonical preparation and reusable host. No component-specific API renderer, chart library or additional component type was added.
- `HyperPbiRoot`, `DashboardRenderer`, the registry, data workspace and sanitizers render fragments with separate data/state, namespaced IDs, scoped styles and error boundaries. Only validated local state/tab/step actions are allowed. Model actions, nested remote sources/maps, overlays and authored HTML/custom documents are restricted.
- Map Studio exposes none/default/custom/remote modes, feature attribute bindings, live test-feature preview, timeout/cache/fallback/size settings, refresh and expansion. Chart instances and zoom survive expansion; switching features cancels obsolete requests. Model aliases are canonicalized inside endpoint bindings.
- One shared policy declares MiniUp .app and .io apex/subdomain families. Browser builds can add trusted HTTPS origins; Power BI Maps additionally needs valid WebAccess declarations, runtime host permission and endpoint CORS. Returned JSON cannot grant permissions. Core remains network-free.
- The three-sensor **Dynamic GIS Popup — Remote Analytics** gallery entry fetches public repository fixtures and opens as an editable, persistent Playground project. The Next website also supplies CORS-enabled `/api/demo/sensors/1024`, `1025` and `1026` routes. Homepage, examples, Playground and documentation navigation expose the feature.
- Documentation, AI help/prompt sources and generated references use the canonical contract. Link, count, host-claim and executable-response checks run automatically. Screenshots are in `docs/screenshots/`.

Compatible KPIs, metrics, charts, gauges, tables, matrices, cards, detail panels, text/Markdown, safe SVG/images and nested layouts use their current renderers. Compatibility derives from canonical descriptors with explicit exclusions. This release accepts no Power BI identity mapping from a fragment; all fragment interactions remain local. See [the contract and restrictions](../remote-fragments.md).

## Removed implementations

`popup.enabled` and its historical configuration path were removed. Maintained examples and fixtures were converted to canonical modes. The unused `MapPopup.tsx` template renderer and imperative `renderResolvedPopup` renderer were removed; map and authoring previews share `MapPopupDetails`. Duplicate broad/restricted Maps artifact labels were replaced by one canonical Maps package. Unrelated map, custom-builder and dashboard behavior was retained.

## Validation

- **860 unit tests in 173 files passed**, including schema, security, portability, fragment isolation, multi-dataset preparation, attribute bindings, host matching, cache expiry/TTL changes, cancellation, timeout, size limits and invalid responses.
- **57 runtime browser tests and 3 Playground browser tests passed**, including real ECharts interactions, popup switching/expansion, stale-response protection, narrow layouts and save/reload. Two intentional Windows popup screenshot baselines were visually reviewed and refreshed before rerunning the browser suite.
- Runtime, website and Playground typechecks, lint, generated-doc checks, link/count/host-claim validation and executable example checks passed.
- Playground, production Next website, existing Worker distribution, Core PBIVIZ and Maps PBIVIZ builds completed. ZIP capability inspection confirmed Values-only roles, no Core WebAccess and all four MiniUp declarations in Maps.
- The production Next server returned 200 for the homepage, examples, map gallery, Playground and remote-fragment documentation. All three demo API responses returned fragment 1.0 JSON with `Access-Control-Allow-Origin: *`; unknown sensors returned CORS-enabled 404 and OPTIONS returned 204. A production island smoke test rendered the chart, expanded it, opened an editable project and reloaded it successfully.
- [GitHub PR verification](https://github.com/austinwin/hyperpbi/actions/runs/42379446945) passed. Website hosting remains the existing Vercel/GitHub workflow. No ChatGPT Site was created or published.

## Measured verification times

Times are seconds on the same Windows workstation except the explicitly labeled hosted CI rows. Baseline source: `001466e`; runtime/build source: `c73cc1d`.

| Check | Before | After |
|---|---:|---:|
| Focused fast check | No equivalent command | 43.64 |
| Complete unit suite | 155.25 (832 tests) | 180.96 (860 tests) |
| Runtime browser suite | 113.67 (52/53 passed) | 92.42 (57/57 passed) |
| Playground browser suite | Not separately measured | 38.46 (3/3 passed) |
| `npm run web:build` | 88.98 | 62.40 |
| Website plus Worker staging | Not separately measured | 133.37 |
| Playground build | Not separately measured | 47.87 |
| Core packaging | 199.15 | 154.05 |
| Maps packaging | 190.30 | 97.67 |
| Hosted CI | 249 (previous main pipeline) | 209 (new PR pipeline) |
| Local full checkpoint | Not measured as one command | 794.52 |

These are recorded wall times, not controlled benchmarks: cache warmth, machine activity and coverage differ. The baseline browser run hit its old chart-authoring timeout while another build was active. **The complete unit suite did not become faster in the final run.** The main productivity gain is the narrower daily workflow: focused checks omit production builds and packaging, while PR and full levels broaden coverage deliberately. Full validation retains all meaningful tests.

The largest avoidable costs were repeated production builds and packaging in routine verification, jsdom startup for pure computation suites, and unconstrained concurrent browser pages. Fast/PR/full selection, incremental type/lint caches, Node environments for pure suites and two browser workers address those costs. Full verification builds the website once through the existing Worker pipeline and serializes Core then Maps because their temporary capability files share the checkout. CI reuses verified artifacts for upload. The hosted full integration workflow runs on main; its live result is available in [GitHub Actions](https://github.com/austinwin/hyperpbi/actions/workflows/ci.yml).

## Limits

Browser and archive tests do not establish Power BI tenant connectivity, administrator approval or CORS behavior for a user's private endpoint. Secrets, authenticated API headers, redirected requests, model identity mappings and privileged fragment actions are outside this contract. Images/SVG retain the existing sanitizer and asset-host restrictions. Refresh replaces the fragment and resets its local state; expansion preserves it. The public repository demo fixtures become available when the changes reach main.
