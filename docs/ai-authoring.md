# AI authoring

AI Prompt builds a self-contained compiler instruction from the current field dictionary, safe samples/summaries, visual dimensions, requested components, DSL operators, map policy, interaction behavior, and security constraints.

Privacy modes:

- Field dictionary only (default): keys, display names, types, formats, roles.
- Samples: 1–50 selected rows.
- Masked: text/date values replaced and numeric values zeroed.
- Summary: numeric min/max/average, date range, and up to 20 categories.
- Types only: keys and inferred types.

Review every prompt before sending it externally. HyperPBI does not call an AI API itself. When validation fails, Copy repair prompt includes the original JSON, precise errors, field dictionary, and supported reference while instructing the AI not to rewrite working sections.

The Skill tab is the densest reusable context document. Copy it at the start of an AI conversation when the model does not already know HyperPBI. It includes global styling, calculations, components, templates, maps, interactions, security restrictions, common mistakes, and the current normalized field dictionary.
