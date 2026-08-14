# GeoLibre GIS workspace

The `geolibre` component embeds the authentic GeoLibre browser application as a governed HyperPBI 2.0 component. Use it when a report needs a real GIS workspace—project authoring, layer management, GIS styling, advanced browser-safe spatial formats, or geoprocessing—not merely a lightweight analytical map.

HyperPBI pins GeoLibre **2.5.0** at upstream revision **`65073e7512703b0819062fe896fe44d27a3f6a28`**. The native GeoLibre project format at that revision is **`0.2.0`**. The pristine upstream source is the `vendor/geolibre` Git submodule; `@geolibre/embed` is an exact `2.5.0` dependency.

## Choose `map` or `geolibre`

| Need | Component |
|---|---|
| Compact Power BI analytical map, ArcGIS reference layer, dashboard legend, spatial selection, or Map Studio | `map` |
| Full GeoLibre toolbar, map canvas, layer panel, style panel, native project editing, GIS formats, or GIS processing | `geolibre` |

Existing `map` JSON and rendering are unchanged. A report can use both components. GeoLibre is deliberately not an alias for `map` and does not replace HyperPBI’s Leaflet analytical runtime.

## Minimal component

```json
{
  "type": "geolibre",
  "id": "gis_workspace",
  "title": "GIS workspace",
  "span": 12,
  "heightMode": "fixed",
  "height": 520,
  "capabilityProfile": "powerbi-embedded",
  "runtime": {
    "channel": "managed",
    "panels": "open",
    "theme": "system"
  }
}
```

Omit `project` to start from HyperPBI’s validated native default. `heightMode` is `fixed` or `fill`; fixed `height` is bounded from 280 through 2,400 pixels. Fill mode requires a bounded fill-height parent. The host observes the actual frame shell and updates the iframe only when its rounded dimensions change.

`runtime.channel` is `managed` by default. It uses the canonical `https://www.hyperpbi.com/geolibre/index.html` deployment and retries `https://web.geolibre.app/` once when the managed runtime cannot complete its bounded handshake. `official` selects that public fallback directly. Both URLs enter GeoLibre’s native `?embed=1` mode. `capabilityProfile: "viewer"` requests GeoLibre’s viewer layout and hides HyperPBI authoring controls; `powerbi-embedded` retains the normal authoring GUI allowed by the locked managed profile. A failed fallback remains a visible error; a late iframe load cannot return the component to an indefinite loading state.

## Power BI-backed layers

Power BI data enters GeoLibre as ordinary native GeoJSON layers. The binding owns data and row identity; GeoLibre owns presentation such as name, order, visibility, opacity, and style.

```json
{
  "type": "geolibre",
  "id": "facilities_gis",
  "height": 600,
  "powerBi": {
    "layers": [
      {
        "id": "facilities",
        "title": "Facilities",
        "dataset": "powerbi",
        "geometry": {
          "latitudeField": "latitude",
          "longitudeField": "longitude"
        },
        "fields": ["facilityName", "status", "workOrderCount"],
        "visible": true,
        "opacity": 1
      },
      {
        "id": "districts",
        "geometry": {
          "type": "geojson",
          "field": "districtGeometry"
        },
        "fields": ["districtName"]
      }
    ],
    "selection": {
      "enabled": true,
      "externalHighlight": true,
      "maxSelectionCount": 1000
    }
  },
  "interaction": {
    "enabled": true,
    "trigger": "click",
    "internalMode": "highlight",
    "internalScope": "all",
    "externalMode": "selection",
    "selectionMode": "replace",
    "multiSelect": true
  }
}
```

A layer can bind either numeric latitude/longitude aliases or one GeoJSON geometry alias. Invalid coordinates and malformed geometry are skipped with a visible bounded warning. HyperPBI caps all injected layers at 100,000 features per component and does not invent missing datasets or geometry.

Runtime layer IDs use the reserved `hyperpbi-powerbi-` prefix. Deterministic feature IDs are hashes; Power BI row keys and identities are never placed in GeoJSON attributes. A private in-memory map retains each feature’s original contributing row indices and keys, including logical-dataset lineage.

When GeoLibre reports a selection, HyperPBI resolves the complete feature set to the original source rows and submits one identity-safe Power BI replace selection through the normal interaction controller. Selections from native-only GeoLibre layers stay local. Selected rows from Power BI or another HyperPBI component are sent back through the versioned embed API as external feature highlights when that API is available.

## Native project persistence

The `project` property is a versioned HyperPBI envelope around an otherwise native GeoLibre project:

