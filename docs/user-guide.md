# User guide

## Guided Builder (Simple mode)

Normal users do not need to edit JSON. Open the visual menu, choose **Edit**, and follow eight compact steps:

1. Choose a dashboard goal.
2. Choose the audience.
3. Choose a proven layout pattern.
4. Select useful components only.
5. Choose one professional style preset.
6. Select **Copy AI Prompt** and paste it into an approved AI.
7. Paste the AI response and select **Validate & Preview**.
8. After the preview succeeds, select **Save & return**.

The Builder never sends data to an AI service. Field-only mode is the default, and the prompt is copied only when the user requests it.

## Advanced mode

Use **Advanced** only when raw control is needed. It exposes JSON, Runtime Config, calculations, map providers, field mapping, interaction diagnostics, AI skill text, logs, data, and issues. Returning to Simple mode does not discard the saved specification.

## Style presets

- Enterprise Light: neutral and audit-friendly.
- Bright Modern: crisp white with blue/teal accents.
- Futuristic Light: precise cyan technical styling without neon clutter.
- Dark Ops Center: low-glare operational monitoring.
- Dense Compact: maximum useful content for normal Power BI tiles.
- Map Command Center: map-dominant layout with compact supporting panels.

## Recover from a bad AI response

Select **Copy repair prompt** after validation fails. The repair prompt includes broken JSON, errors, warnings, the valid field dictionary, supported components, security rules, and an instruction to return one corrected JSON object only.

## Interaction troubleshooting

Open **Interaction status** in the Builder or Advanced mode. It reports the visual setting, host permission, identity count, last clicked component/field/value, matching source rows, send result, plain-language reason, and suggested fix. A sent selection still requires target **Edit interactions** and compatible model lineage/relationships.

Bind all dashboard columns and measures to **Values**. Select the visual, open its top-right **…** menu, and select **Edit**; manual JSON authoring is optional and hidden under Advanced.

The Builder persists the Specification, Runtime Config, and pane layout when **Save & return** succeeds. Runtime Config is edited through a compact form; use the Advanced JSON panel only when necessary. GUI changes update JSON immediately, while raw JSON remains a draft until **Apply JSON**. Invalid JSON leaves the GUI unchanged. **Validate & Preview** never replaces the last saved dashboard when validation fails.

In Advanced mode, the builder/preview divider and bottom data panel are draggable. Data, Fields, Logs, Issues, map, geocode, and interaction output can be copied with **Copy output**.

Use **Skill** to copy the full engine contract and current field dictionary into an AI conversation. Use **Help / Docs** for a shorter copyable Markdown authoring guide.

Specification owns layout/components/theme/CSS. Config owns map field bindings, providers, renderer behavior, and interactions. Settings provides form-based map binding assistance; the Power BI format pane remains limited to theme, editor preferences, data limits, interactions, and version information.

Use normalized keys shown in Fields. Do not guess display names. Imported AI answers may contain prose/fences; Extract & Validate locates the largest valid JSON object. Replace, Merge, and Preview-only actions are explicit.

Use `styles.globalCss` for app-wide visual CSS and `styles.components` for reusable defaults by `*`, component type, or `#id`. HyperPBI sanitizes and scopes every rule. AI-generated tab content may use `children`, `components`, or `content`; the latter two are migrated to `children`.
