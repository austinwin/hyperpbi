# Repair workflow

The importer accepts plain JSON, one Markdown JSON fence, or one unambiguous object surrounded by brief prose. It removes only a BOM, surrounding whitespace, or one fence. Multiple objects, competing fences, truncation, comments, smart quotes, invalid quotes, and trailing commas produce structured diagnostics instead of silent broad rewrites.

Safe, listed repairs include an unambiguous missing version, generated missing component IDs, a very high-confidence property typo, and an unequivocal numeric-string conversion. Every performed repair is shown. HyperPBI never substitutes fields, changes aggregations, deletes components, removes interactions, or rewrites business logic automatically.

**Copy repair prompt** includes the affected JSON, structured diagnostics, valid aliases, relevant contract, and JSON-only output requirement. Invalid specifications cannot be saved.
