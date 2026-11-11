# Water Pump Station | Process Digital Twin

A fictionalized 3D water pump station with remote and local source wells, dual surface-water inlets, treatment indicators, five storage tanks, and six booster pumps. Ten simulated operating scenarios drive eleven inline flowmeters, chlorine and ammonia injection, three analyzers, valve opening, tank levels, motor fans and connected hydraulic paths.

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

All logical datasets use the portable `powerbi` source alias. The CSV has 27 fields, below the visual's 50-field limit, and 710 rows, below the 30,000-row Power BI window.

## Source fields

- `readingid`
- `assetid`
- `equipment`
- `category`
- `medium`
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
- `valveopenpct`
- `dosemgL`
- `cl2mgL`
- `nh3mgL`
- `stationflow`
- `stationpressure`
- `stationonline`
- `stationalerts`
- `sourceflow`
- `netstoragegpm`
- `averagelevel`

## Expected behavior

Choose each of ten scenarios: Normal supply, Peak demand, Remote wells offline, Surface inlet unavailable, Booster maintenance, Low storage, Limited power, Low distribution pressure, Chlorine dosing fault, and Ammonia dosing fault. Eleven meters show individual GPM, two surface valves close when isolated, chemical skids stop on fault, analyzers update, tank levels change, pump fans rotate only with RPM, flow markers stop at zero flow, and the station KPIs and linked charts update. Selecting an asset highlights its associated records.

## Limitations

Training example follows the source schematic's general process topology but contains synthetic measurements, valve positions, dosing values, alarm thresholds, scenarios and pump performance. Valve flow is approximated by percentage opening; hydraulic heads, volume capacities and chemical kinetics are not solved. The 3D engine supports 104 objects and requires WebGL 2; motion honors user preferences. In Power BI, bind readingid as a categorical column and set numeric fields to Don't summarize.

All names, organizations, accounts, assets, and events are synthetic and provided only for product demonstration.
