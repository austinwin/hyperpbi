# Industrial Network Telemetry

Represents the futuristic HUD references using safe ECharts options and sanitized inline SVG rather than external raster artwork.

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

All logical datasets use the portable `powerbi` source alias. The CSV has 17 fields, below the visual's 50-field limit, and 49 rows, below the 30,000-row Power BI window.

## Source fields

- `recordtype`
- `recordid`
- `timestamp`
- `timeorder`
- `network`
- `site`
- `throughput`
- `latency`
- `packetloss`
- `uptime`
- `temperature`
- `pressure`
- `signal`
- `alertcount`
- `region`
- `latitude`
- `longitude`

## Expected behavior

Summary gauges, topology, ordered multiseries telemetry, and grouped node-health records render without network access.

## Limitations

The topology is a schematic network map; advanced 3D surfaces and geographic basemaps are intentionally omitted from the Core package.

All names, organizations, accounts, assets, and events are synthetic and provided only for product demonstration.
