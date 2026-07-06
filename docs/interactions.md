# Power BI interactions

HyperPBI builds selection identities from the table DataView. Table rows, chart category groups, map features, and custom repeated-row `selectWhere` actions resolve back to source row indices and call Selection Manager.

Internal HyperPBI filters and external Power BI selections are separate operations. External selections affect compatible report visuals only when **Interact with other visuals** is enabled, `host.hostCapabilities.allowInteractions` is true, table identities exist, clicked values resolve to source rows, semantic-model lineage/relationships are compatible, and Power BI **Edit interactions** configures the target to filter or highlight. Clearing a propagated selection clears the host selection.

The Studio Interactions panel reports both gates, identity count, last component/type, field/value, resolved row count, capped source indices, whether a selection was sent, and a concrete failure reason. A successful send cannot prove target report configuration, so the panel retains the Edit-interactions guidance.

Selectable HyperPBI tables use single-selection on normal click and additive/toggle selection with Ctrl/Cmd-click. Backward-compatible `selectionMode: "filter"` filters the internal table to selected rows and provides **Show all**. Use `selectionMode: "highlight"`, or `internal:false`, to retain every row. Use `external:false` when a selection must remain HyperPBI-only.

For a slicer-like custom list, use `repeat.distinctBy`, `interactions.onClick.action: "selectWhere"`, `valueFromRow`, `internal:false`, and `external:true`. The full working LeadBy example is in [custom components](custom-components.md).

Do not use `externalSelection`, `selectionTarget`, `crossFilter`, or `powerBISelection` in dashboard JSON. They are ignored with warnings. Runtime Config has its own implemented `interactions.crossFilter` switch that gates external selection and internal-filter propagation.
