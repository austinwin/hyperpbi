# Power BI interactions

HyperPBI builds selection identities from the table DataView. Table rows, chart category groups, map features, and custom `selectWhere` actions resolve back to source row indices and call Selection Manager.

Internal filters control HyperPBI rows. External selections affect other compatible Power BI visuals only when identities exist, host interactions are enabled, and report interaction settings allow them. Clearing a propagated filter clears the host selection. The Studio Interactions panel reports the identity count and enabled state.

Selectable HyperPBI tables use single-selection on normal click and additive selection only with Ctrl/Cmd-click. They filter to selected rows by default and provide **Show all**. Set `selectionMode: "highlight"` on the table to retain every row. This internal table behavior does not guarantee filtering of another Power BI visual; external behavior still depends on table identities, semantic-model relationships, and Power BI's Edit interactions configuration.
