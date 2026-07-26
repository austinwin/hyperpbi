# Media & Web Performance

Blends the coral-framed monitoring reference and the dense website KPI wall into one practical growth dashboard.

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

All logical datasets use the portable `powerbi` source alias. The CSV has 18 fields, below the visual's 50-field limit, and 38 rows, below the 30,000-row Power BI window.

## Source fields

- `recordtype`
- `recordid`
- `date`
- `dayorder`
- `medium`
- `channel`
- `conversions`
- `conversionrate`
- `sessions`
- `newuserspct`
- `sessionsperuser`
- `engagementseconds`
- `pagespersession`
- `bouncerate`
- `location`
- `latitude`
- `longitude`
- `mentions`

## Expected behavior

Summary metrics, daily trends, medium performance, bounce gauge, and live-location list render from explicit logical record types.

## Limitations

Location data is shown as a portable ranked list; this Core-profile example intentionally avoids external map tiles.

All names, organizations, accounts, assets, and events are synthetic and provided only for product demonstration.
