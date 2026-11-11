# Dashboard examples

The dashboard examples use the same schema, data, and rendering pipeline on the website, in the Playground, and in Power BI. Browse live previews at `/examples`. [Dashboard manifest](../examples/dashboards/manifest.json)

## Included dashboards

| Use case | Folder | Profile | Design focus |
|---|---|---|---|
| Recruiting and workforce analytics | [`talent-acquisition`](../examples/dashboards/talent-acquisition) | Core | Application flow, candidate mix, open roles, and applicant detail |
| Construction and capital-program control | [`capital-project-controls`](../examples/dashboards/capital-project-controls) | Core | Project identity, earned value, progress gauges, and cost composition |
| Retail, ecommerce, and cash-flow monitoring | [`retail-sales-operations`](../examples/dashboards/retail-sales-operations) | Core | Revenue trends, product categories, recent orders, and settlements |
| Urban mobility operations | [`urban-mobility-command-center`](../examples/dashboards/urban-mobility-command-center) | Maps | Fleet locations, status, demand, battery health, and busy routes |
| Patient-care operations | [`patient-care-operations`](../examples/dashboards/patient-care-operations) | Core | Encounters, alerts, response time, department load, and patient detail |
| Consumer banking | [`digital-banking-overview`](../examples/dashboards/digital-banking-overview) | Core | Balances, debit and credit activity, expense mix, and transactions |
| Digital media and website analytics | [`media-web-performance`](../examples/dashboards/media-web-performance) | Core | Conversions, sessions, engagement, channels, and live locations |
| Industrial network monitoring | [`industrial-network-telemetry`](../examples/dashboards/industrial-network-telemetry) | Core | Throughput, latency, uptime, alerts, site ranking, and telemetry |
| Water distribution | [`dynamic-gis-analytics`](../examples/dashboards/dynamic-gis-analytics) | Maps | Pressure telemetry, map popups, and station operations |
| Maintenance dispatch | [`universal-dynamic-content`](../examples/dashboards/universal-dynamic-content) | Maps | Asset work plans in a side panel and live workload |
| Pump station operations | [`pump-station-monitoring`](../examples/dashboards/pump-station-monitoring) | Core | 3D pump selection, operating scenarios, pressure and motor-load charts |
| Engineering training digital twin | [`water-pump-station-digital-twin`](../examples/dashboards/water-pump-station-digital-twin) | Core | Eight scenario-driven 3D process routes, five storage tanks, six boosters, source monitoring and linked charts |
| Groundwater treatment and delivery | [`groundwater-supply-distribution`](../examples/dashboards/groundwater-supply-distribution) | Core | 3D source-to-tap network, remote well outage, and residential delivery |
| Interactive equipment animation | [`scene3d-animation-studio`](../examples/dashboards/scene3d-animation-studio) | Core | Editable fan rotation, actuator motion, pulsing alarms, blink, and data-driven animation |

Each folder is self-contained:

- `specification.json` is a strict HyperPBI dashboard schema 2.0 document.
- `runtime.json` is Runtime Configuration protocol 1.0.
- `data.csv` is deterministic synthetic data with portable lowercase field names.
- `project.hyperpbi` contains the complete Playground project, including normalized local data and stable row keys.
- `README.md` explains expected behavior, limitations, source fields, and host-specific loading.

## Use an example in the Playground

1. Open `/examples` in the unified website.
2. Choose a dashboard to see its live shared-runtime preview and portability notes.
3. Select **Open in Playground** to import a new local copy and open its project workspace.
4. Edit, validate, preview, and export the project normally.

Alternatively, open `/playground` and import the folder's `project.hyperpbi` file. The import creates a new browser-local project ID; it does not change the checked-in example. A `.hyperpbi` project bundle is a Playground artifact and is not imported by Power BI.

## Use an example in Power BI

1. Build or obtain the package profile declared by the example:
   - Run `npm run package:core` for examples marked Core.
   - Run `npm run package:maps` for examples marked Maps. Urban Mobility uses OpenStreetMap tiles. Dynamic GIS Analytics and Universal Dynamic Content use `https://functions.miniup.app`.
2. In Power BI Desktop, import the appropriate `.pbiviz` package and add HyperPBI to the report canvas.
3. Import the example's `data.csv` as one table.
4. Add every CSV column to HyperPBI's single **Values** field well. Keep the simple lowercase headers unchanged.
5. Paste `runtime.json` into **Runtime Configuration**.
6. Paste `specification.json` into **Advanced JSON**, validate and preview it, then save.

Every logical dataset in these examples starts from the host-neutral `powerbi` alias, so the same specification resolves the uploaded CSV in the Playground and the visual data view in Power BI. Each CSV remains below the visual's 50-field mapping limit and 30,000-row data window. Power BI still controls the received query grain, relationships, field summarization, and identity selection.

The Core profile has no external-provider WebAccess. The Maps profile is required where a dashboard uses approved basemap, geocoding, ArcGIS, GeoJSON, XYZ, or Dynamic Content network access. Keep credentials and private service tokens outside example JSON.

## Regenerate and verify

From the repository root:

```powershell
npm run examples:generate
npm run examples:check
```

Generation is deterministic. The check verifies the manifest and required files, strict schema preparation, CSV field and row limits, direct Power BI portability, project-bundle import, and byte-equivalent regeneration from the host-neutral template helper.

When adding an example, create one use-case-named folder, keep all field references portable to the single Power BI data view, declare the correct package profile, and add the entry to the manifest. Implement generally useful behavior in the shared runtime rather than hiding an example-specific workaround in its specification.

## Dynamic Content

Dynamic GIS Analytics loads station telemetry when a feature is clicked. Universal Dynamic Content loads an asset work plan in a responsive side panel and queries workload by priority. Both previews call the public MiniUp Function. [Dynamic Content guide](remote-fragments.md).
