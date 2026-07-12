# AI authoring in HyperPBI

HyperPBI is a prompt builder, validator, and renderer. It does not call an AI API, store an AI key, or send data automatically. A user reviews and copies a generated prompt to an externally approved AI, then pastes one response back into Studio.

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
