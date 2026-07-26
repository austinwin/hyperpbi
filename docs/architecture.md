# HyperPBI architecture and unified website

HyperPBI is one declarative analytics system with multiple hosts. HyperPBI 2.0 is the only dashboard schema; neither the unified website nor its embedded Playground introduces a second format.

```text
AI / Visual Editor / JSON / Templates
                  ↓
         HyperPBI 2.0 Specification
                  ↓
        Shared HyperPBI Runtime
                  ↓
       Power BI Host | Web Host
```

## Shared runtime boundary

Shared TypeScript under `src` owns schema preparation, canonical field resolution, calculated fields, logical datasets, reference validation, sanitization, Studio, rendering, component state, interactions, maps, tables, charts, and SVG. `apps/playground` supplies reusable Preact project, authoring, play-mode, file-import, and browser-host surfaces. `apps/web` owns the Next.js application shell, shared navigation, content routes, server-side manifest loading, and the runtime-island boundary that mounts those Playground surfaces without duplicating the renderer.

Runtime settings moved to `src/runtime/runtimeSettings.ts`, so Studio and rendering do not need Power BI formatting APIs. Host behavior is expressed by `HyperPbiHostBridge`:

- `PowerBiHostBridge` delegates identity selection, JSON filters, and safe URL launching to Power BI while preserving existing interaction diagnostics.
- `BrowserHostBridge` allows the shared internal interaction engine to keep working but returns an explicit unsupported result for Power BI-only selection and external filtering.

No bridge evaluates specification strings, runs arbitrary JavaScript, or bypasses the existing URL, HTML, CSS, SVG, JSON, map-provider, or chart-option policies.

## Unified web host

The public site is one Next.js application:

| Route | Purpose |
|---|---|
| `/` | Product introduction and primary workflows |
| `/components` | Searchable Component Explorer generated from canonical component metadata |
| `/playground` | Local project creation/import and links to project authoring and Play Mode |
| `/examples` | Manifest-driven complete dashboards plus the analytical map gallery |
| `/docs` | Repository Markdown documentation with shared site navigation |

The Next.js pages own navigation and content composition. Interactive HyperPBI surfaces are compiled into a browser runtime island and mounted only where a page needs the shared Preact renderer or Playground workflow. IndexedDB remains browser-local; server-rendered pages do not receive uploaded project data.

## DataWorkspace

`DataWorkspace` contains a stable default source ID and named `DataSource` records. `powerbi` resolves to the default source in every host. Power BI creates one source. The Playground creates one source for each CSV and one for each XLSX sheet. Logical dataset definitions may use an uploaded source ID as their input and may chain normal declarative operations from that source.

Uploaded data processing is deterministic:

- original headers remain display names; keys are deterministic aliases with stable collision suffixes;
- duplicate and blank headers receive separate keys;
- blanks become `null`;
- leading-zero identifiers stay text;
- Boolean, number, date, datetime, latitude, longitude, and geometry inference is conservative;
- row keys hash the source seed, canonical row values, and duplicate occurrence;
- formulas are never evaluated and formula cells are imported as `null`;
- CSV quoting/newlines are parsed locally and workbook sheets are read in a Web Worker;
- file, row, and cell limits fail the whole source with a visible error—rows are never silently truncated.

Joins, relationships, DAX, Power Query, SQL, and network data sources are out of scope.

## Local project persistence

`IndexedDbProjectStorage` is the repository-owned implementation of the host-neutral `ProjectStorage` interface. Each project stores metadata, a canonical 2.0 specification, Runtime Configuration, Studio layout/drafts, source manifests, normalized field metadata, rows, and row keys. A cloud implementation can satisfy the same interface later without changing Studio or the renderer.

The `.hyperpbi` format is a complete local project bundle. Import validates the bundle marker/version, workspace invariants, Runtime Configuration, schema 2.0, datasets, and field bindings, then assigns a new project ID. It is not the same thing as portable dashboard JSON: it includes local data and editor state that Power BI does not consume.

## Power BI portability

Every Power BI-oriented export runs `analyzePowerBiPortability`. Results are:

- `compatible`: the specification already uses the portable `powerbi` source;
- `compatible-after-default-source-rewrite`: explicit references to only the selected default browser source can be safely rewritten to `powerbi`;
- `not-fully-portable`: the project needs independent uploaded sources, browser-only behavior, invalid/missing bindings or aliases, or another dependency that one Power BI data view cannot satisfy.

The rewrite changes only dataset inputs equal to the selected default source ID. It never rewrites or merges a genuinely separate source. Warnings also call out external filter actions whose fields must resolve to real Power BI model columns.

## Playground versus an HTML application platform

The Playground is an authoring and reference runtime for governed analytics specifications. It is not a general HTML application builder. Custom presentation remains bounded by sanitized HTML/CSS, governed SVG, implemented components, declarative actions, safe expressions, and deterministic logical datasets. Scripts, callbacks, `eval`, arbitrary browser APIs, unsafe URLs, and executable workbook content remain prohibited.

## Local development and deployment

From the repository root:

```powershell
npm ci
npm run dev
npm run build
npm run web:sites:build
```

`npm run dev` builds the browser runtime island and starts Next.js on `http://localhost:4178`. `npm run build` performs the root and web type checks, rebuilds the island, and creates the production Next.js output.

`npm run web:sites:build` produces the supported OpenNext worker and static assets, materializes the prerender cache, and stages both the native OpenNext layout and the compatibility entrypoint under `apps/web/dist` for Sites packaging. Configuration lives in `apps/web/open-next.config.ts` and `apps/web/wrangler.jsonc`; the staged output is generated and is not checked in. See the official [OpenNext Cloudflare guide](https://opennext.js.org/cloudflare/get-started) for the adapter contract.

Root `vercel.json` remains available for Vercel and runs `npm run web:build`; configure that project from the repository root so both `apps/web` and the shared code under `src` are available.

## Future services

`SpecificationAuthoringService` is the future AI integration seam. A provider adapter will receive an `AuthoringContext` and return a candidate `HyperPbiSchema`; it must never save or render before the shared validator accepts it. A future publishing service should sit beside `ProjectStorage`, persist projects/specifications to an authenticated backend, and deploy the same web host. Neither service should fork the schema, editor, renderer, or security pipeline.
