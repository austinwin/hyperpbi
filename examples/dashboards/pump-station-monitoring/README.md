# Pump Station Monitoring

Northbank Water's fictional booster station pairs four selectable centrifugal pump assemblies with pressure vessels, suction and discharge manifolds, and synthetic operating records. The spatial view, station KPIs, pressure trend, motor-load chart, and snapshot register all use the same source data.

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

All logical datasets use the portable `powerbi` source alias. The CSV has 15 fields, below the visual's 50-field limit, and 132 rows, below the 30,000-row Power BI window.

## Source fields

- `readingid`
- `equipmentid`
- `equipment`
- `scenario`
- `status`
- `recordtype`
- `sampleorder`
- `hour`
- `flowgpm`
- `pressurepsi`
- `motorloadpct`
- `stationflow`
- `stationpressure`
- `stationalerts`
- `stationonline`

## Expected behavior

Choose Peak demand to flag P-103 and start the standby pump, or Maintenance to stop P-102. Select equipment in the scene or its keyboard-accessible list to filter the trend, motor-load chart, and register. Select a motor-load bar or snapshot row to highlight its pump. Select the same asset again or clear the scene selection to restore the linked views. All uses the newest snapshot for station KPIs and asset status and averages pressure across the available scenarios.

## Limitations

The three operating scenarios are precomputed snapshots. The project works offline and uses procedural equipment geometry. In Power BI, include readingid as a categorical column and set numeric fields to Don't summarize to preserve distinct reading rows. Configure Power BI visual interactions to test the selected rows against a second visual.

All names, organizations, accounts, assets, and events are synthetic and provided only for product demonstration.
