# Power BI interactions

HyperPBI can turn table rows, chart category groups, map features, timelines, and custom repeated-row actions into either Power BI filters or Selection Manager calls. Runtime Config controls this centrally.

Internal HyperPBI filters, external Power BI filters, and Power BI row selections are separate operations. The default `externalMode:"filter"` sends every field-backed interaction through `host.applyJsonFilter` against the normalized field's `sourceTable` and `sourceColumn`. `externalMode:"auto"` keeps slicers as filters and sends data-point clicks through Selection Manager; `externalMode:"selection"` explicitly selects rows/data points. All modes require **Interact with other visuals** and host permission; selections additionally require table identities and compatible semantic-model lineage/relationships.

The Studio Interactions panel reports both gates, identity count, last component/type, field/value, resolved row count, capped source indices, whether a selection was sent, and a concrete failure reason. A successful send cannot prove target report configuration, so the panel retains the Edit-interactions guidance.

The guided Builder presents the same information as plain-language **Interaction status** with a suggested fix. Typical messages include: interactions disabled; host disallowed; no identities (bind real fields in Values); no matching rows; target Edit interactions may be disabled; or target visuals may not share compatible lineage/relationships.

Selectable HyperPBI tables use single-selection on normal click and additive/toggle selection with Ctrl/Cmd-click. Backward-compatible `selectionMode: "filter"` filters the internal table to selected rows and provides **Show all**. Use `selectionMode: "highlight"`, or `internal:false`, to retain every row. Use `external:false` when a selection must remain HyperPBI-only.

Normal controls externally filter by default. Table, chart, map, timeline, and custom data-point actions also filter by default when they can resolve a source field/value. Use `internal:false` for external-only behavior and `external:false` to prevent report filtering. Multi-value actions emit one BasicFilter with `In`; text contains emits an AdvancedFilter with `Contains`; All/empty removes the filter.

For a slicer-like custom list, use `repeat.distinctBy`, `interactions.onClick.action: "selectWhere"`, `valueFromRow`, `internal:false`, `external:true`, and `externalMode:"filter"`. Use `externalMode:"selection"` for an explicit row action. The full working LeadBy example is in [custom components](custom-components.md).

Do not use `externalSelection`, `selectionTarget`, `crossFilter`, or `powerBISelection` in dashboard JSON. They are ignored with warnings. Runtime Config has its own implemented `interactions.crossFilter` switch that gates external selection and internal-filter propagation.
