# Power BI interactions

HyperPBI builds selection identities from the table DataView. Table rows, chart category groups, map features, and custom repeated-row `selectWhere` actions resolve back to source row indices and call Selection Manager.

Internal HyperPBI filters, external Power BI filters, and Power BI row selections are separate operations. Field-bound slicer controls use `host.applyJsonFilter` against the normalized field's `sourceTable` and `sourceColumn`. Data-point interactions use Selection Manager identities. Both require **Interact with other visuals** and host permission; selections additionally require table identities and compatible semantic-model lineage/relationships.

The Studio Interactions panel reports both gates, identity count, last component/type, field/value, resolved row count, capped source indices, whether a selection was sent, and a concrete failure reason. A successful send cannot prove target report configuration, so the panel retains the Edit-interactions guidance.

The guided Builder presents the same information as plain-language **Interaction status** with a suggested fix. Typical messages include: interactions disabled; host disallowed; no identities (bind real fields in Values); no matching rows; target Edit interactions may be disabled; or target visuals may not share compatible lineage/relationships.

Selectable HyperPBI tables use single-selection on normal click and additive/toggle selection with Ctrl/Cmd-click. Backward-compatible `selectionMode: "filter"` filters the internal table to selected rows and provides **Show all**. Use `selectionMode: "highlight"`, or `internal:false`, to retain every row. Use `external:false` when a selection must remain HyperPBI-only.

Normal `select`, `multiSelect`, `searchBox`, `textInput`, `segmentedControl`, `slider`, and `dateRange` controls externally filter by default. Use `internal:false` for an external-only slicer and `external:false` to prevent report filtering. `multiSelect` emits one BasicFilter with `In`; text contains emits an AdvancedFilter with `Contains`; All/empty removes the filter.

For a slicer-like custom list, use `repeat.distinctBy`, `interactions.onClick.action: "selectWhere"`, `valueFromRow`, `internal:false`, `external:true`, and `externalMode:"filter"`. Use `externalMode:"selection"` for an explicit row action. The full working LeadBy example is in [custom components](custom-components.md).

Do not use `externalSelection`, `selectionTarget`, `crossFilter`, or `powerBISelection` in dashboard JSON. They are ignored with warnings. Runtime Config has its own implemented `interactions.crossFilter` switch that gates external selection and internal-filter propagation.
