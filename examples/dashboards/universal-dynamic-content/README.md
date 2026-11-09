# Universal Dynamic Content

A maintenance dispatcher browses a local asset queue while a responsive side panel and workload card fetch their component trees from MiniUp.

## Files

- `specification.json` — strict HyperPBI dashboard schema 2.0.
- `runtime.json` — Runtime Configuration protocol 1.0.
- `data.csv` — deterministic synthetic source data.
- `project.hyperpbi` — complete Playground project with the local synthetic records and live MiniUp bindings.

## Playground

Load this example from the Dashboard Examples gallery, or import `project.hyperpbi` from the Playground home page. The preview calls the [public MiniUp API](https://functions.miniup.app/hyperpbi-dynamic-demo/asset?id=P-204) when triggered. The bundle embeds the local CSV and contains no credentials. See the [live preview and Open in Playground action](https://hyperpbi.com/examples/universal-dynamic-content) and the [Function source](../dynamic-content-api.mjs).

## Power BI

1. Import the HyperPBI Maps PBIVIZ package with WebAccess for `https://functions.miniup.app`. Allow the origin in Power BI.
2. Import `data.csv` as one table.
3. Add every column to HyperPBI's single **Values** field well. Keep the simple lowercase column names unchanged.
4. Paste `runtime.json` into Runtime Configuration.
5. Paste `specification.json` into Advanced JSON, validate, preview, and save.

All logical datasets use the portable `powerbi` source alias. The CSV has 5 fields, below the visual's 50-field limit, and 4 rows, below the 30,000-row Power BI window.

## Source fields

- `assetid`
- `asset`
- `zone`
- `priority`
- `hours`

## Expected behavior

Select P-204 or another asset to load its work plan in the side panel. Select High under Work priority to query the filtered workload, then click Refresh workload to repeat the live request.

## Limitations

The local CSV is synthetic. Live details require HTTPS access to the public MiniUp Function. In Power BI, the Maps package and runtime WebAccess permission are required.

All names, organizations, accounts, assets, and events are synthetic and provided only for product demonstration.
