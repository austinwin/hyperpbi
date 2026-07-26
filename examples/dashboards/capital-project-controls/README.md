# Capital Project Controls

A clean project-controlling canvas modeled after the white-and-blue reference, with precise status cards and earned-value visuals.

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

All logical datasets use the portable `powerbi` source alias. The CSV has 22 fields, below the visual's 50-field limit, and 18 rows, below the 30,000-row Power BI window.

## Source fields

- `recordtype`
- `projectid`
- `projectname`
- `client`
- `projecttype`
- `projectstatus`
- `manager`
- `startdate`
- `enddate`
- `month`
- `monthorder`
- `budget`
- `contractvalue`
- `scheduledcost`
- `performedcost`
- `actualcost`
- `margin`
- `completionpct`
- `spi`
- `cpi`
- `costcategory`
- `costvalue`

## Expected behavior

Summary values use first-row semantics, monthly curves remain ordered, and cost composition traces back to cost-category rows.

## Limitations

The example represents one selected project; use a report slicer or external filter to select other projects in Power BI.

All names, organizations, accounts, assets, and events are synthetic and provided only for product demonstration.
