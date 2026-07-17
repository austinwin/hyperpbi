# AI authoring in HyperPBI

HyperPBI is a prompt builder, validator, and renderer. It does not call an AI API, store an AI key, or send data automatically. A user reviews and copies a generated prompt to an externally approved AI, then pastes one response back into Studio.

The normal Edit Mode path stays in **Guided Builder**. Select **Advanced controls**, then **Create → AI Builder**, when a job needs targeted component selection or the surrounding expert workspaces. Both paths use the same prompt composer and validation pipeline; the advanced navigation does not create a second authoring model.

## Prompt jobs and output contracts

| Job | Context included | Required AI output |
|---|---|---|
| Create dashboard | Goal, viewport, Field Manifest, relevant modules | One complete 2.0 specification |
| Improve current dashboard | Current complete JSON plus intent | One complete updated specification; preserve version/IDs/unrelated behavior |
| Add section | Intent and insertion context | One validated section package with an explicit insertion target |
| Redesign selected section | Selected stable ID and intent | One replacement component/section using the same ID |
| Repair invalid JSON | Invalid JSON/fragment and structured diagnostics | One complete corrected specification; no JSON Patch |

Create defaults to version 2.0. Improvement preserves the current schema version, including 1.0, unless intentional migration is requested. Normal improvement and repair jobs never ask for JSON Patch.

## Prompt composition

`promptComposer.ts` builds a modular prompt instead of dumping the complete product documentation:

- root 2.0/output contract
- user goal, audience, decisions, entity, application type, layout, viewport, device priority, and required sections/filters/KPIs
- Field Manifest under the selected privacy mode
- logical dataset language only when calculations/grouping/dataset intent makes it relevant
- application patterns recommended from available semantic field roles
- a relevant subset of component types with validator-derived required/allowed properties
- design-system guidance
- interaction/security modules
- conditional map, table, chart, advanced-chart, and SVG modules
- complete current specification for improvement
- selected stable ID for section redesign
- structured diagnostics for repair

The relevant component set always includes foundational layout/display types and expands from the requested features. SVG guidance is selected from explicit SVG/animation/diagram/schematic intent; `svgMarkup` remains an explicit advanced fallback.

Prompt quality checks verify that field aliases, goal, components, JSON-only output, JavaScript prohibition, version contract, needed dataset language, conditional map policy, interaction/security rules, and improvement-only current JSON are present.

## Field Manifest

Each manifest entry can include:

- `alias`: authoring key
- canonical `key`
- display/query/source table/source column/qualified names
- dimension/measure/schema type and `kind`
- data type, format, roles, and semantic role
- default aggregation
- `queryAggregation` and `isImplicitAggregation`
- origin
- identity-selection and external-filter capability
- privacy-controlled data profile

Aliases are deterministic camel-case identifiers. Collisions are table-qualified, then stably suffixed if still ambiguous. Explicit overrides must match `^[A-Za-z][A-Za-z0-9]*$` and remain unique.

### Privacy modes

The configured modes are `samples`, `masked`, `summary`, `fields`, and `types`. The manifest builder delegates profiles to the privacy mode, while field/type metadata remains available for safe binding. Select only the fields needed for the task. Treat sample-bearing modes as a deliberate disclosure choice.

The prompt is local until copied. HyperPBI does not control the receiving AI service; organizational data-handling policy still applies.

## 2.0 concepts exposed to AI

The generated prompt describes:

- strict root/component properties and stable IDs
- aliases and field origin
- named datasets and exact operation order
- reusable definitions
- the four registered application patterns
- component-selected datasets
- semantic charts and safe presentation options
- native tables/matrix
- map/provider constraints
- governed declarative SVG
- the three independent interaction systems
- root `app`, overlays, and UI actions
- security boundaries

Any type/property/action/dataset operation/pattern/alias/token not listed in the generated prompt is invalid for that job.

### Map authoring

AI-authored maps must use the single Values field-well contract and Field Manifest aliases. Prefer explicit `layers[]`, optional per-layer `dataset`, and per-layer Power BI `source.bindings`. Never depend on or recommend a fixed map bucket, and never apply one global coordinate pair to multiple explicit layers. A layer omitting `dataset` inherits the map dataset and then `powerbi`.

Power BI provides one flattened data view; logical datasets only transform those received rows and cannot independently query arbitrary model tables. ArcGIS reference-only maps require no Values fields; never add unrelated model fields merely to activate an external layer. Map Studio and the preview use the same prepared calculations, Runtime Config aliases/transformations, logical datasets, row keys, and lineage. Use `fieldSource: "powerbi"|"service"|"joined"` wherever supported; never send Power BI keys or joined aliases as ArcGIS service fields. `view.fitPadding` is a ratio from `0` through `0.5` (normally `0.08`), not pixels. Stable point symbols are `circle`, `square`, `diamond`, and `triangle`; cluster labels support `count` and numeric `sum`.

