# User guide

Bind all dashboard columns and measures to **Values**. Select **Design with AI** inside the visual; manual JSON authoring is optional and hidden under Advanced.

Studio persists the Specification, Runtime Config, and pane layout when **Save & return** succeeds. Preview dashboard validates without closing Studio. Errors never replace the last saved dashboard.

The designer/preview divider and bottom data panel are draggable. Bottom Data, Fields, Logs, Issues, map, geocode, and interaction output is selectable and can be copied with **Copy output**.

Use **Skill** to copy the full engine contract and current field dictionary into an AI conversation. Use **Help / Docs** for a shorter copyable Markdown authoring guide.

Specification owns layout/components/theme/CSS. Config owns map field bindings, providers, renderer behavior, and interactions. Settings provides form-based map binding assistance; the Power BI format pane remains limited to theme, editor preferences, data limits, interactions, and version information.

Use normalized keys shown in Fields. Do not guess display names. Imported AI answers may contain prose/fences; Extract & Validate locates the largest valid JSON object. Replace, Merge, and Preview-only actions are explicit.

Use `styles.globalCss` for app-wide visual CSS and `styles.components` for reusable defaults by `*`, component type, or `#id`. HyperPBI sanitizes and scopes every rule. AI-generated tab content may use `children`, `components`, or `content`; the latter two are migrated to `children`.
