# 3D Animation Studio

A hands-on Three.js motion laboratory using synthetic booster-station readings. Configure RPM-driven cooling fans, moving actuators, alert pulses, scaling indicators and visibility animation in the Visual Inspector. Every object can be selected and linked to charts and tables.

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

Normal duty spins three fans, Peak demand spins all four and pulses the P-103 warning beacon, and Maintenance stops P-102 so its status beacon blinks. Edit any object's Animations section to adjust RPM, axis, period and data fields.

## Limitations

Scenario values and readings are synthetic. Animations are local rendering only, not SCADA control commands. Requires WebGL 2 and respects reduced motion and runtime animation budgets.

All names, organizations, accounts, assets, and events are synthetic and provided only for product demonstration.
