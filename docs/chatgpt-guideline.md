# ChatGPT guideline for HyperPBI

Use the self-contained prompt copied from HyperPBI Studio. HyperPBI does not call ChatGPT or another AI internally; a user deliberately copies the prompt to an approved service and pastes the response back.

## Output-only rules

Return exactly the artifact requested by the prompt:

- Create dashboard, Improve current dashboard, and Repair invalid JSON: one complete specification object
- Add section: one section package with the requested insertion target
- Redesign selected section: one replacement component/section using the selected stable ID

Return valid JSON only: no Markdown fence, explanation, comments, trailing commas, alternate versions, or JSON Patch for normal improvement/repair jobs. Never emit JavaScript, functions, callbacks, inline handlers, scripts, iframes, credentials, SQL, network datasets, or invented fields.

Use version 2.0 for new specifications:

```json
{
  "version": "2.0",
  "components": []
}
```

Version 2.0 rejects unknown root/component properties. Every component requires a globally unique stable ID. Preserve IDs and valid unrelated behavior when improving or repairing a dashboard.

## Fields

Use only aliases listed in `AVAILABLE FIELD ALIASES`. An alias is the AI-facing authoring key; it resolves to a canonical runtime key. Do not substitute a display name, guess a normalized key, or call `Sum(Table.Column)` a model measure. The Field Manifest states whether a field is a true model measure, an implicitly aggregated model column, or another origin.

External Power BI filters require an alias for a real model column with source table/column metadata. Dataset-derived fields and dataset metrics cannot directly filter the semantic model. Identity selection can still work through source-row lineage.

## Representative 2.0 response

This example assumes the prompt supplied aliases `status` and `amount`.

```json
{
  "version": "2.0",
  "title": "Operations by status",
  "data": {
    "datasets": {
      "statusSummary": {
        "source": "powerbi",
        "groupBy": ["status"],
        "metrics": {
          "totalAmount": {
            "op": "sum",
            "field": "amount"
          }
        },
        "sort": [
          {
            "field": "totalAmount",
            "direction": "descending"
          }
        ]
      }
    }
  },
  "components": [
    {
      "type": "barChart",
      "id": "amount_by_status",
      "title": "Amount by status",
      "dataset": "statusSummary",
      "category": "status",
      "measure": "totalAmount",
      "aggregation": "sum",
      "span": 12,
      "interaction": {
        "enabled": true,
        "trigger": "click",
        "internalMode": "highlight",
        "internalScope": "self",
        "externalMode": "selection",
        "selectionMode": "replace",
        "multiSelect": true,
        "clearOnSecondClick": true
      }
    }
  ]
}
```

The chart is semantic: HyperPBI generates its chart data from `category` and `measure`. The named dataset groups rows and preserves contributing source-row lineage for external selection. `totalAmount` is not used for external filter mode because it is a dataset metric.

## Logical datasets

Each named dataset requires `source`. After resolving that source, operations run as:

`filter → derive → rename → select → groupBy/metrics → distinct → sort → limit`

Only use operations and fields listed in the prompt. No SQL, joins, network sources, or functions.

## Definitions and patterns

Definitions are reusable component fragments. A `use` instance supplies its own stable ID; objects merge recursively and arrays replace. Available application patterns are `kpi-row`, `trend-and-breakdown`, `record-explorer`, and `map-and-details`; use only the exact required/optional properties supplied by the prompt.

## Components and interactions

Use only component types and properties in the prompt's relevant-component module. Prefer first-class semantic charts, native tables, cards, detail panels, and overlays over custom markup. Use `advancedChart` only when no semantic chart fits, `svg` for governed diagrams/schematics, and `svgMarkup` only as a strictly sanitized fallback.

Do not add an interaction object merely to satisfy a blanket rule. The three optional systems are distinct:

- `uiAction`: safe interface behavior
- `interaction`: universal internal/Power BI data behavior
- `interactions`: allowlisted event-specific custom behavior

Targets must name real stable component/overlay IDs.

## Improve and repair

For improvement, return the complete updated specification. Preserve the current version, stable IDs, datasets, interactions, app shell, styling, and unrelated sections unless the request requires a change.

For repair, follow structured diagnostics. Correct syntax/schema/reference issues without guessing business meaning. Do not delete a component merely because a field is ambiguous. Do not convert 1.0 to 2.0 unless migration is explicitly requested.

## Version 1.0 compatibility

An existing `{"version":"1.0", ...}` dashboard remains valid compatibility material. It may use normalized runtime keys, lenient properties, legacy accordion children, drawers/filter drawers, steppers, button `action`/`actionValue`, Tabulator engine input, legacy map settings, or deprecated interaction flags.

When asked to improve an existing 1.0 specification, preserve version 1.0 and its working normalized keys unless the user explicitly requests a 2.0 migration. Never use 1.0 as the default for a new dashboard.
