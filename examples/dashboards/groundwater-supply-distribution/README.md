# Groundwater Supply & Distribution

Ridgeway Water's fictional network collects groundwater from two wells, treats it, and pumps it through a distribution main to three residential areas. Select the Clearwell tank to inspect its water level, or change operating scenarios to watch its waterline and pipe flow update.

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

All logical datasets use the portable `powerbi` source alias. The CSV has 16 fields, below the visual's 50-field limit, and 216 rows, below the 30,000-row Power BI window.

## Source fields

- `readingid`
- `assetid`
- `asset`
- `stage`
- `scenario`
- `status`
- `equipmentcolor`
- `recordtype`
- `sampleorder`
- `hour`
- `flowgpm`
- `wellsactive`
- `rawgpm`
- `deliveredgpm`
- `mainpsi`
- `levelpct`

## Expected behavior

Choose Remote well offline to turn its pump red and stop its pipe animation. The Clearwell level drops from 78% to 43% in the tank, KPI, and trend. Peak demand sets the level to 61%. Select the tank or another asset to filter the flow views and register. Use Pause flow to stop the moving markers. All uses the Normal flow snapshot and level trend and averages the flow history across scenarios.

## Limitations

The scene illustrates precomputed operating scenarios and flow direction. Import readingid in Power BI and set numeric columns to Don't summarize to preserve row identities.

All names, organizations, accounts, assets, and events are synthetic and provided only for product demonstration.