```json
{
  "bridgeVersion": 1,
  "formatVersion": "0.2.0",
  "geolibreVersion": "2.5.0",
  "upstreamRevision": "65073e7512703b0819062fe896fe44d27a3f6a28",
  "document": {
    "version": "0.2.0",
    "name": "Facilities GIS",
    "mapView": {
      "center": [-97.7431, 30.2672],
      "zoom": 10,
      "bearing": 0,
      "pitch": 0
    },
    "basemapStyleUrl": "https://tiles.openfreemap.org/styles/liberty",
    "basemapVisible": true,
    "basemapOpacity": 1,
    "layers": [],
    "styles": {},
    "preferences": {},
    "metadata": {}
  }
}
```

GeoLibre parses and normalizes every host load through its native project parser. It sends debounced native state snapshots after project changes. HyperPBI validates each snapshot, preserves native map view, basemap, native layers, styles, preferences, legends, story maps, models, processing history, widgets, layouts, comments, and metadata supported by the pinned revision, then updates the Studio draft.

Live Power BI feature collections, source-row identity, `sourcePath`, and transient `timeFilter`/`embedFilter` state are not stored in dashboard JSON. Presentation on the corresponding layer remains. At render time, HyperPBI rehydrates the layer from the current Power BI data, so an exported/imported specification or `.hyperpbi` project does not contain stale semantic-model rows.

Studio shows GeoLibre status plus **Revert** and **Reset project**. Native GeoLibre undo/redo remains authoritative for fine-grained GIS actions. HyperPBI coalesces the live GeoLibre session into one specification-history transaction, so map movements and style snapshots do not consume the whole dashboard history. Saving through the usual Studio path persists the current project; Playground project export/import and normal JSON export/import work because the project is part of the specification. In viewer mode, GeoLibre changes are transient because no authoring persistence callback is installed.

The native GeoLibre Project menu remains available for its standard project import/save/export workflow. Imported state still crosses the same HyperPBI persistence sanitizer before it can enter the dashboard draft.

## Runtime isolation and capability profile

GeoLibre runs in an iframe, not in HyperPBI’s Preact tree. Its React version, CSS, MapLibre stack, workers, and GIS dependencies are therefore not bundled into the PBIVIZ JavaScript or allowed to collide with existing HyperPBI components. Existing `map` code paths remain unchanged except that fill/aspect layout recognizes `geolibre` as another fixed-canvas surface.

The frame permits scripts, same-origin application behavior, forms, downloads, and modals required by the trusted pinned app. It does not permit popups or top navigation, and explicitly denies camera, microphone, geolocation, and clipboard permissions. Messages are accepted only from the exact iframe window and resolved runtime origin. A runtime version other than 2.5.0 is rejected.

The managed `admin-profile.json` is locked at the advanced level. It preserves the core Project, Add Data, layer, style, map, and browser-safe processing UI while hiding plugin management, credential/environment settings, collaboration/share/export-HTML, AI/provider tools, Python/notebook tools, device capture, geolocation/GPS, diagnostics/update, PostgreSQL, video, and high-risk bundled plugins.

The project sanitizer additionally rejects:

- JavaScript or other executable URL schemes, executable keys, handlers, modules, and unsafe HTML;
- credentials, authorization headers, tokens, API keys, secret values, and nonempty environment variables;
- absolute filesystem paths and non-HTTPS remote URLs (localhost HTTP is allowed for development);
- external plugin manifests, saved plugin activation, plugin settings, and plugin control placement;
- unknown top-level fields, incompatible versions/revisions, duplicate layer IDs, cycles, non-JSON values, excessive nesting/node counts, and projects larger than 12 MiB.

GeoLibre’s upstream project-plugin trust prompt still protects a project opened directly inside the GUI; HyperPBI never persists plugin execution state. Desktop/Tauri APIs are not exposed by the browser build.

## Package and deployment behavior

Power BI requires the **Maps** PBIVIZ profile because `geolibre` loads an external frame. The Maps profile declares exact access for the apex and canonical `https://www.hyperpbi.com` hosts plus the official fallback `https://web.geolibre.app`, in addition to existing map hosts. Core retains no WebAccess and existing Core behavior is unchanged.

The Vercel and Sites production builds generate the managed runtime at `apps/web/public/geolibre` and load its explicit entrypoint at `/geolibre/index.html`. Using the canonical `www` origin and concrete file avoids cross-origin and framework trailing-slash redirects while the runtime's asset base remains `/geolibre/`. Generated assets are ignored; the pinned source is the reproducible artifact.

### Measured bundle impact

