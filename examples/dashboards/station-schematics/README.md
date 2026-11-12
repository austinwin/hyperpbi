# Water Operations Explorer · Station schematics

1. Import [StationSchematics.csv](StationSchematics.csv) into Power BI Desktop as `StationSchematics`. Set `stationid`, `name`, and `schematic` to **Text**. The optional `schematic_image` column is unused.
2. Import the built HyperPBI **Core** PBIVIZ. Place the visual on the report canvas. Add `StationSchematics[stationid]` and `StationSchematics[schematic]` to **Values** with **Don't summarize**.
3. Open HyperPBI's **Edit** mode. Paste [specification.json](specification.json) into the Advanced JSON editor and save.
4. Add a native Power BI slicer with `StationSchematics[name]`. Set it to single select if desired. In **Edit interactions**, verify that the slicer filters the HyperPBI visual.

| Slicer choice | Expected result |
| --- | --- |
| North Intake | One diagram from two identical records. Blue dashes follow the pipe, the running pump indicator pulses, and the low-level alarm pulses. The arrow and status labels stay visible with reduced motion. |
| East Booster | The North Intake diagram is replaced with a different viewBox and a standby pump. |
| Missing schematic | The visual reports that the selected facility has no SVG. |
| Truncated schematic | The visual reports that the SVG could not be parsed. |
| Conflicting schematics | The visual reports that the selected facility has two different SVG values. |
| Clear selection, select multiple facilities, or filter out every row | “Select one facility to view its process schematic.” |

In Playground, add the CSV as the default data source, then open Studio's Advanced JSON editor and paste the same specification. To simulate filtering in Playground, insert this component before `station_schematic` in the `components` array. The Power BI specification needs only the schematic component.

```json
{
  "type": "select",
  "id": "facility_filter",
  "label": "Facility",
  "field": "stationid",
  "interaction": {
    "field": "stationid",
    "internalMode": "filter",
    "targets": ["station_schematic"],
    "externalMode": "none"
  }
}
```
