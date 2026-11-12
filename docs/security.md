# Security model

HyperPBI treats dashboard JSON and pasted AI output as untrusted data by default. Standard mode validates and sanitizes content. Explicit trusted author modes preserve HTML/CSS/SVG inside separate isolation boundaries described below.

## Standard declarative mode

Dashboard JSON cannot supply JavaScript, `eval`, `new Function`, callbacks, formatter functions, inline event handlers, dynamic imports, scripts, iframes, arbitrary DOM code, SQL, credentials, custom request headers, request mutations, or arbitrary network dataset loaders. Read-only remote data is limited to validated `data.sources`.

UI/data interactions are enums and structured payloads. Calculation/condition logic is a finite JSON operator DSL.

## AI and prompt privacy

HyperPBI does not call an AI API, contain an AI key, or send a prompt automatically. The user chooses Field Manifest privacy mode, reviews the prompt, copies it to an externally approved AI, and pastes the result back.

Privacy modes are `samples`, `masked`, `summary`, `fields`, and `types`. Use the least revealing mode that supports the task. Never place credentials, access tokens, private keys, secrets, or sensitive service URLs in dashboard JSON or prompts.

## Response extraction

The importer accepts exactly one JSON object. Multiple objects, arrays/primitives, comments, smart quotes, truncation, and ambiguous fences are diagnostics—not silently interpreted. Packaged `specification`/`config` strings are parsed as JSON rather than executed.

## HTML sanitizer

Normal HTML is DOMPurify-sanitized. It forbids script, iframe, object/embed, link/meta/base, form controls, and style elements; raw style/srcset/form-action/xlink attributes are blocked. Data attributes are disabled and ARIA attributes are allowed.

Normal URL policy permits fragment/root/relative and mailto forms; external images are not enabled by default. Trusted mode is an explicit Runtime Config selection and uses a separate document renderer; it does not bypass browser or Power BI security.

## CSS parser, allowlist, and scope

Standard CSS is parsed with `css-tree`; parse failure returns empty CSS with a warning. It removes `@import`, `@font-face`, namespace, document, and page rules. Only an explicit property set and safe custom properties survive in Standard mode.

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

Declarative `svg` passes a strict element/property/binding/animation schema. Standard raw `svgMarkup` must be one parseable SVG document and passes XML parsing, element/attribute allowlists, local-ID isolation/reference rewriting, depth/path/element limits, external-value rejection, and a final DOMPurify SVG pass.

Inline `svgBinding` always passes this sanitizer, including in Trusted SVG mode. HyperPBI translates a bounded subset of numeric opacity and dash-offset animations into scoped CSS before inserting the sanitized diagram. With `svgBinding.renderMode: "image"`, HyperPBI parses and bounds the SVG, removes scripts, event handlers, and foreign HTML, and displays it only as an isolated image. The browser's SVG image context disables script execution, link interaction, and external resource loading. [SVG 2 processing modes](https://www.w3.org/TR/SVG2/conform.html#secure-animated-mode)

Scripts, handlers, style, foreignObject, link/image/use, audio/video/canvas, external resources, animation elements, unsafe transforms, unknown references, and field-injected path data are blocked. Exact limits are in [SVG visuals](svg-visuals.md).

## Embedded 3D models

