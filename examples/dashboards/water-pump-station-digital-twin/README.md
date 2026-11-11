# Water Pump Station | Process Digital Twin

A fictionalized 3D water pump station with remote and local source wells, dual surface-water inlets, treatment indicators, five storage tanks, and six booster pumps. Eight simulated operating scenarios drive tank levels, pipe flow, cooling fans, alarms, linked trends, and equipment selection.

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

All logical datasets use the portable `powerbi` source alias. The CSV has 21 fields, below the visual's 50-field limit, and 312 rows, below the 30,000-row Power BI window.

## Source fields

- `readingid`
- `assetid`
- `equipment`
- `category`
- `scenario`
- `status`
- `equipmentcolor`
- `recordtype`
- `sampleorder`
- `hour`
- `flowgpm`
- `pressurepsi`
- `levelpct`
- `rpm`
- `motorloadpct`
- `stationflow`
- `stationpressure`
- `stationonline`
- `stationalerts`
- `sourceflow`
- `averagelevel`

## Expected behavior

Switch between all eight scenarios: Normal supply, Peak demand, Remote wells offline, Surface inlet unavailable, Booster maintenance, Low storage, Limited power, and Low distribution pressure. Tank fill, pump availability, fan rotation, animated flow, pressure and intake KPIs, linked charts, and the asset register change with the scenario. Selecting an asset cross-highlights associated records.

## Limitations

Synthetic demonstration based on generalized process relationships, not a literal copy of a real infrastructure diagram. Operating values are invented and must never be used for live controls. The 3D engine supports up to 80 objects, respects reduced-motion preferences, and requires WebGL 2. In Power BI bind readingid as categorical and set numeric columns to Don't summarize.

All names, organizations, accounts, assets, and events are synthetic and provided only for product demonstration.
