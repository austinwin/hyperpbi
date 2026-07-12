# Repair workflow

Repair is diagnostic-driven and conservative. HyperPBI never replaces the last valid saved dashboard with invalid input.

## Workflow

1. Paste one AI response.
2. Extract exactly one JSON object (or one packaged `specification`).
3. Prepare aliases, definitions, patterns, datasets, and compatibility migrations.
4. Validate strict schema, fields, references, calculations, interactions, targets, and SVG limits.
5. Review structured diagnostics and any explicitly recorded automatic repairs.
6. Copy the repair prompt to an approved external AI.
7. Paste one complete corrected specification and validate again.

Repair output is complete JSON, not JSON Patch or prose.

## Extractor diagnostics

The extractor accepts a direct object, one fenced block, or one unambiguous balanced object surrounded by prose. It rejects:

- empty responses
- arrays/primitives
- multiple parseable objects or ambiguous fences
- comments
- smart quotes
- truncated/unbalanced JSON
- a package whose `specification`/`config` string cannot be parsed

Those issues are not silently rewritten because doing so can change string content or select the wrong object.

## Allowed automatic preparation repairs

- add `version: "2.0"` only when an unversioned object has an unmistakable components-array shape
- generate stable import IDs for missing 2.0 component IDs
- rename only `meausre→measure`, `catgory→category`, `componets→components`, and `aggregration→aggregation`
- convert unequivocal numeric strings for `span`, `height`, `width`, `limit`, `pageSize`, `maxRows`, `columns`, and `gap`

Every applied repair is returned as a `REPAIR_APPLIED` diagnostic.

## Intentionally forbidden automatic repairs

HyperPBI does not guess fields, aliases, measures, aggregation, dataset sources, definition/pattern names, targets, ArcGIS services, credentials, or business rules. It does not delete components/properties, remove interactions, migrate versions, loosen security, or reinterpret ambiguous syntax.

The external repair prompt follows the same rule: correct only diagnosed issues, preserve valid unrelated content and stable IDs, and preserve a declared 1.0 or 2.0 version.

## Structured diagnostics

Diagnostics include a code, severity, JSON pointer-like path, message, and—where available—component ID, received value, suggestions, and auto-fix availability. Dataset and definition cycles show their chain. Unknown fields in a named dataset identify that dataset scope. External-interaction diagnostics distinguish disabled behavior, missing identities, and a field without a Power BI filter target.

Warnings do not grant permission to remove behavior. Resolve the underlying condition or keep the valid compatibility behavior.
