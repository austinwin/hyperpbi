# Security model

HyperPBI treats dashboard JSON and pasted AI output as untrusted data. It validates declarative structures and never provides a user-code sandbox.

## No executable dashboard code

Dashboard JSON cannot supply JavaScript, `eval`, `new Function`, callbacks, formatter functions, inline event handlers, dynamic imports, scripts, iframes, arbitrary DOM code, SQL, or network dataset loaders.

UI/data interactions are enums and structured payloads. Calculation/condition logic is a finite JSON operator DSL.

## AI and prompt privacy

HyperPBI does not call an AI API, contain an AI key, or send a prompt automatically. The user chooses Field Manifest privacy mode, reviews the prompt, copies it to an externally approved AI, and pastes the result back.

Privacy modes are `samples`, `masked`, `summary`, `fields`, and `types`. Use the least revealing mode that supports the task. Never place credentials, access tokens, private keys, secrets, or sensitive service URLs in dashboard JSON or prompts.

## Response extraction

The importer accepts exactly one JSON object. Multiple objects, arrays/primitives, comments, smart quotes, truncation, and ambiguous fences are diagnostics—not silently interpreted. Packaged `specification`/`config` strings are parsed as JSON rather than executed.

## HTML sanitizer

Normal HTML is DOMPurify-sanitized. It forbids script, iframe, object/embed, link/meta/base, form controls, and style elements; raw style/srcset/form-action/xlink attributes are blocked. Data attributes are disabled and ARIA attributes are allowed.

Normal URL policy permits fragment/root/relative and mailto forms; external images are not enabled by default. Trusted/internal modes are implementation-controlled, not a dashboard option for bypassing security.

## CSS parser, allowlist, and scope

CSS is parsed with `css-tree`; parse failure returns empty CSS with a warning. It removes `@import`, `@font-face`, namespace, document, and page rules. Only an explicit property set (or safe custom properties in trusted mode) survives.

The sanitizer blocks:

- external/malformed `url()` values (only explicitly allowed local SVG fragments can pass)
- `expression()`/`behavior`/JavaScript forms
- `position: fixed`
- absolute z-index over 100
- unsafe/unbounded animation duration, delay, iteration, or easing
- infinite shorthand animations in ordinary scoped CSS

Selectors are scoped beneath the visual/component selector. Keyframes are namespaced and references rewritten. Style objects pass the same declaration checks.

## Safe ECharts options

ECharts option objects are recursively copied. Functions disappear. Prototype/constructor keys, `renderItem`, event keys, URL/source/background-image keys, and keys beginning with event-handler patterns are blocked. Executable markup and external/protocol-relative URL strings are removed. Strings and arrays are bounded.

Only an allowlisted series-type set passes. Semantic chart options cannot replace generated dataset/transform, axis data/type, series type/data/links/nodes/edges/source/encode/transform/dimensions, radar indicators, or series count. `advancedChart` remains JSON-only and subject to the same recursive sanitizer.

## SVG sanitizer and limits

Declarative `svg` passes a strict element/property/binding/animation schema. Raw `svgMarkup` must be one parseable SVG document and passes XML parsing, element/attribute allowlists, local-ID isolation/reference rewriting, depth/path/element limits, external-value rejection, and a final DOMPurify SVG pass.

Scripts, handlers, style, foreignObject, link/image/use, audio/video/canvas, external resources, animation elements, unsafe transforms, unknown references, and field-injected path data are blocked. Exact limits are in [SVG visuals](svg-visuals.md).

## URL restrictions

`safeUrl` rejects JavaScript, VBScript, file URLs, and all data URLs except explicitly enabled base64 PNG/GIF/JPEG/WebP images. HTTP(S) requires an explicit allow-external option. Fragment/root/relative URLs are the safe default.

HTML, ECharts, SVG, map services, and providers apply stricter context-specific policies on top of this helper.

## ArcGIS/provider policy

ArcGIS URLs must be HTTPS, contain no embedded username/password, and match the package's host patterns. Broad Maps mode may grant `https://*`, but runtime still enforces HTTPS/no credentials. Restricted patterns can be exact hosts or one leading subdomain wildcard and may not contain a path/query/hash.

Core has no WebAccess. Maps packages add optional WebAccess for broad or restricted hosts. Power BI host denial still disables external providers.

Basemap tiles, geocoding, and ArcGIS feature/tile/dynamic services use independent effective access decisions. ArcGIS services are authorized by sanitized HTTPS origin and never inherit the configured basemap provider's tile permission. Credential-bearing URLs are rejected, and provider diagnostics do not echo tokens or query strings.

Geocoding is user-triggered, has no autocomplete, requires privacy acknowledgment, and is rate-limited/cached according to provider configuration. Dashboard JSON must not contain service credentials.

## Data boundaries

Logical datasets are deterministic in-memory transformations of the current Power BI data view. They cannot execute SQL, join network data, read files, fetch URLs, or mutate the semantic model.

The visual receives one flattened Power BI data view. Per-layer map datasets can filter, derive, select, group, and aggregate those received rows, but cannot independently query arbitrary model tables or bypass semantic-model relationships. Grouped identity lineage is retained only from identities Power BI supplied.

External filters require a true model-column target. Dataset-derived fields/metrics and model measures cannot be smuggled into Power BI filter schemas. External identity selection uses host-provided identities/source lineage only.

## Core versus Maps

| Boundary | Core | Maps |
|---|---|---|
| Bound Power BI geometry | Yes | Yes |
| WebAccess privilege | None | Broad or restricted HTTPS hosts |
| External tiles/services | No | Subject to host/runtime policy |
| Geocoder | No | User-triggered and policy-gated |
| Dashboard JavaScript | No | No |
| Credentials in JSON | No | No |

These profiles affect network privilege only; neither relaxes JSON, HTML, CSS, chart, SVG, interaction, or dataset safety.

Map Studio edits canonical JSON and does not store credentials or hidden provider configuration. Popup HTML passes the existing sanitizer; popup actions use the safe UI-action allowlist. Normal viewer diagnostics expose only sanitized service origins. Geocoding endpoint, privacy, cache, and rate-limit behavior is unchanged by layer authoring.