`scene3d` loads bounded, self-contained glTF 2.0 files from bytes embedded in the specification. It checks buffers, texture headers, node hierarchy, and geometry budgets before passing bytes to the local loader. The loader accepts validated embedded resources and its own temporary blob URLs. A dashboard cannot supply a model URL, decoder, script, or callback. See the [model limits](scene3d.md#import-models).

## URL restrictions

`safeUrl` rejects JavaScript, VBScript, file URLs, and all data URLs except explicitly enabled base64 PNG/GIF/JPEG/WebP images. HTTP(S) requires an explicit allow-external option. Fragment/root/relative URLs are the safe default.

HTML, ECharts, SVG, map services, and providers apply stricter context-specific policies on top of this helper.

## ArcGIS/provider policy

ArcGIS URLs must be HTTPS, contain no embedded username/password, and match the package's host patterns. Power BI WebAccess declarations use exact hosts or one leading subdomain wildcard on a real parent domain; an all-host `https://*` declaration is not supported. Runtime still enforces HTTPS/no credentials, and configured patterns may not contain a path/query/hash.

Core has no WebAccess. Maps packages declare essential WebAccess for their explicit host list. Power BI host or tenant-admin denial still disables external providers.

Basemap tiles, geocoding, and ArcGIS feature/tile/dynamic services use independent effective access decisions. ArcGIS services are authorized by sanitized HTTPS origin and never inherit the configured basemap provider's tile permission. Credential-bearing URLs are rejected, and provider diagnostics do not echo tokens or query strings.

Geocoding is user-triggered, has no autocomplete, requires privacy acknowledgment, and is rate-limited/cached according to provider configuration. Dashboard JSON must not contain service credentials.

## Data boundaries

Logical datasets are deterministic transformations of an already-resolved source. They cannot execute SQL, join arbitrary network data, read files, create requests, attach credentials, or mutate the semantic model. Remote fetching occurs only in the separate read-only source layer before dataset evaluation.

The visual receives one flattened Power BI data view. Per-layer map datasets can filter, derive, select, group, and aggregate those received rows, but cannot independently query arbitrary model tables or bypass semantic-model relationships. Grouped identity lineage is retained only from identities Power BI supplied.

External filters require a true model-column target. Dataset-derived fields/metrics and model measures cannot be smuggled into Power BI filter schemas. External identity selection uses host-provided identities/source lineage only.

## Core versus Maps

| Boundary | Core | Maps |
|---|---|---|
| Bound Power BI geometry | Yes | Yes |
| WebAccess privilege | None | Broad or restricted HTTPS hosts |
| External tiles/services | No | Subject to host/runtime policy |
| Geocoder | No | User-triggered and policy-gated |
| Standard dashboard JavaScript | No | No |
| Explicit trusted author documents | Sandboxed; host policy applies | Sandboxed; host policy applies |
| Credentials in JSON | No | No |

These profiles affect network privileges. Trusted author selections remain separate from package choice; neither package grants access to report credentials, model queries or host services from author documents.

Map Studio edits canonical JSON and does not store credentials or hidden provider configuration. Popup HTML passes the existing sanitizer; popup actions use the safe UI-action allowlist. Normal viewer diagnostics expose only sanitized service origins. Geocoding endpoint, privacy, cache, and rate-limit behavior is unchanged by layer authoring.

## Trusted author documents

Standard mode remains the default. Explicit Runtime Config selections `security.htmlMode: "trusted"`, `security.cssMode: "trusted"`, and `security.svgMode: "trusted"` opt into separate authoring capabilities. HTML still requires `enableHtml`; trusted HTML/SVG documents do not use the Standard inline-SVG/image allowlists.

Trusted HTML (including custom/repeat/slot content) and raw SVG preserve authored markup in an iframe with `sandbox="allow-forms allow-downloads"`, without same-origin, top navigation, popups, or a report-service bridge. Forms, inputs, iframes, media, custom attributes, foreignObject, filters, symbols, use references, and animations remain intact. Scripts and event handlers cannot execute, including in trusted mode. Only explicitly templated field values are passed; credentials, host APIs and the full model are never provided. Sandboxed custom content does not automatically emit Power BI selections; use native components for report interactions.

Templates bind after HTML parsing: text and non-executable attributes are data. Templates in script/style, event handlers, srcdoc, attribute/element names or unsafe URL attributes produce an explicit error. Never interpolate model values as author code.

Trusted CSS preserves native CSS including imports, fonts, keyframes, custom properties, fixed positioning and selectors. The visual uses a Shadow DOM inside an outer paint/layout containment boundary; trusted HTML/SVG have their own document stylesheet. Standard CSS keeps its existing sanitizer. Structured SVG remains the declarative interaction-capable renderer; use `svgMarkup` plus trusted SVG mode for arbitrary authored SVG.

Browser CSP, CORS, frame policies, Power BI WebAccess permissions, report sandbox and tenant restrictions still apply. A loaded frame does not prove that every subresource loaded. Each trusted document exposes these limitations in its notice; HyperPBI does not strip trusted content or claim to override the host. External content cannot read its parent's report DOM; authors remain responsible for third-party resources they choose to include.

## Dynamic Content

Dynamic Content checks the literal HTTPS origin before issuing anonymous GET. Encoded scalar bindings occupy path or query values. Requests omit credentials and reject redirects. Power BI requires the Maps build and runtime WebAccess. CORS still applies. Responses cannot grant permissions, trigger nested requests, or act on the model. [Dynamic Content guide](remote-fragments.md).
