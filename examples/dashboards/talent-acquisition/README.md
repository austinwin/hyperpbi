# Talent Acquisition Command Center

Inspired by the bright violet recruiting reference with a full application shell, compact KPI cards, stage-flow analysis, and a candidate work queue.

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

All logical datasets use the portable `powerbi` source alias. The CSV has 17 fields, below the visual's 50-field limit, and 96 rows, below the 30,000-row Power BI window.

## Source fields

- `applicationid`
- `applicationdate`
- `weekday`
- `weekdayorder`
- `hourbucket`
- `hourorder`
- `candidate`
- `gender`
- `city`
- `roleid`
- `roletitle`
- `department`
- `stage`
- `source`
- `score`
- `period`
- `applicationcount`

## Expected behavior

KPI totals, stage charts, gender mix, role demand, and candidate records render from one application-level dataset and cross-highlight by source row lineage.

## Limitations

Profile photography is replaced by safe initials and bundled icons so the example remains offline and Power BI portable.

All names, organizations, accounts, assets, and events are synthetic and provided only for product demonstration.
