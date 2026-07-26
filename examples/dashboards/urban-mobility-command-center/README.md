# Urban Mobility Command Center

Adapts the compact violet mobility reference into a responsive Power BI map dashboard with analytical selection.

## Files

- `specification.json` — strict HyperPBI dashboard schema 2.0.
- `runtime.json` — Runtime Configuration protocol 1.0.
- `data.csv` — deterministic synthetic source data.
- `project.hyperpbi` — complete Playground project with embedded synthetic rows, stable row keys, and an OpenStreetMap basemap configuration.

## Playground

Load this example from the Dashboard Examples gallery, or import `project.hyperpbi` from the Playground home page. The synthetic dataset is embedded locally and the bundle contains no credentials. The configured OpenStreetMap basemap fetches remote tiles, so a network connection is required to display the basemap.

## Power BI

1. Import the HyperPBI Maps PBIVIZ package. The package must include the OpenStreetMap WebAccess declaration.
2. Import `data.csv` as one table.
3. Add every column to HyperPBI's single **Values** field well. Keep the simple lowercase column names unchanged.
4. Paste `runtime.json` into Runtime Configuration.
5. Paste `specification.json` into Advanced JSON, validate, preview, and save.

All logical datasets use the portable `powerbi` source alias. The CSV has 14 fields, below the visual's 50-field limit, and 56 rows, below the 30,000-row Power BI window.

## Source fields

- `assetid`
- `assettype`
- `status`
- `latitude`
- `longitude`
- `zone`
- `route`
- `tripdate`
- `hour`
- `distancekm`
- `durationminutes`
- `batterypct`
- `demandindex`
- `ridership`

## Expected behavior

Map points fit the dataset, status legend selection links to other components, and route summaries retain contributing Power BI row identities.

## Limitations

Street tiles require the Maps PBIVIZ profile, declared OpenStreetMap WebAccess, and network access in the host.

All names, organizations, accounts, assets, and events are synthetic and provided only for product demonstration.
