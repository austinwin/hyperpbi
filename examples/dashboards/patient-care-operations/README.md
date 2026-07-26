# Patient Care Operations

Translates the airy blue-and-mint healthcare reference into a safe, accessible operational workspace.

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

All logical datasets use the portable `powerbi` source alias. The CSV has 16 fields, below the visual's 50-field limit, and 72 rows, below the 30,000-row Power BI window.

## Source fields

- `encounterid`
- `patientid`
- `patientname`
- `gender`
- `age`
- `encounterdate`
- `weekday`
- `department`
- `alerttype`
- `severity`
- `status`
- `reviewtype`
- `satisfactionscore`
- `responseminutes`
- `resolved`
- `visits`

## Expected behavior

Patient-level data drives aggregate KPIs, daily and departmental charts, and a selectable active-patient work queue.

## Limitations

All people and clinical events are synthetic; the dashboard is not intended for diagnosis or real patient decisions.

All names, organizations, accounts, assets, and events are synthetic and provided only for product demonstration.