ArcGIS metadata fetch, bounded join preview, interaction compatibility, and live-view bookmark capture are explicit Map Studio workflows, not extra persisted metadata. Never invent a service URL, host, token, credential, layer ID, join field, relationship, unsupported analytical tool, secured-service behavior, or experimental renderer guarantee. Use bounded `maxFeatures`/labels/classes, acknowledge partial or experimental capability diagnostics, and do not author deprecated generalization or progressive-rendering properties. Geocoder policy and behavior are unchanged.

Map Studio validates every draft against the exact current Runtime Config supplied by its owner; do not synthesize or assume a default configuration. ArcGIS service inspection makes one root request, classifies groups, spatial layers, and tables, and fetches item metadata only after a selectable spatial layer is chosen. Map-layer interactions support `click` only. Join cardinality, unmatched-row policy, aggregation diagnostics, and class-break warnings are enforced by the shared runtime path. External tile and dynamic layers are reactive: stable definitions are reused, while meaningful URL, layer, request, opacity, visibility, scale, or access-policy changes replace or remove the mounted instance. Diagnostics use canonical JSON Pointer paths and stay scoped to the selected layer.

## Current-spec and selected-section behavior

Improve prompts include the complete current specification and explicitly require a complete updated object. The AI must preserve stable IDs for unchanged components and retain unrelated content.

Redesign prompts include the selected component ID and request one replacement using that ID. The importer/inspector then validates the complete specification after insertion; a fragment is never treated as a standalone saved dashboard.

Add-section output is intentionally different from a complete-dashboard response: it must name an insertion target so Studio does not guess where the new section belongs.

## Safe response extraction

The importer:

1. removes a UTF-8 BOM and surrounding whitespace
2. accepts one direct JSON object
3. accepts one fenced JSON block
4. when prose surrounds the response, scans balanced quoted/braced objects
5. accepts exactly one parseable object
6. unwraps an optional `{specification, config}` export package, parsing string values when necessary
7. returns canonical pretty JSON

An array/primitive, multiple candidate objects, multiple ambiguous fences, truncation/unbalanced quotes, comments, or smart quotes produces diagnostics. The extractor does not silently rewrite those forms.

## Validation and preparation

The AI response passes preparation, dataset schemas, strict schema validation, calculation validation, and reference validation. Structured diagnostics retain code, severity, JSON path, optional component ID, received value, suggestions, and auto-fix availability.

The last valid saved specification remains intact when import/preview fails.

## Bounded automatic repairs

Preparation may:

- add version 2.0 when an unversioned object clearly has a components array
- generate missing 2.0 component IDs during import
- correct `meausre`, `catgory`, `componets`, and `aggregration`
- convert numeric strings for bounded numeric properties

It will not:

- repair comments, smart quotes, truncation, or multiple objects
- guess an alias/model field
- change aggregation or business logic
- invent/delete components
- remove unknown content simply to make validation pass
- weaken sanitizers or host policy
- migrate 1.0 to 2.0 without intent

## Repair prompt

The repair prompt includes structured diagnostics, warnings, a types-only Field Manifest, relevant affected IDs, registered patterns, the invalid JSON/fragment, and a version-preservation rule. The response must be one complete corrected object and must preserve valid unrelated content.

See [Repair workflow](repair-workflow.md), [ChatGPT guideline](chatgpt-guideline.md), and the generated [AI skill](hyperpbi-ai-skill.md).
# Targeted change packages

`redesign-section` requires a selected stable component ID and returns `operation: "replace"`. `add-section` selects before, after, or inside. Before/after use `insertBefore|insertAfter` with `targetId`; inside uses `appendChild` with a descriptor-compatible relative `containerPath` such as `children`, `footer`, `tabs/1/content`, or `items/0/children`. Root insertion uses `appendRoot` with exactly `components`, `toolbar`, `leftPanel`, or `rightPanel`. Paths reject absolute, parent, empty-segment, and undeclared traversal.

Packages use `kind: "hyperpbi-change"`; operation-specific validation rejects unknown or forbidden properties. Replacement IDs must match the target, sibling targets must belong to an ordered component array, and all inserted IDs are checked recursively for collisions. Studio mutates a clone, prepares and validates the complete resulting dashboard with current data and aliases, then presents the operation, target/path, mutation summary, and warnings. A successful **Validate resulting dashboard & Preview** promotes exactly that prepared result to both the working JSON and preview. The shell reports **Preview current** only while that preview still matches the working specification and Runtime settings; a subsequent edit reports **Preview out of date** and retains the last valid result for comparison. A failed preview preserves the current dashboard and supplies the package, target, operation, and resulting-dashboard diagnostics to a targeted repair prompt. **Save & return** revalidates the current candidate and persists it only when that validation succeeds.
