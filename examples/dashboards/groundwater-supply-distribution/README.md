# Groundwater Supply & Distribution

Ridgeway Water's fictional network collects raw groundwater from a local well and a remote well, treats it at the groundwater plant, and pumps it through a distribution main to Maple Court, Cedar Lane, and Birch Grove. The scene uses distinct pipe colors and direction markers, with operating readings for all seven selectable assets.

## Files

- `specification.json` — strict HyperPBI dashboard schema 2.0.
- `runtime.json` — Runtime Configuration protocol 1.0.
- `data.csv` — deterministic synthetic source data.
- `project.hyperpbi` — complete offline Playground project with normalized rows and stable row keys.

## Playground

Load this example from the Dashboard Examples gallery, or import `project.hyperpbi` from the Playground home page. The bundle is local-first and contains no credentials or remote data.

## Power BI

1. Import the HyperPBI Core PBIVIZ package.
2. Import `data.csv` as one table.
3. Add every column to HyperPBI's single **Values** field well. Keep the simple lowercase column names unchanged.
4. Paste `runtime.json` into Runtime Configuration.
5. Paste `specification.json` into Advanced JSON, validate, preview, and save.

All logical datasets use the portable `powerbi` source alias. The CSV has 14 fields, below the visual's 50-field limit, and 189 rows, below the 30,000-row Power BI window.

## Source fields

- `readingid`
- `assetid`
- `asset`
- `stage`
- `scenario`
- `status`
- `recordtype`
- `sampleorder`
- `hour`
- `flowgpm`
- `wellsactive`
- `rawgpm`
- `deliveredgpm`
- `mainpsi`

## Expected behavior

Choose Remote well offline to see the source shut down and residential deliveries drop. Choose Peak demand to see the two wells support higher delivery. Select equipment or a house to filter the charts and asset register. Select a bar or register row to highlight its asset. All uses the latest snapshot for the station KPIs and averages the flow history across available readings.

## Limitations

The site is a synthetic schematic and pipe geometry indicates direction. Readings are illustrative and do not simulate a hydraulic model. Import readingid in Power BI and set numeric columns to Don't summarize to preserve row identities.

All names, organizations, accounts, assets, and events are synthetic and provided only for product demonstration.
