# HyperPBI architecture and Playground

HyperPBI is one declarative analytics system with multiple hosts. HyperPBI 2.0 is the only dashboard schema; the web Playground does not introduce a second format.

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

Shared TypeScript under `src` owns schema preparation, canonical field resolution, calculated fields, logical datasets, reference validation, sanitization, Studio, rendering, component state, interactions, maps, tables, charts, and SVG. `apps/playground` supplies only the web shell, routing, file parsing worker, local project workflow, and web-host controls.

Runtime settings moved to `src/runtime/runtimeSettings.ts`, so Studio and rendering do not need Power BI formatting APIs. Host behavior is expressed by `HyperPbiHostBridge`:

- `PowerBiHostBridge` delegates identity selection, JSON filters, and safe URL launching to Power BI while preserving existing interaction diagnostics.
- `BrowserHostBridge` allows the shared internal interaction engine to keep working but returns an explicit unsupported result for Power BI-only selection and external filtering.

No bridge evaluates specification strings, runs arbitrary JavaScript, or bypasses the existing URL, HTML, CSS, SVG, JSON, map-provider, or chart-option policies.

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

## Vercel deployment

From the repository root:

```powershell
npm ci
npm run playground:build
```

Root `vercel.json` builds `apps/playground/dist` and rewrites application routes to `index.html`. Configure the Vercel project root as the repository root so the Playground can import the shared runtime under `src`. The built output is checked in for the requested reference artifact; normal Vercel deployments should still rebuild from source.

## Future services

`SpecificationAuthoringService` is the future AI integration seam. A provider adapter will receive an `AuthoringContext` and return a candidate `HyperPbiSchema`; it must never save or render before the shared validator accepts it. A future publishing service should sit beside `ProjectStorage`, persist projects/specifications to an authenticated backend, and deploy the same web host. Neither service should fork the schema, editor, renderer, or security pipeline.
