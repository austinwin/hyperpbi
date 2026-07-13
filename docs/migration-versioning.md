# Migration and versioning

HyperPBI supports two dashboard schema versions. Version 2.0 is the default for new authoring; version 1.0 remains a legitimate compatibility format.

## Version 2.0

Version 2.0 adds strict unknown-property handling, stable global component IDs, Field Manifest aliases, named logical datasets, reusable definitions, registered application patterns, component dataset scope, structured diagnostics, and a bounded repair workflow.

New authoring starts with:

```json
{
  "version": "2.0",
  "components": []
}
```

## Version 1.0 compatibility

Existing 1.0 dashboards can continue using canonical normalized runtime keys and lenient component properties. Compatibility migrations include:

- tabs using `components` or `content` instead of `children`
- accordion components with children but no item array
- drawer/filterDrawer behavior
- stepper compatibility rendering
- button/buttonGroup `action` and `actionValue`
- `table.engine: "tabulator"` normalized to the supported native table
- legacy map `settings`, `style`, and `popup`
- deprecated component `internal`, `external`, `selectable`, and table `selectionMode`

These references should be labeled compatibility/history. They are not the primary 2.0 examples.

## Preparation behavior

An object without a version is assigned 1.0 by the legacy migration layer, except the bounded import repair may first add 2.0 when a components-array shape is unambiguous. Existing declared versions are preserved.

For 1.0, legacy field references are migrated against the current normalized data. For 2.0, aliases resolve during preparation and unknown properties/fields are errors.

Definitions and patterns expand before rendering; datasets are schema-resolved; fields are validated in dataset scope; and the prepared runtime schema still uses the existing renderer.

## Improvement versus migration

An Improve current dashboard prompt preserves the existing version. A repair prompt also preserves a detected/declared version. This avoids silently changing field semantics, IDs, or lenient legacy properties.

An intentional 1.0 → 2.0 migration should:

1. capture the Field Manifest and replace legacy references with supplied aliases
2. assign and review stable unique IDs
3. replace deprecated interaction flags with `interaction`
4. normalize tabs, accordion, table, drawer/stepper, and map compatibility forms where desired
5. remove properties not allowed by the strict per-type validator
6. introduce datasets/definitions/patterns only when they preserve behavior
7. validate the complete migrated specification and manually compare interactions/output

Never infer a field mapping or business aggregation merely to satisfy strict validation.
# Version and maturity distinctions

Dashboard schema version (`1.0` or `2.0`), PBIVIZ package version, and product naming are separate. Studio reports the authored schema and preview/save state independently. Component maturity is also separate from authoring complexity: stable meets the complete renderer/schema/fields/Inspector/example/responsive/empty/accessibility/test/documentation bar; beta is implemented but misses part of that bar; experimental is intentionally unstable; legacy is compatibility-only; deprecated is migration/warning-only.
