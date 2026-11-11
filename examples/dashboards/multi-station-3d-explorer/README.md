# Multi-Station 3D Explorer

A fictional water utility operates two groundwater stations and a storage and repump facility. The station map and searchable register share one selection, and the reporting day updates measurements in place.

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

All logical datasets use the portable `powerbi` source alias. The CSV has 17 fields, below the visual's 50-field limit, and 189 rows, below the 30,000-row Power BI window.

## Source fields

- `recordtype`
- `stationid`
- `stationname`
- `stationtype`
- `location`
- `latitude`
- `longitude`
- `scenejson`
- `day`
- `reportdate`
- `pumpagemgd`
- `availability`
- `assetid`
- `equipmentstatus`
- `rpm`
- `levelpct`
- `flowgpm`

## Expected behavior

Choose a station with the dropdown, searchable register, or map. The selected station appears in the profile and one 3D viewer. All map markers remain visible. Move the reporting-day slider to change pumpage, flow, equipment status, and tank levels while the layout and camera stay in place. Groundwater Station 02 has no pumpage or booster readings on October 7.

## Limitations

The CSV combines three record types in the one Power BI Values table. Scene rows contain geometry, while Daily and Equipment rows contain separate synthetic readings. The history chart includes only days with a reading. Set identifiers, SceneJSON, and the reporting date to Text, and numeric columns to Don't summarize. No network is required. The district and station coordinates are fictional.

All names, organizations, accounts, assets, and events are synthetic and provided only for product demonstration.