The pinned upstream production output contains 808 files; HyperPBI adds one provenance manifest, for 809 staged files totaling 116.7 MiB. Its generated asset inventory is 448 JavaScript files totaling 59.92 MiB, 31 CSS files totaling 0.95 MiB, and 12 WASM files totaling 48.43 MiB. Eight worker-named JavaScript assets account for 0.38 MiB of the JavaScript total. The largest individual file is `geolibre-cli-*.wasm` at 22.72 MiB, below the enforced 25 MiB ceiling. The browser loads these assets on demand; they are not all part of the initial request.

A three-run headless Chromium benchmark using fresh contexts, blocked service workers, and a loopback static server averaged 2.74 seconds until the normal **Project** toolbar control became visible (2.08 seconds to the load event), 136 resources, and 26.61 MiB of encoded response bodies. This is a local reproducibility measurement, not a production-network service-level target.

GeoLibre remains outside the PBIVIZ JavaScript bundle. Compared with the checked-in package baseline, the rebuilt Core archive changed from 1,110,157 to 1,129,022 bytes (+18,865 bytes, +1.70%), while the broad Maps archive changed from 1,139,561 to 1,078,280 bytes (-61,281 bytes, -5.38%). Archive compression and the packaging toolchain affect these totals; the separately hosted 116.7 MiB GeoLibre site is the meaningful GIS payload.

At this pin, a clean upstream install reports 17 high-severity and zero critical npm audit findings in transitive GIS dependencies; several currently have no upstream fix. The lite build also reports direct `eval` inside upstream `dggal`. HyperPBI accepts no executable state from dashboard JSON, and the locked profile hides plugin, scripting, AI, and Notebook surfaces, but these upstream supply-chain findings still require review on every pin update. JupyterLite is intentionally not built because Notebook is disabled by the profile.

```powershell
git submodule update --init --recursive
npm ci
npm run geolibre:build
npm run web:sites:build
```

`geolibre:build` verifies both upstream version and commit, installs the submodule lockfile, runs GeoLibre’s lite browser build with `GEOLIBRE_APP_BASE=/geolibre/`, enables the upstream parent-window handshake required by Power BI Desktop’s non-enumerable sandbox origin, copies the locked profile, and writes a build manifest. GeoLibre still rejects messages not sent by the direct `window.parent`. `geolibre:build:cached` skips the submodule install for a validated local cache, while `geolibre:ensure` reuses a valid staged runtime or rebuilds it when missing. The Next.js package runs that ensure step before every production build so a deployment cannot silently publish the site without `/geolibre/index.html`.

## Updating the pin

An upstream update is an explicit compatibility change:

1. Fetch GeoLibre and inspect the intended upstream commit and release notes.
2. Check out that exact commit in `vendor/geolibre`; never track a floating branch at build time.
3. Update the exact `@geolibre/embed` dependency if the public client version changes.
4. Update the version/revision constants in `src/components/geolibre/types.ts` and `scripts/build-geolibre-runtime.mjs`.
5. Audit the native project type/parser, `useEmbedBridge`, embed API, UI-profile IDs, browser/Tauri guards, plugin trust flow, and build base-path behavior.
6. Update the strict top-level project allowlist and envelope format only for reviewed native fields.
7. Run `npm run geolibre:build`, all focused GeoLibre tests, full HyperPBI tests, type checks, lint, docs check, web builds, and both PBIVIZ package profiles.
8. Commit the new gitlink, lockfile, compatibility tests, and documentation together.

The adapter intentionally fails closed on a version, revision, or project-format mismatch. That makes an upstream change visible during review instead of silently corrupting saved projects.

## License

The pinned upstream GeoLibre source is licensed under the MIT License; its copyright and full license text remain in `vendor/geolibre/LICENSE`. HyperPBI does not copy or rewrite the upstream application source—the Git submodule and generated deployment artifact preserve its provenance.

## Current limitations

- GeoLibre is a beta, advanced component and requires a connected Maps package in Power BI.
- Power BI supplies one visual data view; `powerBi.layers` can use HyperPBI logical datasets but cannot independently query arbitrary semantic-model tables.
- External selection exists only for injected Power BI layers. Native GIS layers have no Power BI identity unless they are represented by a bound layer.
- Credential-bearing services, external project plugins, desktop-only features, collaboration, device capture, and arbitrary local filesystem access are deliberately unavailable.
- A managed runtime must be staged alongside the website; use `runtime.channel: "official"` only as an explicit fallback and retain the exact-version check.

See also [Analytical maps](maps.md), [Interactions](interactions.md), [Security](security.md), and [Architecture](architecture.md).
