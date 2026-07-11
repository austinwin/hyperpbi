# Versioning and migration

HyperPBI 1.0 remains supported with its lenient component property handling, normalized field keys, legacy tab child names, legacy drawers/steppers, table engine normalization, calculations, interactions, maps, and persisted Power BI state.

Use 2.0 for new AI-authored dashboards. It adds strict properties, field aliases, named datasets, reusable definitions, design-system references, and application patterns. The preparation pipeline detects the version, applies supported legacy migrations, expands definitions and patterns, evaluates datasets, validates references/security, and then renders with the existing component engine.

Migration is explicit when ambiguity exists. HyperPBI does not silently reinterpret fields or business logic. To upgrade an existing dashboard, use an **Improve current dashboard** prompt and request an intentional 2.0 migration; otherwise improvement prompts preserve the current schema version.
